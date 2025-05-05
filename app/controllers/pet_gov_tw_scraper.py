"""
寵物登記管理資訊網爬蟲控制器
專門用於抓取 https://www.pet.gov.tw/Web/O302.aspx 的數據
"""

import requests
import logging
import time
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Any, Tuple

from app.models.data_model import ScrapedData, ScrapedItem
from app.utils.helpers import random_delay, clean_text

# 設定日誌
logger = logging.getLogger('pet_gov_tw_scraper')


class PetGovTwScraper:
    """寵物登記管理資訊網爬蟲"""
    
    BASE_URL = "https://www.pet.gov.tw/Web/O302.aspx"
    
    def __init__(self):
        """初始化爬蟲"""
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                         '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.pet.gov.tw/Web/O302.aspx',
            'Origin': 'https://www.pet.gov.tw',
            'Connection': 'keep-alive',
        }
        self.data = ScrapedData(source_url=self.BASE_URL)
        
    def get_initial_state(self) -> Dict[str, str]:
        """獲取初始頁面狀態和表單數據
        
        Returns:
            包含表單隱藏字段的字典，用於後續提交
        """
        try:
            # 獲取初始頁面
            response = self.session.get(self.BASE_URL, headers=self.headers)
            response.raise_for_status()
            
            # 使用 BeautifulSoup 解析頁面
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 獲取表單隱藏字段
            form_data = {}
            for input_tag in soup.select('input[type="hidden"]'):
                name = input_tag.get('name')
                value = input_tag.get('value', '')
                if name:
                    form_data[name] = value
                    
            # 獲取 __VIEWSTATE 和 __EVENTVALIDATION
            viewstate = soup.select_one('#__VIEWSTATE')
            eventvalidation = soup.select_one('#__EVENTVALIDATION')
            
            if viewstate:
                form_data['__VIEWSTATE'] = viewstate.get('value', '')
            if eventvalidation:
                form_data['__EVENTVALIDATION'] = eventvalidation.get('value', '')
                
            return form_data
            
        except Exception as e:
            logger.error(f"獲取初始狀態時出錯: {e}")
            raise
            
    def fetch_data_by_date_range(self, start_date: str, end_date: str) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
        """根據日期範圍獲取數據
        
        Args:
            start_date: 開始日期，格式 'yyyy/MM/dd'
            end_date: 結束日期，格式 'yyyy/MM/dd'
            
        Returns:
            Tuple[List[Dict[str, Any]], Dict[str, str]]: 包含數據列表和下一次請求的表單數據的元組
        """
        try:
            # 獲取初始表單數據
            form_data = self.get_initial_state()
            
            # 設置查詢參數
            form_data['ctl00$ContentPlaceHolder1$txtSDATE'] = start_date
            form_data['ctl00$ContentPlaceHolder1$txtEDATE'] = end_date
            form_data['ctl00$ContentPlaceHolder1$btnQuery'] = '查詢'
            
            # 提交查詢
            response = self.session.post(
                self.BASE_URL,
                data=form_data,
                headers=self.headers
            )
            response.raise_for_status()
            
            # 解析結果頁面
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 更新表單數據用於下一次請求
            new_form_data = {}
            for input_tag in soup.select('input[type="hidden"]'):
                name = input_tag.get('name')
                value = input_tag.get('value', '')
                if name:
                    new_form_data[name] = value
                    
            # 解析數據表格
            data_list = []
            table = soup.select_one('table.table')
            
            if table:
                rows = table.select('tbody tr')
                headers = [th.text.strip() for th in table.select('thead th')]
                
                for row in rows:
                    cells = row.select('td')
                    if len(cells) >= len(headers):
                        row_data = {}
                        for i, cell in enumerate(cells):
                            header = headers[i] if i < len(headers) else f"column_{i}"
                            row_data[header] = clean_text(cell.text.strip())
                        data_list.append(row_data)
            
            return data_list, new_form_data
            
        except Exception as e:
            logger.error(f"獲取數據時出錯 ({start_date} - {end_date}): {e}")
            return [], {}
            
    def scrape_yearly_data(self, start_year: int, end_year: int = None) -> List[Dict[str, Any]]:
        """爬取指定年份範圍的數據
        
        Args:
            start_year: 開始年份
            end_year: 結束年份，默認為當前年份
            
        Returns:
            List[Dict[str, Any]]: 包含所有年份數據的列表
        """
        # 如果未指定結束年份，使用當前年份
        if end_year is None:
            end_year = datetime.now().year
            
        all_data = []
        
        for year in range(start_year, end_year + 1):
            logger.info(f"爬取 {year} 年的數據...")
            
            # 設置日期範圍
            start_date = f"{year}/01/01"
            end_date = f"{year}/12/31"
            
            # 獲取數據
            year_data, _ = self.fetch_data_by_date_range(start_date, end_date)
            
            if year_data:
                # 添加年份信息
                for item in year_data:
                    item['年份'] = str(year)
                all_data.extend(year_data)
                logger.info(f"成功獲取 {year} 年數據，共 {len(year_data)} 條記錄")
            else:
                logger.warning(f"未獲取到 {year} 年的數據")
                
            # 添加延遲，避免頻繁請求
            random_delay(2.0, 5.0)
            
        # 將收集到的數據轉換為模型對象
        for item_data in all_data:
            # 將原始數據存儲到 extra_data
            item = ScrapedItem(
                title=f"{item_data.get('年份', '')}年 {item_data.get('縣市', '全國')}寵物登記數據",
                link=self.BASE_URL,
                description=f"登記數: {item_data.get('登記數(A)', '0')}, 絕育率: {item_data.get('絕育率(E-F)/(A-B)', '0')}%",
                date=item_data.get('年份', ''),
                extra_data=item_data
            )
            self.data.add_item(item)
            
        return all_data
        
    def run(self, start_year: int = 2000, end_year: int = None) -> ScrapedData:
        """執行爬蟲
        
        Args:
            start_year: 開始年份，默認為2000年
            end_year: 結束年份，默認為當前年份
            
        Returns:
            爬取的數據
        """
        try:
            logger.info(f"開始爬取寵物登記數據 (從 {start_year} 到 {end_year or '現在'})")
            self.scrape_yearly_data(start_year, end_year)
            logger.info(f"爬取完成，共獲取 {len(self.data.items)} 條數據")
            return self.data
        except Exception as e:
            logger.error(f"爬蟲執行失敗: {e}")
            self.data.error = str(e)
            return self.data

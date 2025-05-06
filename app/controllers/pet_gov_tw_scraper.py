"""
寵物登記管理資訊網爬蟲控制器
專門用於抓取 https://www.pet.gov.tw/Web/O302.aspx 的數據
"""

import requests
import logging
import time
import json
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Any, Tuple, Literal
import re

from app.models.data_model import ScrapedData, ScrapedItem
from app.utils.helpers import random_delay, clean_text

# 設定日誌
logger = logging.getLogger('pet_gov_tw_scraper')

# 動物類型常數
ANIMAL_TYPE = {
    "DOG": "0",
    "CAT": "1",
    "ALL": "2"  # 合計，將分別爬取狗和貓，然後合併數據
}

class PetGovTwScraper:
    """寵物登記管理資訊網爬蟲"""
    
    BASE_URL = "https://www.pet.gov.tw/Web/O302.aspx"
    API_URL = "https://www.pet.gov.tw/PublicWeb/WebService/O302.asmx/O302_2"
    
    def __init__(self):
        """初始化爬蟲"""
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                         '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.pet.gov.tw/Web/O302.aspx',
            'Origin': 'https://www.pet.gov.tw',
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Connection': 'keep-alive',
        }
        self.data = ScrapedData(source_url=self.BASE_URL)
        
    def get_initial_state(self) -> Dict[str, str]:
        """獲取初始頁面狀態
        
        Returns:
            包含頁面狀態信息的字典
        """
        try:
            # 獲取初始頁面
            response = self.session.get(self.BASE_URL, headers=self.headers)
            response.raise_for_status()
            
            # 使用 BeautifulSoup 解析頁面
            soup = BeautifulSoup(response.text, 'html.parser')
            
            return {"status": "success"}
            
        except Exception as e:
            logger.error(f"獲取初始狀態時出錯: {e}")
            raise
            
    def fetch_data_by_date_range(self, start_date: str, end_date: str, animal_type: str = ANIMAL_TYPE["DOG"]) -> List[Dict[str, Any]]:
        """根據日期範圍和動物類型獲取數據
        
        Args:
            start_date: 開始日期，格式 'yyyy/MM/dd'
            end_date: 結束日期，格式 'yyyy/MM/dd'
            animal_type: 動物類型，'0'表示狗，'1'表示貓
            
        Returns:
            List[Dict[str, Any]]: 包含數據的列表
        """
        try:
            # 獲取初始狀態
            self.get_initial_state()
            
            # 設置請求參數
            params = {
                "SDATE": start_date,
                "EDATE": end_date,
                "Animal": animal_type
            }
            
            # 發送 POST 請求
            response = self.session.post(
                self.API_URL,
                json=params,
                headers=self.headers
            )
            response.raise_for_status()
            
            # 解析 JSON 響應
            result = response.json()
            
            if 'd' in result and result['d']:
                # 使用正則表達式提取表格數據
                table_data = []
                table_html = result['d']
                
                # 使用 BeautifulSoup 解析表格
                soup = BeautifulSoup(table_html, 'html.parser')
                table = soup.find('table')
                
                if table:
                    # 獲取表頭
                    headers = []
                    for th in table.select('thead th'):
                        header_text = clean_text(th.get_text())
                        # 處理帶有換行的標題
                        if '\n' in header_text:
                            parts = header_text.split('\n')
                            header_text = parts[0]
                        # 處理帶有括號的標題
                        if '(' in header_text:
                            header_text = header_text.split('(')[0]
                        headers.append(header_text)
                    
                    # 獲取表格內容
                    for tr in table.select('tbody tr'):
                        row_data = {}
                        cells = tr.select('td')
                        
                        for i, cell in enumerate(cells):
                            if i < len(headers):
                                header = headers[i]
                                # 對於縣市列，獲取縣市名稱
                                if i == 0 and cell.select('a'):
                                    value = clean_text(cell.select_one('a').get_text())
                                else:
                                    value = clean_text(cell.get_text())
                                
                                # 檢查是否為"合計"行
                                if i == 0 and "合計" in value:
                                    row_data["縣市"] = "全國"
                                else:
                                    row_data[header] = value
                        
                        if row_data:  # 確保行數據不為空
                            table_data.append(row_data)
                
                return table_data
            else:
                logger.warning(f"未獲取到有效數據: {result}")
                return []
            
        except Exception as e:
            logger.error(f"獲取數據時出錯 ({start_date} - {end_date}, 動物類型: {animal_type}): {e}")
            return []
            
    def scrape_yearly_data(self, start_year: int, end_year: int = None, animal_types: List[str] = [ANIMAL_TYPE["DOG"], ANIMAL_TYPE["CAT"]]) -> List[Dict[str, Any]]:
        """爬取指定年份範圍和動物類型的數據
        
        Args:
            start_year: 開始年份
            end_year: 結束年份，默認為當前年份
            animal_types: 動物類型列表，默認為[狗, 貓]
            
        Returns:
            List[Dict[str, Any]]: 包含所有年份數據的列表
        """
        # 如果未指定結束年份，使用當前年份
        if end_year is None:
            end_year = datetime.now().year
            
        all_data = []
        
        # 遍歷所有年份和動物類型
        for year in range(start_year, end_year + 1):
            for animal_type in animal_types:
                animal_name = "狗" if animal_type == ANIMAL_TYPE["DOG"] else "貓"
                logger.info(f"爬取 {year} 年的{animal_name}數據...")
                
                # 設置日期範圍 (按年度區分：1月1日至12月31日)
                start_date = f"{year}/01/01"
                end_date = f"{year}/12/31"
                
                # 獲取數據
                year_data = self.fetch_data_by_date_range(start_date, end_date, animal_type)
                
                if year_data:
                    # 添加年份和動物類型信息
                    for item in year_data:
                        item['年份'] = str(year)
                        item['動物類型'] = animal_name
                    all_data.extend(year_data)
                    logger.info(f"成功獲取 {year} 年{animal_name}數據，共 {len(year_data)} 條記錄")
                else:
                    logger.warning(f"未獲取到 {year} 年的{animal_name}數據")
                    
                # 添加延遲，避免頻繁請求
                random_delay(2.0, 5.0)
                
        # 將收集到的數據轉換為模型對象
        for item_data in all_data:
            # 將原始數據存儲到 extra_data
            animal_type = item_data.get('動物類型', '未知')
            city = item_data.get('縣市', '全國')
            year = item_data.get('年份', '')
            
            # 構建標題和描述
            item = ScrapedItem(
                title=f"{year}年 {city}{animal_type}寵物登記數據",
                link=self.BASE_URL,
                description=f"登記數: {item_data.get('登記數', '0')}, 絕育率: {item_data.get('絕育率', '0')}%",
                date=year,
                extra_data=item_data
            )
            self.data.add_item(item)
            
        return all_data
        
    def run(self, start_year: int = 2000, end_year: int = None, animal_types: List[str] = [ANIMAL_TYPE["DOG"], ANIMAL_TYPE["CAT"]]) -> ScrapedData:
        """執行爬蟲
        
        Args:
            start_year: 開始年份，默認為2000年
            end_year: 結束年份，默認為當前年份
            animal_types: 動物類型列表，默認為[狗, 貓]
            
        Returns:
            爬取的數據
        """
        try:
            animal_types_str = "、".join(["狗" if t == ANIMAL_TYPE["DOG"] else "貓" for t in animal_types])
            logger.info(f"開始爬取{animal_types_str}寵物登記數據 (從 {start_year} 到 {end_year or '現在'})")
            self.scrape_yearly_data(start_year, end_year, animal_types)
            logger.info(f"爬取完成，共獲取 {len(self.data.items)} 條數據")
            return self.data
        except Exception as e:
            logger.error(f"爬蟲執行失敗: {e}")
            self.data.error = str(e)
            return self.data

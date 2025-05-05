import requests
from bs4 import BeautifulSoup
import logging
from typing import Optional, Dict, Any, List
from app.models.data_model import ScrapedData, ScrapedItem

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('scraper_controller')


class ScraperController:
    """控制器層：負責處理爬蟲邏輯和數據提取"""
    
    def __init__(self, url: str, headers: Optional[Dict[str, str]] = None):
        """初始化爬蟲控制器
        
        Args:
            url: 目標網站URL
            headers: 請求頭，用於模擬瀏覽器行為
        """
        self.url = url
        self.headers = headers or {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                         '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.data = ScrapedData(source_url=url)
    
    def fetch_page(self) -> Optional[BeautifulSoup]:
        """獲取目標頁面內容
        
        Returns:
            BeautifulSoup物件，用於解析HTML
        """
        try:
            logger.info(f"正在獲取頁面: {self.url}")
            response = requests.get(self.url, headers=self.headers, timeout=10)
            response.raise_for_status()  # 如果請求失敗則拋出異常
            
            soup = BeautifulSoup(response.text, 'html.parser')
            return soup
            
        except Exception as e:
            logger.error(f"獲取頁面時發生錯誤: {e}")
            self.data.error = f"獲取頁面失敗: {str(e)}"
            return None
    
    def parse_data(self, soup: BeautifulSoup) -> None:
        """解析HTML並提取數據
        
        這個方法需要根據目標網站的結構進行自定義
        
        Args:
            soup: BeautifulSoup物件
        """
        try:
            # 這裡的選擇器需要根據目標網站結構進行自定義
            # 這只是一個示例，實際使用時需要根據具體網站進行調整
            for article in soup.select('article.news-item'):
                item = ScrapedItem(
                    title=article.select_one('h2').text.strip(),
                    link=article.select_one('a')['href'],
                    description=article.select_one('p.summary').text.strip() if article.select_one('p.summary') else None,
                    date=article.select_one('time').text.strip() if article.select_one('time') else None
                )
                self.data.add_item(item)
                
            logger.info(f"成功解析 {len(self.data.items)} 個項目")
                
        except Exception as e:
            logger.error(f"解析數據時發生錯誤: {e}")
            self.data.error = f"解析數據失敗: {str(e)}"
    
    def run(self) -> ScrapedData:
        """執行爬蟲流程
        
        Returns:
            ScrapedData: 爬取的數據結果
        """
        soup = self.fetch_page()
        if soup:
            self.parse_data(soup)
        return self.data


# 特定網站的爬蟲實現示例
class ExampleNewsScraper(ScraperController):
    """特定網站的爬蟲實現示例"""
    
    def parse_data(self, soup: BeautifulSoup) -> None:
        """為特定網站自定義解析邏輯"""
        try:
            for article in soup.select('.news-container .news-item'):
                title_elem = article.select_one('.news-title')
                link_elem = article.select_one('a.news-link')
                desc_elem = article.select_one('.news-description')
                date_elem = article.select_one('.news-date')
                
                if title_elem and link_elem:
                    item = ScrapedItem(
                        title=title_elem.text.strip(),
                        link=link_elem['href'],
                        description=desc_elem.text.strip() if desc_elem else None,
                        date=date_elem.text.strip() if date_elem else None
                    )
                    self.data.add_item(item)
            
            logger.info(f"成功解析 {len(self.data.items)} 個新聞項目")
                
        except Exception as e:
            logger.error(f"解析新聞數據時發生錯誤: {e}")
            self.data.error = f"解析新聞數據失敗: {str(e)}"


def create_scraper(site_type: str, url: str) -> ScraperController:
    """工廠方法：根據網站類型創建對應的爬蟲控制器
    
    Args:
        site_type: 網站類型
        url: 目標URL
        
    Returns:
        適合該網站類型的爬蟲控制器實例
    """
    if site_type == 'example_news':
        return ExampleNewsScraper(url)
    # 可以根據需要添加更多類型
    else:
        return ScraperController(url)  # 默認爬蟲

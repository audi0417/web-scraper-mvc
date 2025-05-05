import os
import time
import random
import logging
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse, urljoin

logger = logging.getLogger('scraper_helpers')


def create_directory(directory_path: str) -> None:
    """確保目錄存在，如果不存在則創建
    
    Args:
        directory_path: 目錄路徑
    """
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        logger.info(f"創建目錄: {directory_path}")


def get_absolute_url(base_url: str, relative_url: str) -> str:
    """將相對URL轉換為絕對URL
    
    Args:
        base_url: 基準URL
        relative_url: 相對URL路徑
        
    Returns:
        str: 絕對URL
    """
    if bool(urlparse(relative_url).netloc):
        return relative_url  # 已經是絕對URL
    return urljoin(base_url, relative_url)


def random_delay(min_seconds: float = 1.0, max_seconds: float = 3.0) -> None:
    """隨機延遲，避免請求過於頻繁
    
    Args:
        min_seconds: 最小延遲秒數
        max_seconds: 最大延遲秒數
    """
    delay = random.uniform(min_seconds, max_seconds)
    logger.debug(f"等待 {delay:.2f} 秒...")
    time.sleep(delay)


def clean_text(text: Optional[str]) -> Optional[str]:
    """清理文本，移除多餘的空白字符
    
    Args:
        text: 輸入文本
        
    Returns:
        清理後的文本
    """
    if text is None:
        return None
    return ' '.join(text.split())


def extract_domain(url: str) -> str:
    """從URL中提取域名
    
    Args:
        url: 完整URL
        
    Returns:
        str: 域名
    """
    parsed_url = urlparse(url)
    return parsed_url.netloc


def is_valid_url(url: str) -> bool:
    """檢查URL是否有效
    
    Args:
        url: 待檢查的URL
        
    Returns:
        bool: URL是否有效
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False


def filter_urls(urls: List[str], allowed_domains: Optional[List[str]] = None) -> List[str]:
    """過濾URL列表，只保留指定域名的URL
    
    Args:
        urls: URL列表
        allowed_domains: 允許的域名列表，如果為None則不過濾
        
    Returns:
        List[str]: 過濾後的URL列表
    """
    if allowed_domains is None:
        return [url for url in urls if is_valid_url(url)]
    
    filtered_urls = []
    for url in urls:
        if not is_valid_url(url):
            continue
        
        domain = extract_domain(url)
        if any(domain.endswith(allowed_domain) for allowed_domain in allowed_domains):
            filtered_urls.append(url)
            
    return filtered_urls

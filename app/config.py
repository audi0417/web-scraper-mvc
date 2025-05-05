import os
from typing import Dict, List, Any

# 項目根目錄
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 數據存儲目錄
DATA_DIR = os.path.join(BASE_DIR, 'data')

# 網頁展示目錄
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

# 目標網站配置
TARGET_SITES = {
    'example_news': {
        'url': 'https://example.com/news',
        'selector': {
            'article': '.news-item',
            'title': '.news-title',
            'link': 'a.news-link',
            'description': '.news-description',
            'date': '.news-date'
        },
        'allowed_domains': ['example.com'],
        'use_random_delay': True,
        'min_delay': 1.0,
        'max_delay': 3.0
    },
    # 可以添加更多網站配置
}

# 輸出文件配置
OUTPUT_FILES = {
    'json': os.path.join(DATA_DIR, 'scraped_data.json'),
    'js': os.path.join(PUBLIC_DIR, 'js', 'data.js'),
    'report': os.path.join(DATA_DIR, 'report.txt')
}

# 日誌配置
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'formatter': 'standard',
            'class': 'logging.StreamHandler',
        },
        'file': {
            'level': 'INFO',
            'formatter': 'standard',
            'class': 'logging.FileHandler',
            'filename': os.path.join(DATA_DIR, 'scraper.log'),
            'mode': 'a',
        },
    },
    'loggers': {
        '': {  # root logger
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True
        },
    }
}

# 請求頭配置
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                 '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
}

# 確保目錄存在
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, 'js'), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, 'css'), exist_ok=True)

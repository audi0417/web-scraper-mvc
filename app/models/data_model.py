from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any


@dataclass
class ScrapedItem:
    """單個爬取項目的數據結構"""
    title: str
    link: str
    description: Optional[str] = None
    date: Optional[str] = None
    extra_data: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """將對象轉換為字典"""
        return {
            'title': self.title,
            'link': self.link,
            'description': self.description,
            'date': self.date,
            **self.extra_data
        }


@dataclass
class ScrapedData:
    """爬取數據的集合模型"""
    items: List[ScrapedItem] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.now)
    source_url: Optional[str] = None
    error: Optional[str] = None
    
    def add_item(self, item: ScrapedItem) -> None:
        """添加一個爬取項目"""
        self.items.append(item)
    
    def to_dict(self) -> Dict[str, Any]:
        """將整個數據對象轉換為字典"""
        return {
            'last_updated': self.last_updated.isoformat(),
            'source_url': self.source_url,
            'error': self.error,
            'items': [item.to_dict() for item in self.items]
        }

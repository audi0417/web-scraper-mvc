import json
import os
from datetime import datetime
from app.models.data_model import ScrapedData


class DataFormatter:
    """視圖層：負責將資料格式化為不同的輸出格式"""
    
    @staticmethod
    def format_as_json(data: ScrapedData, output_path: str) -> None:
        """將爬取的數據保存為JSON文件"""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data.to_dict(), f, ensure_ascii=False, indent=2)
            
    @staticmethod
    def format_as_js(data: ScrapedData, output_path: str, variable_name: str = 'scrapedData') -> None:
        """將爬取的數據保存為JavaScript變量聲明，適用於GitHub Pages"""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"const {variable_name} = {json.dumps(data.to_dict(), ensure_ascii=False, indent=2)};\n")
            
    @staticmethod
    def format_report(data: ScrapedData) -> str:
        """格式化為純文本報告"""
        report = []
        report.append(f"爬蟲報告 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"來源: {data.source_url}")
        report.append(f"項目數量: {len(data.items)}")
        report.append("-" * 50)
        
        for i, item in enumerate(data.items, 1):
            report.append(f"{i}. {item.title}")
            if item.date:
                report.append(f"   日期: {item.date}")
            if item.description:
                report.append(f"   描述: {item.description}")
            report.append(f"   連結: {item.link}")
            report.append("")
            
        if data.error:
            report.append(f"錯誤: {data.error}")
            
        return "\n".join(report)

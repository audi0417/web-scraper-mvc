#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging
import os
from app import logger
from app.config import TARGET_SITES, OUTPUT_FILES
from app.controllers.scraper import create_scraper
from app.views.data_formatter import DataFormatter

def main():
    """主函數：運行爬蟲並輸出結果"""
    logger.info("開始執行爬蟲...")
    
    # 從配置中獲取目標網站
    site_config = TARGET_SITES.get('example_news')
    if not site_config:
        logger.error("找不到目標網站配置")
        return
    
    # 創建爬蟲控制器
    scraper = create_scraper('example_news', site_config['url'])
    
    # 執行爬蟲
    data = scraper.run()
    
    # 輸出結果
    if data.items:
        logger.info(f"成功爬取 {len(data.items)} 個項目")
        
        # 保存為JSON
        DataFormatter.format_as_json(data, OUTPUT_FILES['json'])
        logger.info(f"數據已保存為JSON: {OUTPUT_FILES['json']}")
        
        # 保存為JS變量（用於GitHub Pages）
        DataFormatter.format_as_js(data, OUTPUT_FILES['js'])
        logger.info(f"數據已保存為JS變量: {OUTPUT_FILES['js']}")
        
        # 生成報告
        report = DataFormatter.format_report(data)
        with open(OUTPUT_FILES['report'], 'w', encoding='utf-8') as f:
            f.write(report)
        logger.info(f"報告已生成: {OUTPUT_FILES['report']}")
    else:
        logger.warning("未爬取到任何數據")
        if data.error:
            logger.error(f"錯誤信息: {data.error}")
    
    logger.info("爬蟲執行完成")


if __name__ == "__main__":
    main()

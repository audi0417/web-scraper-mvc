#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging
import os
import datetime
import argparse
from app import logger
from app.config import OUTPUT_FILES
from app.controllers.pet_gov_tw_scraper import PetGovTwScraper, ANIMAL_TYPE
from app.views.data_formatter import DataFormatter

def main():
    """主函數：運行爬蟲並輸出結果"""
    # 解析命令行參數
    parser = argparse.ArgumentParser(description='寵物登記資料爬蟲')
    parser.add_argument('--start-year', type=int, default=2000,
                        help='開始年份 (默認: 2000)')
    parser.add_argument('--end-year', type=int,
                        help='結束年份 (默認: 當前年份)')
    parser.add_argument('--output-dir', type=str, default='data',
                        help='輸出目錄 (默認: data)')
    parser.add_argument('--animal-type', type=str, choices=['dog', 'cat', 'all'], default='all',
                        help='動物類型: dog-狗, cat-貓, all-全部 (默認: all)')
    args = parser.parse_args()
    
    # 確保輸出目錄存在
    os.makedirs(args.output_dir, exist_ok=True)
    
    # 設定輸出檔案路徑
    json_path = os.path.join(args.output_dir, 'pet_registration_data.json')
    js_path = os.path.join('public/js', 'pet_registration_data.js')
    report_path = os.path.join(args.output_dir, 'pet_registration_report.txt')
    
    # 獲取當前年份（如果未指定結束年份）
    current_year = datetime.datetime.now().year
    end_year = args.end_year or current_year
    
    # 根據選擇的動物類型設置爬蟲參數
    animal_types = []
    if args.animal_type == 'dog':
        animal_types = [ANIMAL_TYPE["DOG"]]
        animal_type_str = "狗"
    elif args.animal_type == 'cat':
        animal_types = [ANIMAL_TYPE["CAT"]]
        animal_type_str = "貓"
    else:  # 'all'
        animal_types = [ANIMAL_TYPE["DOG"], ANIMAL_TYPE["CAT"]]
        animal_type_str = "狗和貓"
    
    logger.info(f"開始執行{animal_type_str}寵物登記資料爬蟲...")
    logger.info(f"爬取範圍: {args.start_year} 年 至 {end_year} 年")
    
    # 初始化寵物登記網站爬蟲
    scraper = PetGovTwScraper()
    
    # 執行爬蟲
    data = scraper.run(args.start_year, end_year, animal_types)
    
    # 輸出結果
    if data.items:
        logger.info(f"成功爬取 {len(data.items)} 條數據")
        
        # 保存為JSON
        DataFormatter.format_as_json(data, json_path)
        logger.info(f"數據已保存為JSON: {json_path}")
        
        # 保存為JS變量（用於GitHub Pages）
        DataFormatter.format_as_js(data, js_path, 'petRegistrationData')
        logger.info(f"數據已保存為JS變量: {js_path}")
        
        # 生成報告
        report = DataFormatter.format_report(data)
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        logger.info(f"報告已生成: {report_path}")
    else:
        logger.warning("未爬取到任何數據")
        if data.error:
            logger.error(f"錯誤信息: {data.error}")
    
    logger.info("爬蟲執行完成")


if __name__ == "__main__":
    main()

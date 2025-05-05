# 基於MVC架構的自動化網頁爬蟲

這是一個使用MVC（Model-View-Controller）架構設計的自動化網頁爬蟲專案，結合GitHub Actions和GitHub Pages實現定時爬取數據並自動展示。

## 專案特點

- **MVC架構**：清晰的代碼組織結構，便於維護和擴展
- **自動化**：利用GitHub Actions實現定時自動爬取
- **數據展示**：使用GitHub Pages展示爬取的數據
- **零基礎設施**：無需額外的伺服器或資料庫

## 目錄結構

```
web-scraper-mvc/
├── .github/workflows/    # GitHub Actions配置
├── app/                  # 應用程式主目錄
│   ├── models/           # 數據模型
│   ├── views/            # 視圖層
│   ├── controllers/      # 控制器
│   ├── utils/            # 工具函數
│   └── config.py         # 配置文件
├── data/                 # 爬取的數據存儲目錄
├── public/               # GitHub Pages靜態文件
│   ├── css/
│   ├── js/
│   └── index.html
├── main.py               # 入口文件
└── requirements.txt      # 依賴項
```

## 如何使用

1. **克隆儲存庫**

```bash
git clone https://github.com/audi0417/web-scraper-mvc.git
cd web-scraper-mvc
```

2. **安裝依賴**

```bash
pip install -r requirements.txt
```

3. **配置爬蟲目標**

修改 `app/config.py` 中的 `TARGET_SITES` 配置，設定您需要爬取的網站和選擇器。

4. **本地測試**

```bash
python main.py
```

5. **啟用GitHub Pages**

在儲存庫設置中啟用GitHub Pages，選擇從主分支的根目錄發布。

6. **自定義爬蟲頻率**

編輯 `.github/workflows/scraper.yml` 文件中的 `cron` 表達式來調整爬蟲執行的頻率。

## 自定義爬蟲

要添加新的爬蟲，需要:

1. 在 `app/controllers/scraper.py` 中創建一個繼承自 `ScraperController` 的新類
2. 重寫 `parse_data` 方法以適應目標網站的結構
3. 在 `create_scraper` 工廠方法中添加新的爬蟲類型
4. 在 `app/config.py` 中添加新網站的配置

## 注意事項

- 請遵守目標網站的robots.txt規則
- 添加適當的請求延遲以避免對目標網站造成過大負擔
- GitHub Actions有使用時間限制，請確保您的爬蟲在限制範圍內運行

## 貢獻

歡迎提交Issues和Pull Requests來改進這個專案。

## 授權

MIT

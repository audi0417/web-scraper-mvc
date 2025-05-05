# 寵物登記數據爬蟲與視覺化儀表板

這是一個使用MVC（Model-View-Controller）架構設計的自動化網頁爬蟲專案，專門用於抓取台灣寵物登記管理資訊網的狗狗登記數據，結合GitHub Actions和GitHub Pages實現定時爬取數據並通過視覺化儀表板展示。

## 專案特點

- **MVC架構**：清晰的代碼組織結構，便於維護和擴展
- **自動化**：利用GitHub Actions實現每週自動爬取最新數據
- **視覺化儀表板**：使用Chart.js製作互動式圖表展示歷年寵物登記趨勢
- **響應式設計**：儀表板適配各種設備尺寸，提供良好的用戶體驗
- **零基礎設施**：無需額外的伺服器或資料庫，完全基於GitHub平台

## 數據來源

本專案抓取的數據來自[寵物登記管理資訊網](https://www.pet.gov.tw/Web/O302.aspx)，收集從2000年至今各縣市的寵物登記數據，包括：

- 登記數量
- 絕育數量
- 絕育率
- 登記單位數
- 各種相關統計指標

## 目錄結構

```
web-scraper-mvc/
├── .github/workflows/        # GitHub Actions配置
│   ├── scraper.yml           # 通用爬蟲工作流程
│   └── pet_registration_scraper.yml  # 寵物登記爬蟲工作流程
├── app/                      # 應用程式主目錄
│   ├── models/               # 數據模型
│   ├── views/                # 視圖層
│   ├── controllers/          # 控制器
│   │   ├── scraper.py        # 通用爬蟲控制器
│   │   └── pet_gov_tw_scraper.py  # 寵物登記網站專用爬蟲
│   ├── utils/                # 工具函數
│   └── config.py             # 配置文件
├── data/                     # 爬取的數據存儲目錄
├── public/                   # GitHub Pages靜態文件
│   ├── css/
│   │   ├── style.css         # 通用樣式
│   │   └── dashboard.css     # 儀表板專用樣式
│   ├── js/
│   │   ├── dashboard.js      # 儀表板互動功能
│   │   └── pet_registration_data.js  # 爬取的寵物登記數據
│   ├── index.html            # 主頁面
│   └── dashboard.html        # 寵物登記數據儀表板
├── main.py                   # 入口文件
└── requirements.txt          # 依賴項
```

## 儀表板預覽

儀表板頁面展示了台灣各縣市寵物登記的關鍵數據，包括：

- 總登記數量和平均絕育率
- 歷年寵物登記數量趨勢圖
- 各縣市登記數量分佈圓餅圖
- 各縣市絕育率比較條形圖
- 詳細數據表格（可搜尋和分頁）

訪問[寵物登記數據儀表板](https://audi0417.github.io/web-scraper-mvc/dashboard.html)查看最新數據。

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

3. **運行寵物登記爬蟲**

```bash
python main.py --start-year 2000
```

此命令會抓取從2000年至今的寵物登記數據，並將結果保存至data目錄及public/js目錄中。

4. **查看儀表板**

運行爬蟲後，可以在瀏覽器中打開`public/dashboard.html`文件查看儀表板。

5. **部署到GitHub Pages**

```bash
# 假設您已經啟用了GitHub Pages並設置為從gh-pages分支部署
git subtree push --prefix public origin gh-pages
```

或者直接使用GitHub Actions自動部署（已在工作流程中配置）。

## 自定義開發

### 修改爬蟲邏輯

如果寵物登記網站的結構發生變化，您可以修改`app/controllers/pet_gov_tw_scraper.py`文件中的解析邏輯。

### 自定義儀表板

儀表板的視覺效果可以通過編輯`public/css/dashboard.css`進行自定義，互動功能可以修改`public/js/dashboard.js`。

### 調整爬蟲頻率

編輯`.github/workflows/pet_registration_scraper.yml`文件中的`cron`表達式來調整爬蟲執行的頻率，目前設定為每週一午夜執行。

## 注意事項

- 請遵守目標網站的robots.txt規則
- 添加適當的請求延遲以避免對目標網站造成過大負擔
- GitHub Actions有使用時間限制，請確保您的爬蟲在限制範圍內運行

## 貢獻

歡迎提交Issues和Pull Requests來改進這個專案。您可以：

1. 增加更多的數據分析視圖
2. 改進儀表板的響應式設計
3. 擴展爬蟲來收集更多相關數據

## 授權

MIT

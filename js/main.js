/**
 * 寵物登記統計儀表板 - 主模組
 * 負責協調其他模組和初始化應用程序
 */

// 全局變數
let processedData = null;
let filteredData = null;

// 確保數據已載入
document.addEventListener('DOMContentLoaded', function() {
    // 檢查數據是否存在
    if (typeof petRegistrationData === 'undefined') {
        showError('數據載入失敗', '無法載入寵物登記數據，請確認爬蟲已正確執行。');
        return;
    }
    
    // 初始化儀表板
    initDashboard();
});

/**
 * 初始化儀表板
 */
function initDashboard() {
    try {
        // 處理原始數據
        processedData = processData(petRegistrationData);
        filteredData = processedData;
        
        // 填充過濾器選項
        populateFilterOptions(processedData);
        
        // 更新數據卡片
        updateDataCards(processedData);
        
        // 初始化圖表
        initCharts(processedData);
        
        // 填充數據表格
        populateTable(processedData);
        
        // 初始化過濾器功能
        initFilters();
        
        // 初始化表格搜索功能
        initTableSearch();
        
        // 初始化圖表類型選擇器
        initChartTypeSelector();
        
        // 初始化趨勢圖數據類型選擇器
        initTrendDataTypeSelector();
        
        // 初始化年份選擇器
        initYearSelectors();
        
        console.log('儀表板初始化完成');
    } catch (error) {
        console.error('初始化儀表板時出錯:', error);
        showError('初始化錯誤', '初始化儀表板時出錯: ' + error.message);
    }
}

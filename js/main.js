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
        
        // 將處理後的數據設為全局變量，便於其他模塊使用
        window.processedData = processedData;
        window.filteredData = filteredData;
        
        // 填充過濾器選項
        populateFilterOptions(processedData);
        
        // 更新數據卡片
        updateDataCards(processedData);
        
        // 初始化圖表 - 使用 chart-initializer.js 中的函數
        initCharts(processedData);
        
        // 填充數據表格
        populateTable(processedData);
        
        // 初始化過濾器功能
        initFilters();
        
        // 初始化表格搜索功能
        initTableSearch();
        
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

/**
 * 更新表格數據
 * @param {Object} data - 過濾後的數據
 */
function updateTable(data) {
    // 如果表格數據存在，更新它
    if (window.tableDataForSearch) {
        // 更新表格數據
        window.tableDataForSearch.data = [...data.tableData].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return a.city.localeCompare(b.city, 'zh-TW');
        });
        
        // 重新渲染表格
        window.tableDataForSearch.render(1);
    } else {
        // 否則重新填充表格
        populateTable(data);
    }
}
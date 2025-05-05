/**
 * 寵物登記統計儀表板 - 過濾器模組
 * 處理過濾器操作和數據篩選
 */

// 活動過濾條件
let activeFilters = {
    animalType: 'all',
    year: 'all',
    city: 'all'
};

/**
 * 初始化過濾器功能
 */
function initFilters() {
    // 初始化動物類型過濾器
    const animalTypeRadios = document.querySelectorAll('input[name="animal-type"]');
    animalTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            activeFilters.animalType = this.value;
            applyFilters();
        });
    });
    
    // 初始化年份過濾器
    const yearFilter = document.getElementById('year-filter');
    yearFilter.addEventListener('change', function() {
        activeFilters.year = this.value;
        applyFilters();
    });
    
    // 初始化縣市過濾器
    const cityFilter = document.getElementById('city-filter');
    cityFilter.addEventListener('change', function() {
        activeFilters.city = this.value;
        applyFilters();
    });
    
    // 套用過濾器按鈕
    const applyFiltersBtn = document.getElementById('apply-filters');
    applyFiltersBtn.addEventListener('click', function() {
        applyFilters();
    });
    
    // 重置過濾器按鈕
    const resetFiltersBtn = document.getElementById('reset-filters');
    resetFiltersBtn.addEventListener('click', function() {
        resetFilters();
    });
}

/**
 * 套用過濾條件
 */
function applyFilters() {
    // 顯示載入中
    const loadingOverlay = showLoading(document.body);
    
    // 獲取過濾條件
    const animalType = document.querySelector('input[name="animal-type"]:checked').value;
    const year = document.getElementById('year-filter').value;
    const city = document.getElementById('city-filter').value;
    
    // 更新活動過濾條件
    activeFilters = {
        animalType,
        year,
        city
    };
    
    // 過濾數據
    filteredData = filterData(processedData, activeFilters);
    
    // 更新數據卡片
    updateDataCards(filteredData);
    
    // 更新圖表
    updateAllCharts(activeFilters);
    
    // 更新表格
    updateTable(filteredData);
    
    // 隱藏載入中
    setTimeout(() => {
        hideLoading(loadingOverlay);
    }, 300);
}

/**
 * 重置過濾條件
 */
function resetFilters() {
    // 重置動物類型過濾器
    document.getElementById('animal-all').checked = true;
    
    // 重置年份過濾器
    document.getElementById('year-filter').value = 'all';
    
    // 重置縣市過濾器
    document.getElementById('city-filter').value = 'all';
    
    // 重置活動過濾條件
    activeFilters = {
        animalType: 'all',
        year: 'all',
        city: 'all'
    };
    
    // 套用過濾器
    applyFilters();
}

/**
 * 初始化圖表類型選擇器
 */
function initChartTypeSelector() {
    const selector = document.getElementById('chart-type-selector');
    const buttons = selector.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // 更新按鈕狀態
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 獲取圖表類型
            const chartType = this.getAttribute('data-type');
            
            // 更新圖表
            if (charts.registrationTrend) {
                charts.registrationTrend.config.type = chartType;
                charts.registrationTrend.update();
            }
        });
    });
}

/**
 * 初始化趨勢圖數據類型選擇器
 */
function initTrendDataTypeSelector() {
    const selector = document.getElementById('trend-data-type');
    const buttons = selector.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // 更新按鈕狀態
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 獲取數據類型
            const dataType = this.getAttribute('data-type');
            
            // 更新圖表
            updateTrendChartDataType(dataType);
        });
    });
}

/**
 * 初始化年份選擇器
 */
function initYearSelectors() {
    // 初始化各縣市登記數量分佈圖的年份選擇器
    const distributionYearSelector = document.getElementById('distribution-year-selector');
    distributionYearSelector.addEventListener('change', function() {
        updateCityDistributionByYear(this.value);
    });
    
    // 初始化各縣市絕育率比較圖的年份選擇器
    const neuteringYearSelector = document.getElementById('neutering-year-selector');
    neuteringYearSelector.addEventListener('change', function() {
        updateNeuteringRateByYear(this.value);
    });
}

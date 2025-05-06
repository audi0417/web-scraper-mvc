/**
 * 寵物登記統計儀表板JavaScript檔案
 * 處理數據可視化和互動功能
 */

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
        const processedData = processData(petRegistrationData);
        
        // 更新數據卡片
        updateDataCards(processedData);
        
        // 初始化圖表 - 已移至 chart-initializer.js
        // initCharts(processedData);
        
        // 填充數據表格
        populateTable(processedData);
        
        // 初始化表格搜索功能
        initTableSearch();
        
        // 初始化圖表類型選擇器
        initChartTypeSelector();
        
        console.log('儀表板初始化完成');
    } catch (error) {
        console.error('初始化儀表板時出錯:', error);
        showError('初始化錯誤', '初始化儀表板時出錯: ' + error.message);
    }
}

/**
 * 處理原始數據
 * @param {Object} rawData - 爬蟲抓取的原始數據
 * @returns {Object} 處理後的數據
 */
function processData(rawData) {
    // 獲取所有項目
    const items = rawData.items || [];
    
    // 初始化處理結果
    const result = {
        totalRegistrations: 0,
        avgNeuteringRate: 0,
        registrationUnits: 0,
        lastUpdated: rawData.last_updated || new Date().toISOString(),
        
        // 按年份分組的數據
        yearlyData: {},
        
        // 按縣市分組的數據
        cityData: {},
        
        // 扁平化的表格數據
        tableData: []
    };
    
    // 收集所有的年份和縣市
    const years = new Set();
    const cities = new Set();
    
    // 處理每個數據項
    items.forEach(item => {
        const data = item.extra_data || {};
        
        // 獲取基本數據
        const year = data.年份 || '';
        const city = data.縣市 || '';
        const animalType = data.動物類型 || '狗'; // 預設為狗
        const registrations = parseInt(data['登記數(A)'] || 0, 10);
        const neuteringCount = parseInt(data['絕育數(E)'] || 0, 10);
        const neuteringRate = parseFloat(data['絕育率(E-F)/(A-B)'] || 0);
        const registrationUnits = parseInt(data['登記單位數'] || 0, 10);
        
        // 添加到年份和縣市集合
        if (year) years.add(year);
        if (city) cities.add(city);
        
        // 更新總數據
        result.totalRegistrations += registrations;
        
        // 初始化年份數據（如果不存在）
        if (year && !result.yearlyData[year]) {
            result.yearlyData[year] = {
                totalRegistrations: 0,
                dogRegistrations: 0,  // 新增狗登記數
                catRegistrations: 0,  // 新增貓登記數
                avgNeuteringRate: 0,
                dogNeuteringRate: 0,  // 新增狗絕育率
                catNeuteringRate: 0,  // 新增貓絕育率
                citiesCount: 0,
                cityData: {}
            };
        }
        
        // 初始化縣市數據（如果不存在）
        if (city && !result.cityData[city]) {
            result.cityData[city] = {
                totalRegistrations: 0,
                dogRegistrations: 0,  // 新增狗登記數
                catRegistrations: 0,  // 新增貓登記數
                avgNeuteringRate: 0,
                dogNeuteringRate: 0,  // 新增狗絕育率
                catNeuteringRate: 0,  // 新增貓絕育率
                registrationUnits: 0,
                yearlyData: {}
            };
        }
        
        // 初始化年份-縣市數據
        if (year && city) {
            // 更新年份數據
            result.yearlyData[year].totalRegistrations += registrations;
            
            // 根據動物類型更新數據
            if (animalType === '狗') {
                result.yearlyData[year].dogRegistrations += registrations;
                result.cityData[city].dogRegistrations += registrations;
            } else if (animalType === '貓') {
                result.yearlyData[year].catRegistrations += registrations;
                result.cityData[city].catRegistrations += registrations;
            }
            
            result.yearlyData[year].citiesCount += 1;
            
            if (!result.yearlyData[year].cityData[city]) {
                result.yearlyData[year].cityData[city] = {
                    registrations: registrations,
                    dogRegistrations: animalType === '狗' ? registrations : 0,
                    catRegistrations: animalType === '貓' ? registrations : 0,
                    neuteringRate: neuteringRate,
                    dogNeuteringRate: animalType === '狗' ? neuteringRate : 0,
                    catNeuteringRate: animalType === '貓' ? neuteringRate : 0,
                    registrationUnits: registrationUnits
                };
            } else {
                // 更新現有數據
                result.yearlyData[year].cityData[city].registrations += registrations;
                
                if (animalType === '狗') {
                    result.yearlyData[year].cityData[city].dogRegistrations += registrations;
                    result.yearlyData[year].cityData[city].dogNeuteringRate = neuteringRate;
                } else if (animalType === '貓') {
                    result.yearlyData[year].cityData[city].catRegistrations += registrations;
                    result.yearlyData[year].cityData[city].catNeuteringRate = neuteringRate;
                }
                
                result.yearlyData[year].cityData[city].registrationUnits = Math.max(
                    result.yearlyData[year].cityData[city].registrationUnits,
                    registrationUnits
                );
            }
            
            // 更新縣市數據
            result.cityData[city].totalRegistrations += registrations;
            result.cityData[city].registrationUnits = Math.max(result.cityData[city].registrationUnits, registrationUnits);
            
            if (!result.cityData[city].yearlyData[year]) {
                result.cityData[city].yearlyData[year] = {
                    registrations: registrations,
                    dogRegistrations: animalType === '狗' ? registrations : 0,
                    catRegistrations: animalType === '貓' ? registrations : 0,
                    neuteringRate: neuteringRate,
                    dogNeuteringRate: animalType === '狗' ? neuteringRate : 0,
                    catNeuteringRate: animalType === '貓' ? neuteringRate : 0
                };
            } else {
                // 更新現有數據
                result.cityData[city].yearlyData[year].registrations += registrations;
                
                if (animalType === '狗') {
                    result.cityData[city].yearlyData[year].dogRegistrations += registrations;
                    result.cityData[city].yearlyData[year].dogNeuteringRate = neuteringRate;
                } else if (animalType === '貓') {
                    result.cityData[city].yearlyData[year].catRegistrations += registrations;
                    result.cityData[city].yearlyData[year].catNeuteringRate = neuteringRate;
                }
            }
            
            // 添加到表格數據
            result.tableData.push({
                city: city,
                year: year,
                animalType: animalType,
                registrations: registrations,
                neuteringCount: neuteringCount,
                neuteringRate: neuteringRate,
                registrationUnits: registrationUnits
            });
        }
    });
    
    // 計算平均絕育率
    calculateAverageRates(result);
    
    // 計算登記單位數（取最大值）
    result.registrationUnits = Object.values(result.cityData).reduce(
        (sum, cityData) => sum + cityData.registrationUnits, 0
    );
    
    // 將Set轉換為陣列
    result.years = Array.from(years).sort();
    result.cities = Array.from(cities).sort();
    
    return result;
}

/**
 * 計算平均絕育率
 * @param {Object} data - 數據對象
 */
function calculateAverageRates(data) {
    // 計算縣市的平均絕育率
    let totalDogNeuteringRate = 0;
    let dogCitiesCount = 0;
    let totalCatNeuteringRate = 0;
    let catCitiesCount = 0;
    
    Object.values(data.cityData).forEach(cityData => {
        // 計算這個縣市的平均絕育率
        let dogNeuteringRateSum = 0;
        let dogYearsCount = 0;
        let catNeuteringRateSum = 0;
        let catYearsCount = 0;
        
        Object.values(cityData.yearlyData).forEach(yearData => {
            if (yearData.dogNeuteringRate > 0) {
                dogNeuteringRateSum += yearData.dogNeuteringRate;
                dogYearsCount += 1;
            }
            
            if (yearData.catNeuteringRate > 0) {
                catNeuteringRateSum += yearData.catNeuteringRate;
                catYearsCount += 1;
            }
        });
        
        if (dogYearsCount > 0) {
            cityData.dogNeuteringRate = dogNeuteringRateSum / dogYearsCount;
            totalDogNeuteringRate += cityData.dogNeuteringRate;
            dogCitiesCount += 1;
        }
        
        if (catYearsCount > 0) {
            cityData.catNeuteringRate = catNeuteringRateSum / catYearsCount;
            totalCatNeuteringRate += cityData.catNeuteringRate;
            catCitiesCount += 1;
        }
        
        // 計算總平均絕育率 (狗貓綜合)
        if (dogYearsCount > 0 && catYearsCount > 0) {
            cityData.avgNeuteringRate = (cityData.dogNeuteringRate + cityData.catNeuteringRate) / 2;
        } else if (dogYearsCount > 0) {
            cityData.avgNeuteringRate = cityData.dogNeuteringRate;
        } else if (catYearsCount > 0) {
            cityData.avgNeuteringRate = cityData.catNeuteringRate;
        }
    });
    
    // 計算年份的平均絕育率
    Object.keys(data.yearlyData).forEach(year => {
        const yearData = data.yearlyData[year];
        let dogNeuteringRateSum = 0;
        let dogCityCount = 0;
        let catNeuteringRateSum = 0;
        let catCityCount = 0;
        
        Object.values(yearData.cityData).forEach(cityData => {
            if (cityData.dogNeuteringRate > 0) {
                dogNeuteringRateSum += cityData.dogNeuteringRate;
                dogCityCount += 1;
            }
            
            if (cityData.catNeuteringRate > 0) {
                catNeuteringRateSum += cityData.catNeuteringRate;
                catCityCount += 1;
            }
        });
        
        if (dogCityCount > 0) {
            yearData.dogNeuteringRate = dogNeuteringRateSum / dogCityCount;
        }
        
        if (catCityCount > 0) {
            yearData.catNeuteringRate = catNeuteringRateSum / catCityCount;
        }
        
        // 計算年份總平均絕育率
        if (dogCityCount > 0 && catCityCount > 0) {
            yearData.avgNeuteringRate = (yearData.dogNeuteringRate + yearData.catNeuteringRate) / 2;
        } else if (dogCityCount > 0) {
            yearData.avgNeuteringRate = yearData.dogNeuteringRate;
        } else if (catCityCount > 0) {
            yearData.avgNeuteringRate = yearData.catNeuteringRate;
        }
    });
    
    // 計算總平均絕育率
    if (dogCitiesCount > 0 && catCitiesCount > 0) {
        data.avgNeuteringRate = (totalDogNeuteringRate / dogCitiesCount + totalCatNeuteringRate / catCitiesCount) / 2;
    } else if (dogCitiesCount > 0) {
        data.avgNeuteringRate = totalDogNeuteringRate / dogCitiesCount;
    } else if (catCitiesCount > 0) {
        data.avgNeuteringRate = totalCatNeuteringRate / catCitiesCount;
    }
}

/**
 * 更新數據卡片
 * @param {Object} data - 處理後的數據
 */
function updateDataCards(data) {
    // 總登記數量
    document.getElementById('total-registrations').textContent = formatNumber(data.totalRegistrations);
    
    // 平均絕育率
    document.getElementById('avg-neutering-rate').textContent = formatNumber(data.avgNeuteringRate) + '%';
    
    // 登記單位數
    document.getElementById('registration-units').textContent = formatNumber(data.registrationUnits);
    
    // 最後更新時間
    const lastUpdated = new Date(data.lastUpdated);
    document.getElementById('last-updated').textContent = formatDate(lastUpdated);
}

// 圖表初始化函數已移至 chart-initializer.js

/**
 * 填充數據表格
 * @param {Object} data - 處理後的數據
 */
function populateTable(data) {
    // 獲取表格數據（按年份降序，然後按縣市名稱排序）
    const tableData = [...data.tableData]
        .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return a.city.localeCompare(b.city, 'zh-TW');
        });
    
    // 分頁設置
    const itemsPerPage = 10;
    let currentPage = 1;
    const totalPages = Math.ceil(tableData.length / itemsPerPage);
    
    // 渲染表格
    function renderTable(page) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const tableBody = document.getElementById('table-body');
        
        // 清空表格
        tableBody.innerHTML = '';
        
        // 添加數據行
        const pageData = tableData.slice(startIndex, endIndex);
        pageData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.city}</td>
                <td>${row.year}</td>
                <td>${row.animalType || '-'}</td>
                <td>${formatNumber(row.registrations)}</td>
                <td>${formatNumber(row.neuteringCount)}</td>
                <td>${formatNumber(row.neuteringRate)}%</td>
            `;
            tableBody.appendChild(tr);
        });
        
        // 更新分頁控件
        updatePagination(page, totalPages);
    }
    
    // 更新分頁控件
    function updatePagination(currentPage, totalPages) {
        const pagination = document.getElementById('table-pagination');
        pagination.innerHTML = '';
        
        // 上一頁按鈕
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = '<a class=\"page-link\" href=\"#\">&laquo;</a>';
        prevItem.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage > 1) {
                renderTable(currentPage - 1);
            }
        });
        pagination.appendChild(prevItem);
        
        // 頁碼按鈕
        // 最多顯示7個頁碼按鈕，其他用...表示
        let startPage = Math.max(1, currentPage - 3);
        let endPage = Math.min(totalPages, startPage + 6);
        
        if (endPage - startPage < 6) {
            startPage = Math.max(1, endPage - 6);
        }
        
        // 始終顯示第一頁
        if (startPage > 1) {
            const firstItem = document.createElement('li');
            firstItem.className = 'page-item';
            firstItem.innerHTML = '<a class=\"page-link\" href=\"#\">1</a>';
            firstItem.addEventListener('click', function(e) {
                e.preventDefault();
                renderTable(1);
            });
            pagination.appendChild(firstItem);
            
            // 如果起始頁不是第二頁，顯示...
            if (startPage > 2) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                ellipsisItem.innerHTML = '<a class=\"page-link\" href=\"#\">...</a>';
                pagination.appendChild(ellipsisItem);
            }
        }
        
        // 顯示頁碼
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `<a class=\"page-link\" href=\"#\">${i}</a>`;
            pageItem.addEventListener('click', function(e) {
                e.preventDefault();
                renderTable(i);
            });
            pagination.appendChild(pageItem);
        }
        
        // 如果結束頁不是最後一頁，顯示...
        if (endPage < totalPages - 1) {
            const ellipsisItem = document.createElement('li');
            ellipsisItem.className = 'page-item disabled';
            ellipsisItem.innerHTML = '<a class=\"page-link\" href=\"#\">...</a>';
            pagination.appendChild(ellipsisItem);
        }
        
        // 始終顯示最後一頁
        if (endPage < totalPages) {
            const lastItem = document.createElement('li');
            lastItem.className = 'page-item';
            lastItem.innerHTML = `<a class=\"page-link\" href=\"#\">${totalPages}</a>`;
            lastItem.addEventListener('click', function(e) {
                e.preventDefault();
                renderTable(totalPages);
            });
            pagination.appendChild(lastItem);
        }
        
        // 下一頁按鈕
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextItem.innerHTML = '<a class=\"page-link\" href=\"#\">&raquo;</a>';
        nextItem.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                renderTable(currentPage + 1);
            }
        });
        pagination.appendChild(nextItem);
    }
    
    // 初始渲染
    renderTable(currentPage);
    
    // 保存到全局數據以供搜尋使用
    window.tableDataForSearch = {
        data: tableData,
        render: renderTable,
        itemsPerPage: itemsPerPage
    };
}

/**
 * 初始化表格搜尋功能
 */
function initTableSearch() {
    const searchInput = document.getElementById('table-search');
    const searchBtn = document.getElementById('search-btn');
    
    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        
        if (!window.tableDataForSearch) return;
        
        const { data, render, itemsPerPage } = window.tableDataForSearch;
        
        // 如果查詢為空，顯示所有數據
        if (!query) {
            // 重新初始化表格
            window.tableDataForSearch.data = [...data];
            render(1);
            return;
        }
        
        // 過濾數據
        const filteredData = data.filter(row => {
            return row.city.toLowerCase().includes(query) ||
                   row.year.toString().includes(query) ||
                   (row.animalType && row.animalType.toLowerCase().includes(query));
        });
        
        // 更新全局數據
        window.tableDataForSearch.filteredData = filteredData;
        
        // 計算分頁
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        
        // 渲染過濾後的表格
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';
        
        if (filteredData.length === 0) {
            // 沒有結果
            tableBody.innerHTML = `
                <tr>
                    <td colspan=\"6\" class=\"text-center\">沒有找到符合 \"${query}\" 的結果</td>
                </tr>
            `;
            
            // 清空分頁
            document.getElementById('table-pagination').innerHTML = '';
        } else {
            // 顯示前N條結果
            const displayData = filteredData.slice(0, itemsPerPage);
            
            displayData.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.city}</td>
                    <td>${row.year}</td>
                    <td>${row.animalType || '-'}</td>
                    <td>${formatNumber(row.registrations)}</td>
                    <td>${formatNumber(row.neuteringCount)}</td>
                    <td>${formatNumber(row.neuteringRate)}%</td>
                `;
                tableBody.appendChild(tr);
            });
            
            // 更新分頁
            const pagination = document.getElementById('table-pagination');
            pagination.innerHTML = '';
            
            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    const pageItem = document.createElement('li');
                    pageItem.className = `page-item ${i === 1 ? 'active' : ''}`;
                    pageItem.innerHTML = `<a class=\"page-link\" href=\"#\">${i}</a>`;
                    pageItem.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // 更新活動狀態
                        document.querySelectorAll('#table-pagination .page-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        pageItem.classList.add('active');
                        
                        // 顯示對應頁的數據
                        const startIndex = (i - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const pageData = filteredData.slice(startIndex, endIndex);
                        
                        tableBody.innerHTML = '';
                        pageData.forEach(row => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${row.city}</td>
                                <td>${row.year}</td>
                                <td>${row.animalType || '-'}</td>
                                <td>${formatNumber(row.registrations)}</td>
                                <td>${formatNumber(row.neuteringCount)}</td>
                                <td>${formatNumber(row.neuteringRate)}%</td>
                            `;
                            tableBody.appendChild(tr);
                        });
                    });
                    pagination.appendChild(pageItem);
                }
            }
        }
    }
    
    // 點擊搜尋按鈕
    searchBtn.addEventListener('click', performSearch);
    
    // 按回車鍵搜尋
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
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
            
            // 從 chart-initializer.js 獲取圖表對象
            const charts = getCharts();
            
            // 更新圖表
            if (charts && charts.registrationTrend) {
                charts.registrationTrend.config.type = chartType;
                charts.registrationTrend.update();
            }
        });
    });
}

/**
 * 格式化數字（添加千位分隔符）
 * @param {number} number - 要格式化的數字
 * @returns {string} 格式化後的字符串
 */
function formatNumber(number) {
    if (typeof number === 'number') {
        // 如果是整數，添加千位分隔符
        if (Number.isInteger(number)) {
            return number.toLocaleString('zh-TW');
        }
        // 如果是小數，保留兩位小數
        return number.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return number;
}

/**
 * 格式化日期
 * @param {Date} date - 日期對象
 * @returns {string} 格式化後的日期字符串
 */
function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return '未知';
    }
    
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 顯示錯誤訊息
 * @param {string} title - 錯誤標題
 * @param {string} message - 錯誤訊息
 */
function showError(title, message) {
    // 創建錯誤提示元素
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger mx-3 my-3';
    errorDiv.innerHTML = `
        <h4 class="alert-heading">${title}</h4>
        <p>${message}</p>
    `;
    
    // 插入到頁面頂部
    document.body.insertBefore(errorDiv, document.body.firstChild);
    
    console.error(`${title}: ${message}`);
}

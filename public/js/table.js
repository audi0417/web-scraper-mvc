/**
 * 寵物登記統計儀表板 - 表格模組
 * 處理表格操作和渲染
 */

// 分頁設定
const itemsPerPage = 10;
let currentPage = 1;
let tableDataForSearch = null;

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
    
    // 計算總頁數
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
                <td>${row.animalType}</td>
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
        prevItem.innerHTML = '<a class="page-link" href="#">&laquo;</a>';
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
            firstItem.innerHTML = '<a class="page-link" href="#">1</a>';
            firstItem.addEventListener('click', function(e) {
                e.preventDefault();
                renderTable(1);
            });
            pagination.appendChild(firstItem);
            
            // 如果起始頁不是第二頁，顯示...
            if (startPage > 2) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                ellipsisItem.innerHTML = '<a class="page-link" href="#">...</a>';
                pagination.appendChild(ellipsisItem);
            }
        }
        
        // 顯示頁碼
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
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
            ellipsisItem.innerHTML = '<a class="page-link" href="#">...</a>';
            pagination.appendChild(ellipsisItem);
        }
        
        // 始終顯示最後一頁
        if (endPage < totalPages) {
            const lastItem = document.createElement('li');
            lastItem.className = 'page-item';
            lastItem.innerHTML = `<a class="page-link" href="#">${totalPages}</a>`;
            lastItem.addEventListener('click', function(e) {
                e.preventDefault();
                renderTable(totalPages);
            });
            pagination.appendChild(lastItem);
        }
        
        // 下一頁按鈕
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextItem.innerHTML = '<a class="page-link" href="#">&raquo;</a>';
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
    tableDataForSearch = {
        data: tableData,
        render: renderTable,
        itemsPerPage: itemsPerPage,
        totalPages: totalPages
    };
}

/**
 * 初始化表格搜索功能
 */
function initTableSearch() {
    const searchInput = document.getElementById('table-search');
    const searchBtn = document.getElementById('search-btn');
    
    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        
        if (!tableDataForSearch) return;
        
        const { data, render, itemsPerPage } = tableDataForSearch;
        
        // 如果查詢為空，顯示所有數據
        if (!query) {
            // 重新初始化表格
            tableDataForSearch.filteredData = undefined;
            render(1);
            return;
        }
        
        // 過濾數據
        const filteredData = data.filter(row => {
            return row.city.toLowerCase().includes(query) ||
                   row.year.toString().includes(query) ||
                   row.animalType.toLowerCase().includes(query);
        });
        
        // 更新全局數據
        tableDataForSearch.filteredData = filteredData;
        
        // 計算分頁
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        
        // 渲染過濾後的表格
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';
        
        if (filteredData.length === 0) {
            // 沒有結果
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">沒有找到符合 "${query}" 的結果</td>
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
                    <td>${row.animalType}</td>
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
                // 建立自訂分頁
                for (let i = 1; i <= Math.min(totalPages, 5); i++) {
                    const pageItem = document.createElement('li');
                    pageItem.className = `page-item ${i === 1 ? 'active' : ''}`;
                    pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
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
                                <td>${row.animalType}</td>
                                <td>${formatNumber(row.registrations)}</td>
                                <td>${formatNumber(row.neuteringCount)}</td>
                                <td>${formatNumber(row.neuteringRate)}%</td>
                            `;
                            tableBody.appendChild(tr);
                        });
                    });
                    pagination.appendChild(pageItem);
                }
                
                // 如果頁數過多，顯示省略號
                if (totalPages > 5) {
                    const ellipsisItem = document.createElement('li');
                    ellipsisItem.className = 'page-item disabled';
                    ellipsisItem.innerHTML = '<a class="page-link" href="#">...</a>';
                    pagination.appendChild(ellipsisItem);
                    
                    // 顯示最後一頁
                    const lastItem = document.createElement('li');
                    lastItem.className = 'page-item';
                    lastItem.innerHTML = `<a class="page-link" href="#">${totalPages}</a>`;
                    lastItem.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // 更新活動狀態
                        document.querySelectorAll('#table-pagination .page-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        lastItem.classList.add('active');
                        
                        // 顯示最後一頁的數據
                        const startIndex = (totalPages - 1) * itemsPerPage;
                        const pageData = filteredData.slice(startIndex);
                        
                        tableBody.innerHTML = '';
                        pageData.forEach(row => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${row.city}</td>
                                <td>${row.year}</td>
                                <td>${row.animalType}</td>
                                <td>${formatNumber(row.registrations)}</td>
                                <td>${formatNumber(row.neuteringCount)}</td>
                                <td>${formatNumber(row.neuteringRate)}%</td>
                            `;
                            tableBody.appendChild(tr);
                        });
                    });
                    pagination.appendChild(lastItem);
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
 * 更新表格數據
 * @param {Object} data - 新的表格數據
 */
function updateTable(data) {
    // 重新填充表格
    populateTable(data);
    
    // 清空搜尋框
    const searchInput = document.getElementById('table-search');
    if (searchInput) {
        searchInput.value = '';
    }
}

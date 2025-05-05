/**
 * 寵物登記統計儀表板 - 工具函數模組
 * 提供通用的格式化和輔助函數
 */

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

/**
 * 顯示加載中動畫
 * @param {HTMLElement} container - 容器元素
 */
function showLoading(container) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    container.style.position = 'relative';
    container.appendChild(loadingOverlay);
    return loadingOverlay;
}

/**
 * 隱藏加載中動畫
 * @param {HTMLElement} loadingOverlay - 加載中覆蓋元素
 */
function hideLoading(loadingOverlay) {
    if (loadingOverlay && loadingOverlay.parentNode) {
        loadingOverlay.parentNode.removeChild(loadingOverlay);
    }
}

/**
 * 深度複製對象
 * @param {Object} obj - 要複製的對象
 * @returns {Object} 複製後的對象
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

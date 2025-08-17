/**
 * 進階統計圖表模組
 * 包含控制圖、瀑布圖、甘特圖、動態地圖等專業數據分析視覺化
 */

/**
 * 控制圖 (Control Chart) - 監控數據品質和穩定性
 */
class ControlChart {
    constructor(containerId) {
        this.containerId = containerId;
        this.chart = null;
    }

    /**
     * 計算統計控制限
     * @param {Array} data - 數據陣列
     * @returns {Object} 包含中心線、上下控制限的統計值
     */
    calculateControlLimits(data) {
        const n = data.length;
        const mean = data.reduce((sum, val) => sum + val, 0) / n;
        
        // 計算移動範圍 (Moving Range)
        const movingRanges = [];
        for (let i = 1; i < n; i++) {
            movingRanges.push(Math.abs(data[i] - data[i-1]));
        }
        
        const meanMovingRange = movingRanges.reduce((sum, val) => sum + val, 0) / movingRanges.length;
        
        // 控制圖常數 (對於個體控制圖)
        const A2 = 2.659; // 對於 n=2 的移動範圍
        const D3 = 0;     // 對於 n=2 的移動範圍下限
        const D4 = 3.267; // 對於 n=2 的移動範圍上限
        
        return {
            centerLine: mean,
            upperControlLimit: mean + A2 * meanMovingRange,
            lowerControlLimit: mean - A2 * meanMovingRange,
            meanMovingRange: meanMovingRange,
            upperRangeLimit: D4 * meanMovingRange,
            lowerRangeLimit: D3 * meanMovingRange,
            sigma: meanMovingRange / 1.128 // d2 constant for n=2
        };
    }

    /**
     * 檢測異常點
     * @param {Array} data - 數據陣列
     * @param {Object} limits - 控制限
     * @returns {Array} 異常點索引
     */
    detectOutliers(data, limits) {
        const outliers = [];
        
        data.forEach((value, index) => {
            // 規則1: 點超出控制限
            if (value > limits.upperControlLimit || value < limits.lowerControlLimit) {
                outliers.push({
                    index: index,
                    value: value,
                    rule: '超出控制限',
                    severity: 'high'
                });
            }
            
            // 規則2: 連續7點在中心線同一側
            if (index >= 6) {
                const recent7 = data.slice(index - 6, index + 1);
                const allAbove = recent7.every(val => val > limits.centerLine);
                const allBelow = recent7.every(val => val < limits.centerLine);
                
                if (allAbove || allBelow) {
                    outliers.push({
                        index: index,
                        value: value,
                        rule: '連續7點在中心線同一側',
                        severity: 'medium'
                    });
                }
            }
            
            // 規則3: 連續2點超過2σ線
            if (index >= 1) {
                const sigma2Upper = limits.centerLine + 2 * limits.sigma;
                const sigma2Lower = limits.centerLine - 2 * limits.sigma;
                
                if ((data[index] > sigma2Upper && data[index-1] > sigma2Upper) ||
                    (data[index] < sigma2Lower && data[index-1] < sigma2Lower)) {
                    outliers.push({
                        index: index,
                        value: value,
                        rule: '連續2點超過2σ線',
                        severity: 'medium'
                    });
                }
            }
        });
        
        return outliers;
    }

    /**
     * 創建控制圖
     * @param {Array} data - 時間序列數據
     * @param {Array} labels - 時間標籤
     * @param {String} title - 圖表標題
     * @param {String} metric - 指標名稱
     */
    createChart(data, labels, title = '控制圖', metric = '絕育率') {
        const limits = this.calculateControlLimits(data);
        const outliers = this.detectOutliers(data, limits);
        
        // 標記異常點
        const pointColors = data.map((_, index) => {
            const outlier = outliers.find(o => o.index === index);
            if (outlier) {
                return outlier.severity === 'high' ? 'red' : 'orange';
            }
            return 'blue';
        });
        
        const ctx = document.getElementById(this.containerId).getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: metric,
                    data: data,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)',
                    pointBackgroundColor: pointColors,
                    pointRadius: 4,
                    fill: false
                }, {
                    label: '中心線 (CL)',
                    data: Array(data.length).fill(limits.centerLine),
                    borderColor: 'green',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }, {
                    label: '上控制限 (UCL)',
                    data: Array(data.length).fill(limits.upperControlLimit),
                    borderColor: 'red',
                    borderDash: [10, 5],
                    pointRadius: 0,
                    fill: false
                }, {
                    label: '下控制限 (LCL)',
                    data: Array(data.length).fill(limits.lowerControlLimit),
                    borderColor: 'red',
                    borderDash: [10, 5],
                    pointRadius: 0,
                    fill: false
                }, {
                    label: '+2σ',
                    data: Array(data.length).fill(limits.centerLine + 2 * limits.sigma),
                    borderColor: 'orange',
                    borderDash: [2, 2],
                    pointRadius: 0,
                    fill: false
                }, {
                    label: '-2σ',
                    data: Array(data.length).fill(limits.centerLine - 2 * limits.sigma),
                    borderColor: 'orange',
                    borderDash: [2, 2],
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            afterBody: function(context) {
                                const index = context[0].dataIndex;
                                const outlier = outliers.find(o => o.index === index);
                                if (outlier) {
                                    return `異常檢測: ${outlier.rule}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: metric
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '時間'
                        }
                    }
                }
            }
        });
        
        // 返回統計資訊
        return {
            limits: limits,
            outliers: outliers,
            totalPoints: data.length,
            outOfControlPoints: outliers.filter(o => o.severity === 'high').length
        };
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

/**
 * 瀑布圖 (Waterfall Chart) - 年度變化貢獻分解
 */
class WaterfallChart {
    constructor(containerId) {
        this.containerId = containerId;
        this.chart = null;
    }

    /**
     * 準備瀑布圖數據
     * @param {Array} changes - 變化數據 [{label, value, type}]
     * @returns {Object} 瀑布圖所需的數據結構
     */
    prepareWaterfallData(changes) {
        let cumulative = 0;
        const datasets = {
            positive: [],
            negative: [],
            total: [],
            base: []
        };

        changes.forEach((change, index) => {
            const prevCumulative = cumulative;
            
            if (change.type === 'start' || change.type === 'end') {
                // 起始點或終點
                datasets.total.push(cumulative + change.value);
                datasets.positive.push(null);
                datasets.negative.push(null);
                datasets.base.push(null);
            } else {
                // 中間變化
                if (change.value >= 0) {
                    datasets.positive.push(change.value);
                    datasets.negative.push(null);
                    datasets.base.push(cumulative);
                } else {
                    datasets.positive.push(null);
                    datasets.negative.push(-change.value);
                    datasets.base.push(cumulative + change.value);
                }
                datasets.total.push(null);
            }
            
            cumulative += change.value;
        });

        return datasets;
    }

    /**
     * 創建瀑布圖
     * @param {Array} changes - 變化數據
     * @param {String} title - 圖表標題
     */
    createChart(changes, title = '年度變化貢獻分解') {
        const labels = changes.map(c => c.label);
        const datasets = this.prepareWaterfallData(changes);
        
        const ctx = document.getElementById(this.containerId).getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '基準',
                    data: datasets.base,
                    backgroundColor: 'rgba(200, 200, 200, 0.3)',
                    stack: 'stack'
                }, {
                    label: '正向變化',
                    data: datasets.positive,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    stack: 'stack'
                }, {
                    label: '負向變化',
                    data: datasets.negative,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    stack: 'stack'
                }, {
                    label: '總計',
                    data: datasets.total,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    type: 'bar'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const change = changes[context.dataIndex];
                                if (change.type === 'start') {
                                    return `起始值: ${change.value.toLocaleString()}`;
                                } else if (change.type === 'end') {
                                    return `最終值: ${change.value.toLocaleString()}`;
                                } else {
                                    const sign = change.value >= 0 ? '+' : '';
                                    return `${change.label}: ${sign}${change.value.toLocaleString()}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: '數值'
                        }
                    }
                }
            }
        });
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

/**
 * 甘特圖 (Gantt Chart) - 政策實施時間軸與效果追蹤
 */
class GanttChart {
    constructor(containerId) {
        this.containerId = containerId;
        this.chart = null;
    }

    /**
     * 準備甘特圖數據
     * @param {Array} policies - 政策數據 [{name, start, end, effect, type}]
     * @returns {Object} 甘特圖數據結構
     */
    prepareGanttData(policies) {
        const sortedPolicies = policies.sort((a, b) => new Date(a.start) - new Date(b.start));
        
        return sortedPolicies.map((policy, index) => {
            const startDate = new Date(policy.start);
            const endDate = new Date(policy.end);
            const duration = endDate - startDate;
            
            return {
                label: policy.name,
                data: [{
                    x: [startDate, endDate],
                    y: index,
                    effect: policy.effect,
                    type: policy.type
                }]
            };
        });
    }

    /**
     * 創建甘特圖
     * @param {Array} policies - 政策時間軸數據
     * @param {String} title - 圖表標題
     */
    createChart(policies, title = '政策實施時間軸與效果追蹤') {
        const ganttData = this.prepareGanttData(policies);
        const labels = ganttData.map(d => d.label);
        
        // 使用散點圖模擬甘特圖
        const datasets = ganttData.map((policy, index) => {
            const colorMap = {
                'regulation': 'rgba(255, 99, 132, 0.7)',
                'incentive': 'rgba(75, 192, 192, 0.7)',
                'education': 'rgba(255, 205, 86, 0.7)',
                'infrastructure': 'rgba(54, 162, 235, 0.7)'
            };
            
            return {
                label: policy.label,
                data: policy.data.map(d => ({
                    x: d.x[0].getTime(),
                    y: index,
                    width: d.x[1].getTime() - d.x[0].getTime(),
                    effect: d.effect,
                    type: d.type
                })),
                backgroundColor: colorMap[policy.data[0].type] || 'rgba(153, 102, 255, 0.7)',
                borderColor: colorMap[policy.data[0].type] || 'rgba(153, 102, 255, 1)',
                pointRadius: 8,
                pointHoverRadius: 10
            };
        });
        
        const ctx = document.getElementById(this.containerId).getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const dataIndex = context[0].dataIndex;
                                const datasetIndex = context[0].datasetIndex;
                                return datasets[datasetIndex].label;
                            },
                            label: function(context) {
                                const data = context.parsed;
                                const dataset = datasets[context.datasetIndex];
                                const policyData = dataset.data[context.dataIndex];
                                const startDate = new Date(data.x).toLocaleDateString();
                                const endDate = new Date(data.x + policyData.width).toLocaleDateString();
                                
                                return [
                                    `實施期間: ${startDate} - ${endDate}`,
                                    `政策類型: ${policyData.type}`,
                                    `預期效果: ${policyData.effect}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'year',
                            displayFormats: {
                                year: 'YYYY'
                            }
                        },
                        title: {
                            display: true,
                            text: '時間'
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        min: -0.5,
                        max: policies.length - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value >= 0 && value < labels.length ? labels[value] : '';
                            }
                        },
                        title: {
                            display: true,
                            text: '政策項目'
                        }
                    }
                }
            }
        });
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

/**
 * 動態地圖 (Animated Map) - 時間軸上的地理數據演變
 */
class AnimatedMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.currentYear = 2000;
        this.isPlaying = false;
        this.playInterval = null;
        this.map = null;
        this.data = null;
    }

    /**
     * 台灣縣市座標映射
     */
    getCityCoordinates() {
        return {
            '臺北市': [25.0330, 121.5654],
            '新北市': [25.0108, 121.4628],
            '桃園市': [24.9936, 121.3010],
            '臺中市': [24.1477, 120.6736],
            '臺南市': [22.9999, 120.2269],
            '高雄市': [22.6273, 120.3014],
            '基隆市': [25.1276, 121.7391],
            '新竹市': [24.8047, 120.9714],
            '嘉義市': [23.4801, 120.4491],
            '新竹縣': [24.7045, 121.0177],
            '苗栗縣': [24.5602, 120.8214],
            '彰化縣': [24.0518, 120.5161],
            '南投縣': [23.9609, 120.9718],
            '雲林縣': [23.7092, 120.4313],
            '嘉義縣': [23.4518, 120.2554],
            '屏東縣': [22.5519, 120.5487],
            '宜蘭縣': [24.7021, 121.7377],
            '花蓮縣': [23.9871, 121.6015],
            '臺東縣': [22.7972, 121.1713],
            '澎湖縣': [23.5712, 119.5793],
            '金門縣': [24.4324, 118.3170],
            '連江縣': [26.1605, 119.9297]
        };
    }

    /**
     * 準備地圖數據
     * @param {Object} rawData - 原始寵物登記數據
     * @returns {Object} 按年份分組的地理數據
     */
    prepareMapData(rawData) {
        const yearlyData = {};
        const coordinates = this.getCityCoordinates();
        
        rawData.items.forEach(item => {
            const year = item.年份;
            const city = item.縣市;
            const registrations = parseInt(item['登記數(A)']) || 0;
            const neuteringRate = parseFloat(item['絕育率(E-F)/(A-B)']) || 0;
            
            if (!yearlyData[year]) {
                yearlyData[year] = {};
            }
            
            if (!yearlyData[year][city]) {
                yearlyData[year][city] = {
                    registrations: 0,
                    neuteringRate: 0,
                    count: 0,
                    coordinates: coordinates[city] || [23.8, 121.0]
                };
            }
            
            yearlyData[year][city].registrations += registrations;
            yearlyData[year][city].neuteringRate += neuteringRate;
            yearlyData[year][city].count += 1;
        });
        
        // 計算平均值
        Object.keys(yearlyData).forEach(year => {
            Object.keys(yearlyData[year]).forEach(city => {
                const data = yearlyData[year][city];
                data.neuteringRate = data.neuteringRate / data.count;
            });
        });
        
        return yearlyData;
    }

    /**
     * 創建地圖容器和控制器
     */
    createMapContainer() {
        const container = document.getElementById(this.containerId);
        container.innerHTML = `
            <div class="map-controls mb-3">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <button id="play-btn" class="btn btn-primary">
                            <i class="bi bi-play-fill"></i> 播放
                        </button>
                        <button id="pause-btn" class="btn btn-secondary" disabled>
                            <i class="bi bi-pause-fill"></i> 暫停
                        </button>
                        <button id="reset-btn" class="btn btn-outline-secondary">
                            <i class="bi bi-arrow-counterclockwise"></i> 重置
                        </button>
                    </div>
                    <div class="col-md-4">
                        <label for="year-slider" class="form-label">年份: <span id="current-year">2000</span></label>
                        <input type="range" class="form-range" id="year-slider" min="2000" max="2025" value="2000" step="1">
                    </div>
                    <div class="col-md-4">
                        <label for="speed-control" class="form-label">播放速度</label>
                        <select class="form-select" id="speed-control">
                            <option value="2000">慢 (2秒)</option>
                            <option value="1000" selected>中 (1秒)</option>
                            <option value="500">快 (0.5秒)</option>
                        </select>
                    </div>
                </div>
            </div>
            <div id="map-container" style="height: 500px; background: #f0f0f0; border-radius: 8px; position: relative;">
                <svg id="taiwan-map" width="100%" height="100%"></svg>
                <div class="map-legend" style="position: absolute; bottom: 10px; right: 10px; background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div><strong>圖例</strong></div>
                    <div><span style="color: #ff4444;">●</span> 絕育率 > 70%</div>
                    <div><span style="color: #ffaa44;">●</span> 絕育率 50-70%</div>
                    <div><span style="color: #44ff44;">●</span> 絕育率 < 50%</div>
                    <div style="margin-top: 5px;"><small>圓圈大小 = 登記數量</small></div>
                </div>
            </div>
            <div class="mt-3">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">統計摘要 - <span id="stats-year">2000</span>年</h6>
                                <p class="card-text">
                                    全國總登記數: <span id="total-registrations-year">-</span><br>
                                    平均絕育率: <span id="avg-neutering-year">-</span>%<br>
                                    最高絕育率縣市: <span id="highest-city">-</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">趨勢分析</h6>
                                <p class="card-text">
                                    相較前年變化: <span id="year-change">-</span><br>
                                    改善最多縣市: <span id="most-improved">-</span><br>
                                    需關注縣市: <span id="attention-needed">-</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 初始化地圖
     * @param {Object} data - 寵物登記數據
     */
    initialize(data) {
        this.data = this.prepareMapData(data);
        this.createMapContainer();
        this.bindEvents();
        this.updateMap(2000);
    }

    /**
     * 綁定事件監聽器
     */
    bindEvents() {
        document.getElementById('play-btn').addEventListener('click', () => this.play());
        document.getElementById('pause-btn').addEventListener('click', () => this.pause());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        
        document.getElementById('year-slider').addEventListener('input', (e) => {
            this.currentYear = parseInt(e.target.value);
            this.updateMap(this.currentYear);
            document.getElementById('current-year').textContent = this.currentYear;
        });
    }

    /**
     * 播放動畫
     */
    play() {
        this.isPlaying = true;
        document.getElementById('play-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        
        const speed = parseInt(document.getElementById('speed-control').value);
        
        this.playInterval = setInterval(() => {
            if (this.currentYear >= 2025) {
                this.pause();
                return;
            }
            
            this.currentYear++;
            this.updateMap(this.currentYear);
            document.getElementById('year-slider').value = this.currentYear;
            document.getElementById('current-year').textContent = this.currentYear;
        }, speed);
    }

    /**
     * 暫停動畫
     */
    pause() {
        this.isPlaying = false;
        document.getElementById('play-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        
        if (this.playInterval) {
            clearInterval(this.playInterval);
        }
    }

    /**
     * 重置到起始年份
     */
    reset() {
        this.pause();
        this.currentYear = 2000;
        this.updateMap(this.currentYear);
        document.getElementById('year-slider').value = this.currentYear;
        document.getElementById('current-year').textContent = this.currentYear;
    }

    /**
     * 更新地圖顯示
     * @param {number} year - 要顯示的年份
     */
    updateMap(year) {
        const svg = d3.select('#taiwan-map');
        svg.selectAll('*').remove();
        
        const yearData = this.data[year] || {};
        const cities = Object.keys(yearData);
        
        if (cities.length === 0) return;
        
        // 計算數據範圍用於縮放
        const registrations = cities.map(city => yearData[city].registrations);
        const maxRegistrations = Math.max(...registrations);
        const minRegistrations = Math.min(...registrations);
        
        const radiusScale = d3.scaleLinear()
            .domain([minRegistrations, maxRegistrations])
            .range([5, 25]);
        
        // 創建投影 (簡化的台灣地圖投影)
        const width = document.getElementById('taiwan-map').clientWidth;
        const height = document.getElementById('taiwan-map').clientHeight;
        
        const projection = d3.geoMercator()
            .center([121, 24])
            .scale(6000)
            .translate([width / 2, height / 2]);
        
        // 繪製城市圓點
        cities.forEach(city => {
            const data = yearData[city];
            const [lng, lat] = data.coordinates;
            const [x, y] = projection([lng, lat]);
            
            if (x < 0 || x > width || y < 0 || y > height) return;
            
            const color = data.neuteringRate > 70 ? '#ff4444' :
                         data.neuteringRate > 50 ? '#ffaa44' : '#44ff44';
            
            svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', radiusScale(data.registrations))
                .attr('fill', color)
                .attr('opacity', 0.7)
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .on('mouseover', function(event) {
                    d3.select(this).attr('opacity', 1);
                    
                    // 顯示工具提示
                    const tooltip = d3.select('body').append('div')
                        .attr('class', 'map-tooltip')
                        .style('position', 'absolute')
                        .style('background', 'rgba(0,0,0,0.8)')
                        .style('color', 'white')
                        .style('padding', '8px')
                        .style('border-radius', '4px')
                        .style('font-size', '12px')
                        .style('pointer-events', 'none')
                        .style('z-index', '1000')
                        .html(`
                            <strong>${city}</strong><br>
                            登記數: ${data.registrations.toLocaleString()}<br>
                            絕育率: ${data.neuteringRate.toFixed(1)}%
                        `)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px');
                })
                .on('mouseout', function() {
                    d3.select(this).attr('opacity', 0.7);
                    d3.selectAll('.map-tooltip').remove();
                });
            
            // 添加城市名稱標籤
            svg.append('text')
                .attr('x', x)
                .attr('y', y + radiusScale(data.registrations) + 12)
                .attr('text-anchor', 'middle')
                .attr('font-size', '10px')
                .attr('fill', '#333')
                .text(city);
        });
        
        // 更新統計摘要
        this.updateStatistics(year);
    }

    /**
     * 更新統計摘要
     * @param {number} year - 年份
     */
    updateStatistics(year) {
        const yearData = this.data[year] || {};
        const cities = Object.keys(yearData);
        
        if (cities.length === 0) return;
        
        const totalRegistrations = cities.reduce((sum, city) => sum + yearData[city].registrations, 0);
        const avgNeuteringRate = cities.reduce((sum, city) => sum + yearData[city].neuteringRate, 0) / cities.length;
        
        const sortedByNeutering = cities.sort((a, b) => yearData[b].neuteringRate - yearData[a].neuteringRate);
        const highestCity = sortedByNeutering[0];
        
        document.getElementById('stats-year').textContent = year;
        document.getElementById('total-registrations-year').textContent = totalRegistrations.toLocaleString();
        document.getElementById('avg-neutering-year').textContent = avgNeuteringRate.toFixed(1);
        document.getElementById('highest-city').textContent = `${highestCity} (${yearData[highestCity].neuteringRate.toFixed(1)}%)`;
        
        // 計算年度變化
        if (year > 2000 && this.data[year - 1]) {
            const prevYearData = this.data[year - 1];
            const prevTotal = Object.keys(prevYearData).reduce((sum, city) => sum + prevYearData[city].registrations, 0);
            const change = ((totalRegistrations - prevTotal) / prevTotal * 100).toFixed(1);
            document.getElementById('year-change').textContent = `${change > 0 ? '+' : ''}${change}%`;
            
            // 找出改善最多的縣市
            let maxImprovement = -Infinity;
            let mostImprovedCity = '-';
            
            cities.forEach(city => {
                if (prevYearData[city]) {
                    const improvement = yearData[city].neuteringRate - prevYearData[city].neuteringRate;
                    if (improvement > maxImprovement) {
                        maxImprovement = improvement;
                        mostImprovedCity = city;
                    }
                }
            });
            
            document.getElementById('most-improved').textContent = 
                maxImprovement > 0 ? `${mostImprovedCity} (+${maxImprovement.toFixed(1)}%)` : '-';
            
            // 找出需要關注的縣市 (絕育率較低且下降)
            const needAttention = cities.filter(city => {
                if (!prevYearData[city]) return false;
                return yearData[city].neuteringRate < 50 && 
                       yearData[city].neuteringRate < prevYearData[city].neuteringRate;
            });
            
            document.getElementById('attention-needed').textContent = 
                needAttention.length > 0 ? needAttention.join(', ') : '無';
        } else {
            document.getElementById('year-change').textContent = '-';
            document.getElementById('most-improved').textContent = '-';
            document.getElementById('attention-needed').textContent = '-';
        }
    }

    destroy() {
        this.pause();
        if (this.playInterval) {
            clearInterval(this.playInterval);
        }
    }
}

// 導出類別供外部使用
window.ControlChart = ControlChart;
window.WaterfallChart = WaterfallChart;
window.GanttChart = GanttChart;
window.AnimatedMap = AnimatedMap;
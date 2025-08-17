/**
 * 台灣地圖互動視覺化模組
 * 使用 Leaflet.js + Taiwan GeoJSON 實現縣市邊界和數據視覺化
 */

class TaiwanInteractiveMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.geoJsonLayer = null;
        this.currentData = null;
        this.currentYear = 2025;
        this.currentMetric = 'neuteringRate';
        this.colorScale = null;
        
        // 台灣縣市中文對照
        this.cityMapping = {
            '台北市': '臺北市',
            '新北市': '新北市', 
            '桃園市': '桃園市',
            '台中市': '臺中市',
            '台南市': '臺南市',
            '高雄市': '高雄市',
            '基隆市': '基隆市',
            '新竹市': '新竹市',
            '嘉義市': '嘉義市',
            '新竹縣': '新竹縣',
            '苗栗縣': '苗栗縣',
            '彰化縣': '彰化縣',
            '南投縣': '南投縣',
            '雲林縣': '雲林縣',
            '嘉義縣': '嘉義縣',
            '屏東縣': '屏東縣',
            '宜蘭縣': '宜蘭縣',
            '花蓮縣': '花蓮縣',
            '台東縣': '臺東縣',
            '澎湖縣': '澎湖縣',
            '金門縣': '金門縣',
            '連江縣': '連江縣'
        };
    }

    /**
     * 初始化地圖
     */
    async initialize(data) {
        this.currentData = this.processMapData(data);
        await this.createMapContainer();
        await this.loadTaiwanGeoJSON();
        this.setupControls();
        this.updateMap(this.currentYear, this.currentMetric);
    }

    /**
     * 處理地圖數據
     */
    processMapData(rawData) {
        const yearlyData = {};
        const uniqueCities = new Set();
        
        rawData.items.forEach(item => {
            const year = item.年份;
            const city = item.縣市;
            const registrations = parseInt(item['登記數(A)']) || 0;
            const neutering = parseInt(item['絕育數(E)']) || 0;
            const neuteringRate = parseFloat(item['絕育率(E-F)/(A-B)']) || 0;
            const units = parseInt(item['登記單位數']) || 0;
            
            uniqueCities.add(city);
            
            if (!yearlyData[year]) {
                yearlyData[year] = {};
            }
            
            if (!yearlyData[year][city]) {
                yearlyData[year][city] = {
                    registrations: 0,
                    neutering: 0,
                    neuteringRate: 0,
                    units: 0,
                    count: 0
                };
            }
            
            yearlyData[year][city].registrations += registrations;
            yearlyData[year][city].neutering += neutering;
            yearlyData[year][city].neuteringRate += neuteringRate;
            yearlyData[year][city].units += units;
            yearlyData[year][city].count += 1;
        });
        
        // 計算平均值
        Object.keys(yearlyData).forEach(year => {
            Object.keys(yearlyData[year]).forEach(city => {
                const data = yearlyData[year][city];
                if (data.count > 1) {
                    data.neuteringRate = data.neuteringRate / data.count;
                    data.units = Math.round(data.units / data.count);
                }
            });
        });
        
        // 調試：顯示數據中的縣市名稱
        console.log('數據中的縣市名稱:', Array.from(uniqueCities).sort());
        console.log('2025年數據:', yearlyData[2025]);
        
        return yearlyData;
    }

    /**
     * 創建地圖容器
     */
    async createMapContainer() {
        const container = document.getElementById(this.containerId);
        
        container.innerHTML = `
            <div class="taiwan-map-wrapper">
                <!-- 地圖控制面板 -->
                <div class="map-controls-panel">
                    <div class="row g-2 align-items-center mb-3">
                        <div class="col-md-3">
                            <label for="map-year-slider" class="form-label small">年份: <span id="map-current-year">2025</span></label>
                            <input type="range" class="form-range" id="map-year-slider" min="2000" max="2025" value="2025" step="1">
                        </div>
                        <div class="col-md-3">
                            <label for="map-metric-select" class="form-label small">指標</label>
                            <select class="form-select form-select-sm" id="map-metric-select">
                                <option value="neuteringRate">絕育率 (%)</option>
                                <option value="registrations">登記數量</option>
                                <option value="neutering">絕育數量</option>
                                <option value="units">登記單位數</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="map-color-scheme" class="form-label small">色彩配置</label>
                            <select class="form-select form-select-sm" id="map-color-scheme">
                                <option value="viridis">Viridis (綠→黃→紫)</option>
                                <option value="plasma">Plasma (紫→粉→黃)</option>
                                <option value="blues">Blues (白→深藍)</option>
                                <option value="reds">Reds (白→深紅)</option>
                                <option value="oranges">Oranges (白→深橘)</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <div class="btn-group btn-group-sm w-100" role="group">
                                <button type="button" class="btn btn-outline-primary" id="map-play-btn">
                                    <i class="bi bi-play-fill"></i> 播放
                                </button>
                                <button type="button" class="btn btn-outline-secondary" id="map-reset-btn">
                                    <i class="bi bi-arrow-counterclockwise"></i> 重置
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 地圖容器 -->
                <div id="leaflet-map" style="height: 600px; border-radius: 8px; overflow: hidden;"></div>
                
                <!-- 圖例 -->
                <div class="map-legend-container">
                    <div class="card mt-3">
                        <div class="card-body p-3">
                            <div class="row">
                                <div class="col-md-8">
                                    <h6 class="card-title mb-2">
                                        <i class="bi bi-palette"></i> 
                                        <span id="legend-title">絕育率分佈圖例</span>
                                    </h6>
                                    <div id="color-legend" class="d-flex align-items-center">
                                        <!-- 色彩圖例將由JavaScript生成 -->
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div id="selected-city-info">
                                        <h6 class="text-muted">點擊縣市查看詳細資訊</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 統計摘要 -->
                <div class="map-stats-container mt-3">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card bg-primary text-white">
                                <div class="card-body text-center p-2">
                                    <h6 class="card-title">全國平均</h6>
                                    <h4 id="national-average">--</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-success text-white">
                                <div class="card-body text-center p-2">
                                    <h6 class="card-title">最高縣市</h6>
                                    <h4 id="highest-city">--</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-warning text-white">
                                <div class="card-body text-center p-2">
                                    <h6 class="card-title">最低縣市</h6>
                                    <h4 id="lowest-city">--</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-info text-white">
                                <div class="card-body text-center p-2">
                                    <h6 class="card-title">標準差</h6>
                                    <h4 id="std-deviation">--</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 初始化 Leaflet 地圖
        this.map = L.map('leaflet-map', {
            center: [23.8, 121.0], // 台灣中心
            zoom: 7,
            minZoom: 6,
            maxZoom: 10,
            zoomControl: true,
            attributionControl: true
        });

        // 添加底圖圖層
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            opacity: 0.7
        }).addTo(this.map);
    }

    /**
     * 載入台灣 GeoJSON 資料
     */
    async loadTaiwanGeoJSON() {
        try {
            // 使用線上的台灣縣市邊界 GeoJSON 資料
            const response = await fetch('https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json');
            
            if (!response.ok) {
                throw new Error('無法載入台灣地圖資料');
            }
            
            const geoJsonData = await response.json();
            
            // 創建 GeoJSON 圖層
            this.geoJsonLayer = L.geoJSON(geoJsonData, {
                style: this.getFeatureStyle.bind(this),
                onEachFeature: this.onEachFeature.bind(this)
            }).addTo(this.map);

            // 調整地圖視野到台灣邊界
            this.map.fitBounds(this.geoJsonLayer.getBounds());
            
        } catch (error) {
            console.error('載入台灣地圖資料失敗:', error);
            
            // 如果無法載入外部資料，使用簡化的台灣輪廓
            this.loadFallbackMap();
        }
    }

    /**
     * 載入備用地圖（簡化版本）
     */
    loadFallbackMap() {
        // 台灣主要縣市的簡化邊界座標
        const taiwanCounties = [
            { name: '臺北市', coords: [[25.20, 121.45], [25.20, 121.65], [25.00, 121.65], [25.00, 121.45]] },
            { name: '新北市', coords: [[25.30, 121.30], [25.30, 121.80], [24.80, 121.80], [24.80, 121.30]] },
            { name: '桃園市', coords: [[25.10, 121.10], [25.10, 121.50], [24.80, 121.50], [24.80, 121.10]] },
            { name: '臺中市', coords: [[24.40, 120.40], [24.40, 121.00], [24.00, 121.00], [24.00, 120.40]] },
            { name: '臺南市', coords: [[23.40, 120.00], [23.40, 120.50], [22.90, 120.50], [22.90, 120.00]] },
            { name: '高雄市', coords: [[23.00, 120.00], [23.00, 120.70], [22.40, 120.70], [22.40, 120.00]] }
        ];

        taiwanCounties.forEach(county => {
            const polygon = L.polygon(county.coords, {
                color: '#3388ff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.7
            }).addTo(this.map);
            
            polygon.bindPopup(`<b>${county.name}</b><br>點擊查看詳細資訊`);
        });
        
        console.log('使用備用地圖顯示');
    }

    /**
     * 設定 GeoJSON 圖層樣式
     */
    getFeatureStyle(feature) {
        const cityName = this.normalizeCityName(feature.properties.NAME_2010 || feature.properties.NAME || '');
        const data = this.getCityData(cityName, this.currentYear);
        const value = data ? data[this.currentMetric] : 0;
        
        // 確保色彩比例尺已初始化
        if (!this.colorScale) {
            this.updateColorScale();
        }
        
        const fillColor = this.getColor(value);
        console.log(`初始樣式設定 - ${cityName}: 數值=${value}, 顏色=${fillColor}`);
        
        return {
            fillColor: fillColor,
            weight: 2,
            opacity: 1,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        };
    }

    /**
     * 為每個縣市添加互動功能
     */
    onEachFeature(feature, layer) {
        // 調試：顯示GeoJSON中的縣市名稱
        const originalName = feature.properties.NAME_2010 || feature.properties.NAME || feature.properties.COUNTYNAME || '';
        console.log('GeoJSON縣市名稱:', originalName, '所有屬性:', feature.properties);
        
        const cityName = this.normalizeCityName(originalName);
        
        // 檢查數據映射
        const data = this.getCityData(cityName, this.currentYear);
        console.log(`縣市映射: ${originalName} -> ${cityName}, 數據:`, data);
        
        // 滑鼠懸停效果
        layer.on({
            mouseover: (e) => this.highlightFeature(e, cityName),
            mouseout: (e) => this.resetHighlight(e),
            click: (e) => this.selectCity(e, cityName)
        });
    }

    /**
     * 滑鼠懸停高亮效果
     */
    highlightFeature(e, cityName) {
        const layer = e.target;
        
        layer.setStyle({
            weight: 4,
            color: '#ffffff',
            fillOpacity: 0.9
        });
        
        layer.bringToFront();
        
        // 顯示工具提示
        const data = this.getCityData(cityName, this.currentYear);
        this.showTooltip(e.latlng, cityName, data);
    }

    /**
     * 重置高亮效果
     */
    resetHighlight(e) {
        this.geoJsonLayer.resetStyle(e.target);
        this.hideTooltip();
    }

    /**
     * 選擇縣市
     */
    selectCity(e, cityName) {
        const data = this.getCityData(cityName, this.currentYear);
        this.showCityDetails(cityName, data);
        
        // 縮放到選中的縣市
        this.map.fitBounds(e.target.getBounds());
    }

    /**
     * 顯示工具提示
     */
    showTooltip(latlng, cityName, data) {
        const content = this.formatTooltipContent(cityName, data);
        
        if (this.tooltip) {
            this.map.removeLayer(this.tooltip);
        }
        
        this.tooltip = L.popup({
            closeButton: false,
            autoClose: false,
            closeOnClick: false,
            className: 'city-tooltip'
        })
        .setLatLng(latlng)
        .setContent(content)
        .openOn(this.map);
    }

    /**
     * 隱藏工具提示
     */
    hideTooltip() {
        if (this.tooltip) {
            this.map.removeLayer(this.tooltip);
            this.tooltip = null;
        }
    }

    /**
     * 格式化工具提示內容
     */
    formatTooltipContent(cityName, data) {
        if (!data) {
            return `<div class="tooltip-content">
                <h6>${cityName}</h6>
                <p class="text-muted">暫無數據</p>
            </div>`;
        }

        const metricNames = {
            'neuteringRate': '絕育率',
            'registrations': '登記數量',
            'neutering': '絕育數量',
            'units': '登記單位數'
        };

        const metricUnits = {
            'neuteringRate': '%',
            'registrations': '隻',
            'neutering': '隻',
            'units': '個'
        };

        const currentValue = data[this.currentMetric];
        const formattedValue = this.currentMetric === 'neuteringRate' 
            ? currentValue.toFixed(1) 
            : currentValue.toLocaleString();

        return `<div class="tooltip-content">
            <h6 class="mb-1">${cityName}</h6>
            <hr class="my-1">
            <div class="metric-info">
                <strong>${metricNames[this.currentMetric]}: ${formattedValue}${metricUnits[this.currentMetric]}</strong>
            </div>
            <small class="text-muted">
                登記: ${data.registrations.toLocaleString()}隻 | 
                絕育: ${data.neutering.toLocaleString()}隻
            </small>
        </div>`;
    }

    /**
     * 顯示縣市詳細資訊
     */
    showCityDetails(cityName, data) {
        const container = document.getElementById('selected-city-info');
        
        if (!data) {
            container.innerHTML = `
                <h6 class="text-warning">${cityName}</h6>
                <p class="text-muted small">暫無${this.currentYear}年數據</p>
            `;
            return;
        }

        container.innerHTML = `
            <h6 class="text-primary">${cityName} - ${this.currentYear}年</h6>
            <div class="small">
                <div class="d-flex justify-content-between">
                    <span>登記數量:</span>
                    <strong>${data.registrations.toLocaleString()}隻</strong>
                </div>
                <div class="d-flex justify-content-between">
                    <span>絕育數量:</span>
                    <strong>${data.neutering.toLocaleString()}隻</strong>
                </div>
                <div class="d-flex justify-content-between">
                    <span>絕育率:</span>
                    <strong>${data.neuteringRate.toFixed(1)}%</strong>
                </div>
                <div class="d-flex justify-content-between">
                    <span>登記單位:</span>
                    <strong>${data.units}個</strong>
                </div>
            </div>
        `;
    }

    /**
     * 根據數值獲取顏色
     */
    getColor(value) {
        if (!this.colorScale) {
            this.updateColorScale();
        }
        
        return this.colorScale(value);
    }

    /**
     * 更新色彩比例尺
     */
    updateColorScale() {
        const scheme = document.getElementById('map-color-scheme')?.value || 'viridis';
        const yearData = this.currentData[this.currentYear] || {};
        const values = Object.values(yearData).map(d => d[this.currentMetric]).filter(v => v > 0);
        
        console.log(`更新色彩比例尺: 年份=${this.currentYear}, 指標=${this.currentMetric}, 數據點=${values.length}`);
        
        if (values.length === 0) {
            this.colorScale = () => '#cccccc';
            console.log('無有效數據，使用灰色');
            return;
        }
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        console.log(`數值範圍: ${min} - ${max}`);
        
        const colorSchemes = {
            'viridis': ['#440154', '#31688e', '#35b779', '#fde725'],
            'plasma': ['#0d0887', '#7e03a8', '#cc4778', '#f0f921'],
            'blues': ['#f7fbff', '#c6dbef', '#6baed6', '#08519c'],
            'reds': ['#fff5f0', '#fcbba1', '#fb6a4a', '#a50f15'],
            'oranges': ['#fff5eb', '#fdd0a2', '#fd8d3c', '#a63603']
        };
        
        const colors = colorSchemes[scheme] || colorSchemes['viridis'];
        
        this.colorScale = (value) => {
            if (value === 0) return '#cccccc';
            
            // 處理單一數值的情況
            if (min === max) {
                return colors[Math.floor(colors.length / 2)];
            }
            
            const ratio = (value - min) / (max - min);
            const index = Math.min(Math.floor(ratio * (colors.length - 1)), colors.length - 2);
            const localRatio = (ratio * (colors.length - 1)) - index;
            
            const color = this.interpolateColor(colors[index], colors[index + 1], localRatio);
            console.log(`數值 ${value} -> 比例 ${ratio.toFixed(2)} -> 顏色 ${color}`);
            return color;
        };
        
        this.updateLegend(min, max, colors);
    }

    /**
     * 顏色插值
     */
    interpolateColor(color1, color2, ratio) {
        const hex2rgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        const rgb2hex = (r, g, b) => 
            "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
        
        const c1 = hex2rgb(color1);
        const c2 = hex2rgb(color2);
        
        if (!c1 || !c2) return color1;
        
        const r = c1.r + (c2.r - c1.r) * ratio;
        const g = c1.g + (c2.g - c1.g) * ratio;
        const b = c1.b + (c2.b - c1.b) * ratio;
        
        return rgb2hex(r, g, b);
    }

    /**
     * 更新圖例
     */
    updateLegend(min, max, colors) {
        const container = document.getElementById('color-legend');
        const metricNames = {
            'neuteringRate': '絕育率 (%)',
            'registrations': '登記數量',
            'neutering': '絕育數量',
            'units': '登記單位數'
        };
        
        document.getElementById('legend-title').textContent = `${metricNames[this.currentMetric]}分佈圖例`;
        
        const legendWidth = 200;
        const legendHeight = 20;
        
        container.innerHTML = `
            <div class="legend-gradient" style="width: ${legendWidth}px; height: ${legendHeight}px; background: linear-gradient(to right, ${colors.join(', ')}); border: 1px solid #ccc; border-radius: 3px;"></div>
            <div class="legend-labels d-flex justify-content-between" style="width: ${legendWidth}px; font-size: 0.75rem; margin-top: 2px;">
                <span>${min.toFixed(1)}</span>
                <span>${((min + max) / 2).toFixed(1)}</span>
                <span>${max.toFixed(1)}</span>
            </div>
        `;
    }

    /**
     * 標準化縣市名稱
     */
    normalizeCityName(name) {
        if (!name) return '';
        
        // 移除可能的前後空格
        name = name.trim();
        
        // 完整的縣市名稱映射表
        const mapping = {
            // 直轄市
            '臺北市': '臺北市',
            '台北市': '臺北市',
            'Taipei City': '臺北市',
            '新北市': '新北市',
            'New Taipei City': '新北市',
            '桃園縣': '桃園市',
            '桃園市': '桃園市',
            'Taoyuan City': '桃園市',
            '臺中市': '臺中市',
            '台中市': '臺中市',
            'Taichung City': '臺中市',
            '臺南市': '臺南市',
            '台南市': '臺南市',
            'Tainan City': '臺南市',
            '高雄市': '高雄市',
            'Kaohsiung City': '高雄市',
            
            // 省轄市
            '基隆市': '基隆市',
            'Keelung City': '基隆市',
            '新竹市': '新竹市',
            'Hsinchu City': '新竹市',
            '嘉義市': '嘉義市',
            'Chiayi City': '嘉義市',
            
            // 縣
            '新竹縣': '新竹縣',
            'Hsinchu County': '新竹縣',
            '苗栗縣': '苗栗縣',
            'Miaoli County': '苗栗縣',
            '彰化縣': '彰化縣',
            'Changhua County': '彰化縣',
            '南投縣': '南投縣',
            'Nantou County': '南投縣',
            '雲林縣': '雲林縣',
            'Yunlin County': '雲林縣',
            '嘉義縣': '嘉義縣',
            'Chiayi County': '嘉義縣',
            '屏東縣': '屏東縣',
            'Pingtung County': '屏東縣',
            '宜蘭縣': '宜蘭縣',
            'Yilan County': '宜蘭縣',
            '花蓮縣': '花蓮縣',
            'Hualien County': '花蓮縣',
            '臺東縣': '臺東縣',
            '台東縣': '臺東縣',
            'Taitung County': '臺東縣',
            '澎湖縣': '澎湖縣',
            'Penghu County': '澎湖縣',
            '金門縣': '金門縣',
            'Kinmen County': '金門縣',
            '連江縣': '連江縣',
            'Lienchiang County': '連江縣'
        };
        
        // 直接映射
        if (mapping[name]) {
            return mapping[name];
        }
        
        // 嘗試簡化映射（移除空格、統一繁簡體）
        const simplifiedName = name.replace(/\s+/g, '').replace('台', '臺');
        if (mapping[simplifiedName]) {
            return mapping[simplifiedName];
        }
        
        console.warn('未知的縣市名稱:', name);
        return name;
    }

    /**
     * 獲取縣市數據
     */
    getCityData(cityName, year) {
        const yearData = this.currentData[year];
        if (!yearData) {
            console.log(`年份 ${year} 無數據`);
            return null;
        }
        
        // 標準化縣市名稱
        const normalizedName = this.normalizeCityName(cityName);
        
        // 嘗試直接匹配
        if (yearData[normalizedName]) {
            return yearData[normalizedName];
        }
        
        // 嘗試原始名稱匹配
        if (yearData[cityName]) {
            return yearData[cityName];
        }
        
        // 嘗試模糊匹配（移除市、縣後綴）
        const baseName = normalizedName.replace(/[市縣]$/, '');
        for (const dataCity in yearData) {
            if (dataCity.replace(/[市縣]$/, '') === baseName) {
                console.log(`模糊匹配成功: ${cityName} -> ${dataCity}`);
                return yearData[dataCity];
            }
        }
        
        // 嘗試包含關係匹配
        for (const dataCity in yearData) {
            if (dataCity.includes(baseName) || baseName.includes(dataCity.replace(/[市縣]$/, ''))) {
                console.log(`包含匹配成功: ${cityName} -> ${dataCity}`);
                return yearData[dataCity];
            }
        }
        
        console.log(`無法找到 ${cityName} (標準化: ${normalizedName}) 在 ${year} 年的數據`);
        return null;
    }

    /**
     * 設定控制器
     */
    setupControls() {
        // 年份滑桿
        const yearSlider = document.getElementById('map-year-slider');
        const yearDisplay = document.getElementById('map-current-year');
        
        yearSlider.addEventListener('input', (e) => {
            this.currentYear = parseInt(e.target.value);
            yearDisplay.textContent = this.currentYear;
            this.updateMap(this.currentYear, this.currentMetric);
        });

        // 指標選擇
        document.getElementById('map-metric-select').addEventListener('change', (e) => {
            this.currentMetric = e.target.value;
            this.updateMap(this.currentYear, this.currentMetric);
        });

        // 色彩配置
        document.getElementById('map-color-scheme').addEventListener('change', () => {
            this.updateMap(this.currentYear, this.currentMetric);
        });

        // 播放按鈕
        document.getElementById('map-play-btn').addEventListener('click', () => {
            this.playAnimation();
        });

        // 重置按鈕
        document.getElementById('map-reset-btn').addEventListener('click', () => {
            this.resetMap();
        });
    }

    /**
     * 更新地圖
     */
    updateMap(year, metric) {
        console.log(`更新地圖: 年份=${year}, 指標=${metric}`);
        
        // 更新當前年份和指標
        this.currentYear = year;
        this.currentMetric = metric;
        
        // 先更新色彩比例尺
        this.updateColorScale();
        
        // 然後重新設置所有圖層的樣式
        if (this.geoJsonLayer) {
            console.log('重新設置圖層樣式...');
            
            // 對每個圖層重新應用樣式
            this.geoJsonLayer.eachLayer((layer) => {
                const feature = layer.feature;
                const cityName = this.normalizeCityName(feature.properties.NAME_2010 || feature.properties.NAME || '');
                const data = this.getCityData(cityName, year);
                const value = data ? data[metric] : 0;
                
                // 為每個縣市計算獨立的顏色
                const fillColor = this.getColor(value);
                
                const style = {
                    fillColor: fillColor,
                    weight: 2,
                    opacity: 1,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.7
                };
                
                // 確保每個圖層都獲得正確的樣式
                layer.setStyle(style);
                
                // 重要：強制重繪該圖層
                if (layer._path) {
                    layer._path.setAttribute('fill', fillColor);
                }
                
                console.log(`${cityName}: 數值=${value}, 顏色=${fillColor}`);
            });
            
            // 觸發地圖重繪
            this.map.invalidateSize();
        }
        
        // 更新統計資訊
        this.updateStatistics(year, metric);
    }

    /**
     * 更新統計數據
     */
    updateStatistics(year, metric) {
        const yearData = this.currentData[year] || {};
        const values = Object.values(yearData).map(d => d[metric]).filter(v => v > 0);
        
        if (values.length === 0) {
            document.getElementById('national-average').textContent = '--';
            document.getElementById('highest-city').textContent = '--';
            document.getElementById('lowest-city').textContent = '--';
            document.getElementById('std-deviation').textContent = '--';
            return;
        }
        
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        const maxCity = Object.keys(yearData).find(city => yearData[city][metric] === max);
        const minCity = Object.keys(yearData).find(city => yearData[city][metric] === min);
        
        const formatValue = (val) => metric === 'neuteringRate' ? val.toFixed(1) + '%' : val.toLocaleString();
        
        document.getElementById('national-average').textContent = formatValue(avg);
        document.getElementById('highest-city').innerHTML = `${maxCity}<br><small>${formatValue(max)}</small>`;
        document.getElementById('lowest-city').innerHTML = `${minCity}<br><small>${formatValue(min)}</small>`;
        document.getElementById('std-deviation').textContent = formatValue(stdDev);
    }

    /**
     * 播放動畫
     */
    playAnimation() {
        const startYear = 2000;
        const endYear = 2025;
        let currentYear = startYear;
        
        const playBtn = document.getElementById('map-play-btn');
        playBtn.innerHTML = '<i class="bi bi-pause-fill"></i> 暫停';
        playBtn.disabled = true;
        
        const interval = setInterval(() => {
            document.getElementById('map-year-slider').value = currentYear;
            document.getElementById('map-current-year').textContent = currentYear;
            this.currentYear = currentYear;
            this.updateMap(currentYear, this.currentMetric);
            
            currentYear++;
            
            if (currentYear > endYear) {
                clearInterval(interval);
                playBtn.innerHTML = '<i class="bi bi-play-fill"></i> 播放';
                playBtn.disabled = false;
            }
        }, 800);
    }

    /**
     * 重置地圖
     */
    resetMap() {
        this.currentYear = 2025;
        this.currentMetric = 'neuteringRate';
        
        document.getElementById('map-year-slider').value = 2025;
        document.getElementById('map-current-year').textContent = 2025;
        document.getElementById('map-metric-select').value = 'neuteringRate';
        document.getElementById('map-color-scheme').value = 'viridis';
        
        this.updateMap(this.currentYear, this.currentMetric);
        
        if (this.geoJsonLayer) {
            this.map.fitBounds(this.geoJsonLayer.getBounds());
        }
    }

    /**
     * 銷毀地圖
     */
    destroy() {
        if (this.map) {
            this.map.remove();
        }
    }
}

// 導出類別
window.TaiwanInteractiveMap = TaiwanInteractiveMap;
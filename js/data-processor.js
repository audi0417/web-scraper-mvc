/**
 * 寵物登記統計儀表板 - 資料處理模組
 * 負責處理原始數據並轉換為可視化用的結構
 */

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
        
        // 按動物類型分組的數據
        animalTypeData: {
            '狗': {
                totalRegistrations: 0,
                avgNeuteringRate: 0,
                yearlyData: {},
                cityData: {}
            },
            '貓': {
                totalRegistrations: 0,
                avgNeuteringRate: 0,
                yearlyData: {},
                cityData: {}
            }
        },
        
        // 扁平化的表格數據
        tableData: []
    };
    
    // 收集所有的年份、縣市和動物類型
    const years = new Set();
    const cities = new Set();
    const animalTypes = new Set();
    
    // 處理每個數據項
    items.forEach(item => {
        // 獲取基本數據
        const year = item.年份 || '';
        const city = item.縣市 || '';
        const animalType = item.動物類型 || '狗'; // 默認為狗
        const registrations = parseInt(item['登記數(A)'] || 0, 10);
        const neuteringCount = parseInt(item['絕育數(E)'] || 0, 10);
        const neuteringRate = parseFloat(item['絕育率(E-F)/(A-B)'] || 0);
        const registrationUnits = parseInt(item['登記單位數'] || 0, 10);
        
        // 添加到集合
        if (year) years.add(year);
        if (city) cities.add(city);
        if (animalType) animalTypes.add(animalType);
        
        // 更新總數據
        result.totalRegistrations += registrations;
        
        // 更新動物類型數據
        if (animalType === '狗' || animalType === '貓') {
            result.animalTypeData[animalType].totalRegistrations += registrations;
        }
        
        // 初始化年份數據（如果不存在）
        if (year && !result.yearlyData[year]) {
            result.yearlyData[year] = {
                totalRegistrations: 0,
                dogRegistrations: 0,
                catRegistrations: 0,
                avgNeuteringRate: 0,
                dogNeuteringRate: 0,
                catNeuteringRate: 0,
                citiesCount: 0,
                cityData: {}
            };
        }
        
        // 初始化縣市數據（如果不存在）
        if (city && !result.cityData[city]) {
            result.cityData[city] = {
                totalRegistrations: 0,
                dogRegistrations: 0,
                catRegistrations: 0,
                avgNeuteringRate: 0,
                dogNeuteringRate: 0,
                catNeuteringRate: 0,
                registrationUnits: 0,
                yearlyData: {}
            };
        }
        
        // 初始化動物類型-年份數據
        if (animalType && !result.animalTypeData[animalType].yearlyData[year] && year) {
            result.animalTypeData[animalType].yearlyData[year] = {
                registrations: 0,
                neuteringRate: 0,
                cityData: {}
            };
        }
        
        // 初始化動物類型-縣市數據
        if (animalType && !result.animalTypeData[animalType].cityData[city] && city) {
            result.animalTypeData[animalType].cityData[city] = {
                totalRegistrations: 0,
                avgNeuteringRate: 0,
                yearlyData: {}
            };
        }
        
        // 更新年份數據
        if (year) {
            result.yearlyData[year].totalRegistrations += registrations;
            if (animalType === '狗') {
                result.yearlyData[year].dogRegistrations += registrations;
            } else if (animalType === '貓') {
                result.yearlyData[year].catRegistrations += registrations;
            }
            result.yearlyData[year].citiesCount += 1;
        }
            
        // 初始化年份-縣市數據
        if (year && city) {
            if (!result.yearlyData[year].cityData[city]) {
                result.yearlyData[year].cityData[city] = {
                    registrations: 0,
                    dogRegistrations: 0,
                    catRegistrations: 0,
                    neuteringRate: 0,
                    dogNeuteringRate: 0,
                    catNeuteringRate: 0,
                    registrationUnits: 0
                };
            }
            
            if (animalType === '狗') {
                result.yearlyData[year].cityData[city].dogRegistrations += registrations;
                result.yearlyData[year].cityData[city].dogNeuteringRate = neuteringRate;
            } else if (animalType === '貓') {
                result.yearlyData[year].cityData[city].catRegistrations += registrations;
                result.yearlyData[year].cityData[city].catNeuteringRate = neuteringRate;
            }
            
            result.yearlyData[year].cityData[city].registrations += registrations;
            result.yearlyData[year].cityData[city].registrationUnits = Math.max(
                result.yearlyData[year].cityData[city].registrationUnits || 0, 
                registrationUnits
            );
            
            // 更新縣市數據
            result.cityData[city].totalRegistrations += registrations;
            if (animalType === '狗') {
                result.cityData[city].dogRegistrations += registrations;
            } else if (animalType === '貓') {
                result.cityData[city].catRegistrations += registrations;
            }
            result.cityData[city].registrationUnits = Math.max(result.cityData[city].registrationUnits, registrationUnits);
            
            if (!result.cityData[city].yearlyData[year]) {
                result.cityData[city].yearlyData[year] = {
                    registrations: 0,
                    dogRegistrations: 0,
                    catRegistrations: 0,
                    neuteringRate: 0,
                    dogNeuteringRate: 0,
                    catNeuteringRate: 0
                };
            }
            
            if (animalType === '狗') {
                result.cityData[city].yearlyData[year].dogRegistrations += registrations;
                result.cityData[city].yearlyData[year].dogNeuteringRate = neuteringRate;
            } else if (animalType === '貓') {
                result.cityData[city].yearlyData[year].catRegistrations += registrations;
                result.cityData[city].yearlyData[year].catNeuteringRate = neuteringRate;
            }
            
            result.cityData[city].yearlyData[year].registrations += registrations;
            
            // 更新動物類型數據
            if (result.animalTypeData[animalType].yearlyData[year]) {
                result.animalTypeData[animalType].yearlyData[year].registrations += registrations;
                
                if (!result.animalTypeData[animalType].yearlyData[year].cityData[city]) {
                    result.animalTypeData[animalType].yearlyData[year].cityData[city] = {
                        registrations: 0,
                        neuteringRate: 0
                    };
                }
                
                result.animalTypeData[animalType].yearlyData[year].cityData[city].registrations += registrations;
                result.animalTypeData[animalType].yearlyData[year].cityData[city].neuteringRate = neuteringRate;
            }
            
            if (result.animalTypeData[animalType].cityData[city]) {
                result.animalTypeData[animalType].cityData[city].totalRegistrations += registrations;
                
                if (!result.animalTypeData[animalType].cityData[city].yearlyData[year]) {
                    result.animalTypeData[animalType].cityData[city].yearlyData[year] = {
                        registrations: 0,
                        neuteringRate: 0
                    };
                }
                
                result.animalTypeData[animalType].cityData[city].yearlyData[year].registrations += registrations;
                result.animalTypeData[animalType].cityData[city].yearlyData[year].neuteringRate = neuteringRate;
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
    
    // 計算平均絕育率等統計數據
    calculateStatistics(result);
    
    // 將Set轉換為陣列
    result.years = Array.from(years).sort();
    result.cities = Array.from(cities).sort();
    result.animalTypes = Array.from(animalTypes).sort();
    
    return result;
}

/**
 * 計算統計數據（平均絕育率等）
 * @param {Object} data - 數據對象
 */
function calculateStatistics(data) {
    // 針對每個縣市
    Object.values(data.cityData).forEach(cityData => {
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
        }
        
        if (catYearsCount > 0) {
            cityData.catNeuteringRate = catNeuteringRateSum / catYearsCount;
        }
        
        // 計算總平均絕育率
        if (dogYearsCount > 0 && catYearsCount > 0) {
            cityData.avgNeuteringRate = (cityData.dogNeuteringRate + cityData.catNeuteringRate) / 2;
        } else if (dogYearsCount > 0) {
            cityData.avgNeuteringRate = cityData.dogNeuteringRate;
        } else if (catYearsCount > 0) {
            cityData.avgNeuteringRate = cityData.catNeuteringRate;
        }
    });
    
    // 針對每個年份
    Object.values(data.yearlyData).forEach(yearData => {
        let cityNeuteringRateSum = 0;
        let cityCount = 0;
        let dogCityNeuteringRateSum = 0;
        let dogCityCount = 0;
        let catCityNeuteringRateSum = 0;
        let catCityCount = 0;
        
        Object.values(yearData.cityData).forEach(cityData => {
            if (cityData.neuteringRate > 0) {
                cityNeuteringRateSum += cityData.neuteringRate;
                cityCount += 1;
            }
            
            if (cityData.dogNeuteringRate > 0) {
                dogCityNeuteringRateSum += cityData.dogNeuteringRate;
                dogCityCount += 1;
            }
            
            if (cityData.catNeuteringRate > 0) {
                catCityNeuteringRateSum += cityData.catNeuteringRate;
                catCityCount += 1;
            }
        });
        
        if (cityCount > 0) {
            yearData.avgNeuteringRate = cityNeuteringRateSum / cityCount;
        }
        
        if (dogCityCount > 0) {
            yearData.dogNeuteringRate = dogCityNeuteringRateSum / dogCityCount;
        }
        
        if (catCityCount > 0) {
            yearData.catNeuteringRate = catCityNeuteringRateSum / catCityCount;
        }
    });
    
    // 針對每個動物類型
    Object.keys(data.animalTypeData).forEach(animalType => {
        let cityNeuteringRateSum = 0;
        let cityCount = 0;
        
        Object.values(data.animalTypeData[animalType].cityData).forEach(cityData => {
            let cityYearNeuteringRateSum = 0;
            let cityYearCount = 0;
            
            Object.values(cityData.yearlyData).forEach(yearData => {
                if (yearData.neuteringRate > 0) {
                    cityYearNeuteringRateSum += yearData.neuteringRate;
                    cityYearCount += 1;
                }
            });
            
            if (cityYearCount > 0) {
                cityData.avgNeuteringRate = cityYearNeuteringRateSum / cityYearCount;
                cityNeuteringRateSum += cityData.avgNeuteringRate;
                cityCount += 1;
            }
        });
        
        if (cityCount > 0) {
            data.animalTypeData[animalType].avgNeuteringRate = cityNeuteringRateSum / cityCount;
        }
    });
    
    // 計算總平均絕育率
    let totalCityNeuteringRateSum = 0;
    let totalCityCount = 0;
    
    Object.values(data.cityData).forEach(cityData => {
        if (cityData.avgNeuteringRate > 0) {
            totalCityNeuteringRateSum += cityData.avgNeuteringRate;
            totalCityCount += 1;
        }
    });
    
    if (totalCityCount > 0) {
        data.avgNeuteringRate = totalCityNeuteringRateSum / totalCityCount;
    }
    
    // 計算登記單位數（取最大值）
    data.registrationUnits = Object.values(data.cityData).reduce(
        (sum, cityData) => sum + cityData.registrationUnits, 0
    );
}

/**
 * 根據過濾條件過濾數據
 * @param {Object} data - 原始數據
 * @param {Object} filters - 過濾條件
 * @returns {Object} 過濾後的數據
 */
function filterData(data, filters) {
    // 深度複製原始數據
    const result = deepClone(data);
    
    // 過濾表格數據
    result.tableData = data.tableData.filter(item => {
        // 動物類型過濾
        if (filters.animalType !== 'all' && item.animalType !== 
            (filters.animalType === 'dog' ? '狗' : '貓')) {
            return false;
        }
        
        // 年份過濾
        if (filters.year !== 'all' && item.year !== filters.year) {
            return false;
        }
        
        // 縣市過濾
        if (filters.city !== 'all' && item.city !== filters.city) {
            return false;
        }
        
        return true;
    });
    
    // 重新計算總數據
    result.totalRegistrations = result.tableData.reduce((sum, item) => sum + item.registrations, 0);
    
    // 重新計算平均絕育率
    const validNeuteringRates = result.tableData
        .filter(item => item.neuteringRate > 0)
        .map(item => item.neuteringRate);
    
    if (validNeuteringRates.length > 0) {
        result.avgNeuteringRate = validNeuteringRates.reduce((sum, rate) => sum + rate, 0) / validNeuteringRates.length;
    } else {
        result.avgNeuteringRate = 0;
    }
    
    // 重新計算登記單位數
    const uniqueUnits = new Set();
    result.tableData.forEach(item => {
        if (item.registrationUnits > 0) {
            uniqueUnits.add(`${item.city}-${item.year}`);
        }
    });
    
    result.registrationUnits = uniqueUnits.size;
    
    return result;
}

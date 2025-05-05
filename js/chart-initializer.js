// 全局圖表對象
const charts = {};

/**
* 初始化所有圖表
* @param {Object} data - 處理後的數據
*/
function initCharts(data) {
  // 1. 寵物登記數量年度趨勢圖
  initRegistrationTrendChart(data);
  
  // 2. 各縣市登記數量分佈圖
  initCityDistributionChart(data);
  
  // 3. 各縣市絕育率比較圖
  initNeuteringRateChart(data);
}

/**
* 初始化寵物登記數量年度趨勢圖
* @param {Object} data - 處理後的數據
*/
function initRegistrationTrendChart(data) {
  const ctx = document.getElementById('registration-trend-chart').getContext('2d');
  
  // 準備數據
  const years = data.years;
  
  // 獲取狗、貓和總登記數
  const dogRegistrations = years.map(year => {
      return data.yearlyData[year] ? data.yearlyData[year].dogRegistrations || 0 : 0;
  });
  
  const catRegistrations = years.map(year => {
      return data.yearlyData[year] ? data.yearlyData[year].catRegistrations || 0 : 0;
  });
  
  const totalRegistrations = years.map(year => {
      return data.yearlyData[year] ? data.yearlyData[year].totalRegistrations : 0;
  });
  
  // 創建圖表
  charts.registrationTrend = new Chart(ctx, {
      type: 'line',
      data: {
          labels: years,
          datasets: [
              {
                  label: '總登記數',
                  data: totalRegistrations,
                  backgroundColor: 'rgba(44, 123, 229, 0.2)',
                  borderColor: 'rgba(44, 123, 229, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(44, 123, 229, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(44, 123, 229, 1)',
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  tension: 0.3
              },
              {
                  label: '狗登記數',
                  data: dogRegistrations,
                  backgroundColor: 'rgba(0, 217, 126, 0.2)',
                  borderColor: 'rgba(0, 217, 126, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(0, 217, 126, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(0, 217, 126, 1)',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  tension: 0.3
              },
              {
                  label: '貓登記數',
                  data: catRegistrations,
                  backgroundColor: 'rgba(230, 83, 110, 0.2)',
                  borderColor: 'rgba(230, 83, 110, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(230, 83, 110, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(230, 83, 110, 1)',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  tension: 0.3
              }
          ]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  position: 'top',
                  labels: {
                      padding: 15,
                      usePointStyle: true,
                      pointStyle: 'circle'
                  }
              },
              tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                      label: function(context) {
                          return context.dataset.label + ': ' + formatNumber(context.raw);
                      }
                  }
              }
          },
          scales: {
              x: {
                  title: {
                      display: true,
                      text: '年份',
                      font: {
                          weight: 'bold'
                      }
                  },
                  grid: {
                      display: false
                  }
              },
              y: {
                  beginAtZero: true,
                  title: {
                      display: true,
                      text: '登記數量',
                      font: {
                          weight: 'bold'
                      }
                  },
                  ticks: {
                      callback: function(value) {
                          return formatNumber(value);
                      }
                  }
              }
          }
      }
  });
  
  // 存儲原始數據以供日後使用
  charts.registrationTrend.originalData = {
      years: years,
      registrations: {
          total: totalRegistrations,
          dog: dogRegistrations,
          cat: catRegistrations
      },
      neuteringRates: {
          total: years.map(year => data.yearlyData[year] ? data.yearlyData[year].avgNeuteringRate || 0 : 0),
          dog: years.map(year => data.yearlyData[year] ? data.yearlyData[year].dogNeuteringRate || 0 : 0),
          cat: years.map(year => data.yearlyData[year] ? data.yearlyData[year].catNeuteringRate || 0 : 0)
      }
  };
}

/**
* 初始化各縣市登記數量分佈圖
* @param {Object} data - 處理後的數據
*/
function initCityDistributionChart(data) {
  const ctx = document.getElementById('city-distribution-chart').getContext('2d');
  
  // 獲取前10大縣市（按登記數量）
  const citiesData = Object.entries(data.cityData)
      .map(([city, cityData]) => ({
          city,
          totalRegistrations: cityData.totalRegistrations,
          dogRegistrations: cityData.dogRegistrations,
          catRegistrations: cityData.catRegistrations
      }))
      .sort((a, b) => b.totalRegistrations - a.totalRegistrations)
      .slice(0, 10);
  
  // 準備數據
  const cities = citiesData.map(item => item.city);
  const totalRegistrations = citiesData.map(item => item.totalRegistrations);
  const dogRegistrations = citiesData.map(item => item.dogRegistrations);
  const catRegistrations = citiesData.map(item => item.catRegistrations);
  
  // 顏色列表
  const colors = [
      'rgba(44, 123, 229, 0.8)',   // 藍色
      'rgba(0, 217, 126, 0.8)',    // 綠色
      'rgba(230, 83, 110, 0.8)',   // 紅色
      'rgba(57, 175, 209, 0.8)',   // 淺藍色
      'rgba(246, 195, 67, 0.8)',   // 黃色
      'rgba(145, 85, 253, 0.8)',   // 紫色
      'rgba(239, 131, 84, 0.8)',   // 橙色
      'rgba(91, 105, 188, 0.8)',   // 靛藍色
      'rgba(98, 110, 130, 0.8)',   // 灰色
      'rgba(20, 171, 167, 0.8)',   // 藍綠色
  ];
  
  // 創建圖表
  charts.cityDistribution = new Chart(ctx, {
      type: 'pie',
      data: {
          labels: cities,
          datasets: [{
              label: '總登記數',
              data: totalRegistrations,
              backgroundColor: colors,
              borderColor: 'white',
              borderWidth: 2
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  position: 'right',
                  labels: {
                      boxWidth: 15,
                      padding: 15,
                      font: {
                          size: 12
                      }
                  }
              },
              tooltip: {
                  callbacks: {
                      label: function(context) {
                          const label = context.label || '';
                          const value = context.formattedValue;
                          const percentage = ((context.raw / citiesData.reduce((sum, item) => sum + item.totalRegistrations, 0)) * 100).toFixed(1);
                          return `${label}: ${value} (${percentage}%)`;
                      }
                  }
              }
          }
      }
  });
  
  // 存儲原始數據以供日後使用
  charts.cityDistribution.originalData = {
      cities: cities,
      registrations: {
          total: totalRegistrations,
          dog: dogRegistrations,
          cat: catRegistrations
      }
  };
}

/**
* 初始化各縣市絕育率比較圖
* @param {Object} data - 處理後的數據
*/
function initNeuteringRateChart(data) {
  const ctx = document.getElementById('neutering-rate-chart').getContext('2d');
  
  // 獲取前15大縣市（按絕育率）
  const citiesData = Object.entries(data.cityData)
      .map(([city, cityData]) => ({
          city,
          avgNeuteringRate: cityData.avgNeuteringRate,
          dogNeuteringRate: cityData.dogNeuteringRate,
          catNeuteringRate: cityData.catNeuteringRate
      }))
      .filter(item => item.avgNeuteringRate > 0) // 過濾掉沒有絕育率數據的縣市
      .sort((a, b) => b.avgNeuteringRate - a.avgNeuteringRate)
      .slice(0, 15);
  
  // 準備數據
  const cities = citiesData.map(item => item.city);
  const avgNeuteringRates = citiesData.map(item => item.avgNeuteringRate);
  const dogNeuteringRates = citiesData.map(item => item.dogNeuteringRate);
  const catNeuteringRates = citiesData.map(item => item.catNeuteringRate);
  
  // 創建圖表
  charts.neuteringRate = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: cities,
          datasets: [{
              label: '平均絕育率 (%)',
              data: avgNeuteringRates,
              backgroundColor: 'rgba(0, 217, 126, 0.7)',
              borderColor: 'rgba(0, 217, 126, 1)',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',  // 水平條形圖
          plugins: {
              legend: {
                  display: false
              },
              tooltip: {
                  callbacks: {
                      label: function(context) {
                          return context.dataset.label + ': ' + context.formattedValue + '%';
                      }
                  }
              }
          },
          scales: {
              x: {
                  beginAtZero: true,
                  title: {
                      display: true,
                      text: '絕育率 (%)',
                      font: {
                          weight: 'bold'
                      }
                  },
                  max: 100,
                  ticks: {
                      callback: function(value) {
                          return value + '%';
                      }
                  }
              },
              y: {
                  title: {
                      display: true,
                      text: '縣市',
                      font: {
                          weight: 'bold'
                      }
                  }
              }
          }
      }
  });
  
  // 存儲原始數據以供日後使用
  charts.neuteringRate.originalData = {
      cities: cities,
      neuteringRates: {
          avg: avgNeuteringRates,
          dog: dogNeuteringRates,
          cat: catNeuteringRates
      }
  };
}

/**
* 根據年份更新各縣市登記數量分佈圖
* @param {string} year - 年份，'all'表示全部年份
*/
function updateCityDistributionByYear(year) {
  if (!charts.cityDistribution) return;
  
  // 獲取原始數據
  const originalData = charts.cityDistribution.originalData;
  
  // 保存當前的圖表類型和選項
  const chartType = charts.cityDistribution.config.type;
  const options = charts.cityDistribution.options;
  
  // 獲取原始城市列表
  const cities = originalData.cities;
  
  // 獲取活動的動物類型過濾器
  const animalType = document.querySelector('input[name=\"animal-type\"]:checked').value;
  
  // 根據動物類型和年份篩選數據
  let registrations;
  if (animalType === 'dog') {
      registrations = originalData.registrations.dog;
  } else if (animalType === 'cat') {
      registrations = originalData.registrations.cat;
  } else {
      registrations = originalData.registrations.total;
  }
  
  // 如果年份是'all'，直接使用原始數據；否則，根據年份過濾
  if (year !== 'all') {
      // 從處理後的數據中獲取指定年份的數據
      const filteredCitiesData = cities.map((city, index) => {
          const yearData = processedData.yearlyData[year] && processedData.yearlyData[year].cityData[city];
          if (yearData) {
              if (animalType === 'dog') {
                  return {
                      city: city,
                      value: yearData.dogRegistrations || 0
                  };
              } else if (animalType === 'cat') {
                  return {
                      city: city,
                      value: yearData.catRegistrations || 0
                  };
              } else {
                  return {
                      city: city,
                      value: yearData.registrations || 0
                  };
              }
          }
          return { city: city, value: 0 };
      });
      
      // 重新排序和截取前10名
      filteredCitiesData.sort((a, b) => b.value - a.value);
      const top10Cities = filteredCitiesData.slice(0, 10);
      
      // 更新圖表數據
      charts.cityDistribution.data.labels = top10Cities.map(item => item.city);
      charts.cityDistribution.data.datasets[0].data = top10Cities.map(item => item.value);
  } else {
      // 使用原始數據
      charts.cityDistribution.data.labels = cities;
      charts.cityDistribution.data.datasets[0].data = registrations;
  }
  
  // 更新圖表
  charts.cityDistribution.update();
}

/**
* 根據年份更新各縣市絕育率比較圖
* @param {string} year - 年份，'all'表示全部年份
*/
function updateNeuteringRateByYear(year) {
  if (!charts.neuteringRate) return;
  
  // 獲取原始數據
  const originalData = charts.neuteringRate.originalData;
  
  // 保存當前的圖表選項
  const options = charts.neuteringRate.options;
  
  // 獲取活動的動物類型過濾器
  const animalType = document.querySelector('input[name=\"animal-type\"]:checked').value;
  
  // 根據動物類型獲取絕育率數據
  let neuteringRates;
  if (animalType === 'dog') {
      neuteringRates = originalData.neuteringRates.dog;
  } else if (animalType === 'cat') {
      neuteringRates = originalData.neuteringRates.cat;
  } else {
      neuteringRates = originalData.neuteringRates.avg;
  }
  
  // 如果年份是'all'，直接使用原始數據；否則，根據年份過濾
  if (year !== 'all') {
      // 從處理後的數據中獲取指定年份的所有縣市絕育率
      const allCities = processedData.cities;
      const filteredCitiesData = allCities.map(city => {
          const yearData = processedData.yearlyData[year] && processedData.yearlyData[year].cityData[city];
          if (yearData) {
              if (animalType === 'dog') {
                  return {
                      city: city,
                      rate: yearData.dogNeuteringRate || 0
                  };
              } else if (animalType === 'cat') {
                  return {
                      city: city,
                      rate: yearData.catNeuteringRate || 0
                  };
              } else {
                  // 如果狗貓都有數據，取平均；否則取其中一個
                  if (yearData.dogNeuteringRate > 0 && yearData.catNeuteringRate > 0) {
                      return {
                          city: city,
                          rate: (yearData.dogNeuteringRate + yearData.catNeuteringRate) / 2
                      };
                  } else if (yearData.dogNeuteringRate > 0) {
                      return {
                          city: city,
                          rate: yearData.dogNeuteringRate
                      };
                  } else {
                      return {
                          city: city,
                          rate: yearData.catNeuteringRate
                      };
                  }
              }
          }
          return { city: city, rate: 0 };
      })
      .filter(item => item.rate > 0) // 過濾掉沒有絕育率數據的縣市
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 15);
      
      // 更新圖表數據
      charts.neuteringRate.data.labels = filteredCitiesData.map(item => item.city);
      charts.neuteringRate.data.datasets[0].data = filteredCitiesData.map(item => item.rate);
  } else {
      // 使用原始數據
      charts.neuteringRate.data.labels = originalData.cities;
      charts.neuteringRate.data.datasets[0].data = neuteringRates;
  }
  
  // 更新圖表
  charts.neuteringRate.update();
}

/**
* 更新趨勢圖數據類型（登記數量/絕育率）
* @param {string} dataType - 數據類型：'registrations'或'neutering'
*/
function updateTrendChartDataType(dataType) {
  if (!charts.registrationTrend) return;
  
  // 獲取原始數據
  const originalData = charts.registrationTrend.originalData;
  
  // 獲取活動的動物類型過濾器
  const animalType = document.querySelector('input[name=\"animal-type\"]:checked').value;
  
  // 根據數據類型和動物類型準備新的數據集
  let datasets;
  if (dataType === 'registrations') {
      // 登記數量數據集
      if (animalType === 'all') {
          datasets = [
              {
                  label: '總登記數',
                  data: originalData.registrations.total,
                  backgroundColor: 'rgba(44, 123, 229, 0.2)',
                  borderColor: 'rgba(44, 123, 229, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(44, 123, 229, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(44, 123, 229, 1)',
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  tension: 0.3
              },
              {
                  label: '狗登記數',
                  data: originalData.registrations.dog,
                  backgroundColor: 'rgba(0, 217, 126, 0.2)',
                  borderColor: 'rgba(0, 217, 126, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(0, 217, 126, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(0, 217, 126, 1)',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  tension: 0.3
              },
              {
                  label: '貓登記數',
                  data: originalData.registrations.cat,
                  backgroundColor: 'rgba(230, 83, 110, 0.2)',
                  borderColor: 'rgba(230, 83, 110, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(230, 83, 110, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(230, 83, 110, 1)',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  tension: 0.3
              }
          ];
      } else if (animalType === 'dog') {
          datasets = [
              {
                  label: '狗登記數',
                  data: originalData.registrations.dog,
                  backgroundColor: 'rgba(0, 217, 126, 0.2)',
                  borderColor: 'rgba(0, 217, 126, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(0, 217, 126, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(0, 217, 126, 1)',
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  tension: 0.3
              }
          ];
      } else {
          datasets = [
              {
                  label: '貓登記數',
                  data: originalData.registrations.cat,
                  backgroundColor: 'rgba(230, 83, 110, 0.2)',
                  borderColor: 'rgba(230, 83, 110, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(230, 83, 110, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(230, 83, 110, 1)',
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  tension: 0.3
              }
          ];
      }
      
      // 更新Y軸標題
      charts.registrationTrend.options.scales.y.title.text = '登記數量';
  } else {
      // 絕育率數據集
      if (animalType === 'all') {
          datasets = [
              {
                  label: '平均絕育率',
                  data: originalData.neuteringRates.total,
                  backgroundColor: 'rgba(44, 123, 229, 0.2)',
                  borderColor: 'rgba(44, 123, 229, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(44, 123, 229, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(44, 123, 229, 1)',
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  tension: 0.3
              },
              {
                  label: '狗絕育率',
                  data: originalData.neuteringRates.dog,
                  backgroundColor: 'rgba(0, 217, 126, 0.2)',
                  borderColor: 'rgba(0, 217, 126, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(0, 217, 126, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(0, 217, 126, 1)',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  tension: 0.3
              },
              {
                  label: '貓絕育率',
                  data: originalData.neuteringRates.cat,
                  backgroundColor: 'rgba(230, 83, 110, 0.2)',
                  borderColor: 'rgba(230, 83, 110, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(230, 83, 110, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(230, 83, 110, 1)',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  tension: 0.3
              }
          ];
      } else if (animalType === 'dog') {
          datasets = [
              {
                  label: '狗絕育率',
                  data: originalData.neuteringRates.dog,
                  backgroundColor: 'rgba(0, 217, 126, 0.2)',
                  borderColor: 'rgba(0, 217, 126, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(0, 217, 126, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(0, 217, 126, 1)',
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  tension: 0.3
              }
          ];
      } else {
          datasets = [
              {
                  label: '貓絕育率',
                  data: originalData.neuteringRates.cat,
                  backgroundColor: 'rgba(230, 83, 110, 0.2)',
                  borderColor: 'rgba(230, 83, 110, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(230, 83, 110, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(230, 83, 110, 1)',
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  tension: 0.3
              }
          ];
      }
      
      // 更新Y軸標題
      charts.registrationTrend.options.scales.y.title.text = '絕育率 (%)';
      
      // 更新Y軸刻度，增加百分比符號
      charts.registrationTrend.options.scales.y.ticks.callback = function(value) {
          return value + '%';
      };
      
      // 更新工具提示，增加百分比符號
      charts.registrationTrend.options.plugins.tooltip.callbacks.label = function(context) {
          return context.dataset.label + ': ' + context.formattedValue + '%';
      };
  }
  
  // 更新數據集
  charts.registrationTrend.data.datasets = datasets;
  
  // 更新圖表
  charts.registrationTrend.update();
}

/**
* 根據過濾條件更新所有圖表
* @param {Object} filters - 過濾條件
*/
function updateAllCharts(filters) {
  // 首先根據過濾條件更新年度趨勢圖
  if (charts.registrationTrend) {
      updateTrendChartByFilters(filters);
  }
  
  // 更新各縣市登記數量分佈圖
  if (charts.cityDistribution) {
      updateCityDistributionByYear(filters.year);
  }
  
  // 更新各縣市絕育率比較圖
  if (charts.neuteringRate) {
      updateNeuteringRateByYear(filters.year);
  }
}

/**
 * 根據過濾條件更新年度趨勢圖
 * @param {Object} filters - 過濾條件
 */
function updateTrendChartByFilters(filters) {
    // 獲取當前的數據類型（登記數量或絕育率）
    const dataType = document.querySelector('#trend-data-type button.active').getAttribute('data-type');
    
    // 根據數據類型和過濾條件更新圖表
    updateTrendChartDataType(dataType);
    
    // 如果指定了縣市過濾條件，則僅顯示該縣市的數據
    if (filters.city !== 'all' && charts.registrationTrend) {
        const city = filters.city;
        const years = charts.registrationTrend.originalData.years;
        
        // 獲取該縣市的數據
        const cityData = [];
        years.forEach(year => {
            const yearData = processedData.yearlyData[year];
            if (yearData && yearData.cityData[city]) {
                if (filters.animalType === 'dog') {
                    cityData.push(yearData.cityData[city].dogRegistrations || 0);
                } else if (filters.animalType === 'cat') {
                    cityData.push(yearData.cityData[city].catRegistrations || 0);
                } else {
                    cityData.push(yearData.cityData[city].registrations || 0);
                }
            } else {
                cityData.push(0);
            }
        });
        
        // 更新圖表數據
        charts.registrationTrend.data.datasets = [{
            label: `${city}${filters.animalType === 'dog' ? '狗' : filters.animalType === 'cat' ? '貓' : ''}登記數`,
            data: cityData,
            backgroundColor: 'rgba(44, 123, 229, 0.2)',
            borderColor: 'rgba(44, 123, 229, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(44, 123, 229, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(44, 123, 229, 1)',
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.3
        }];
        
        // 更新圖表
        charts.registrationTrend.update();
    }
}

/**
 * 導出圖表對象
 */
function getCharts() {
    return charts;
}

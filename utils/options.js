import * as echarts from '../components/ec-canvas/echarts';
function initBar(canvas, width, height, dpr, weekObj, max) {
  const barChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(barChart);
  var option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {        // 坐标轴指示器，坐标轴触发有效
        type: 'line'        // 默认为直线，可选为：'line' | 'shadow'
      }
    },
    grid: {
      left: 5,
      right: 5,
      bottom: 12,
      top: 20,
      containLabel: true
    },
    xAxis:
    {
      type: 'category',
      data: ['一', '二', '三', '四', '五', '六', '日'],
      axisLabel: {
        textStyle: {
          fontSize: 10,
          color: '#666'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#666',
          width: 1,//这里是为了突出显示加上的
        },
      },
      axisTick: {
        show: false
      },
      // nameTextStyle:{
      //   fontSize: 8
      // }
    },
    yAxis:
    {
      type: 'value',
      min: 0,
      max: '',
      splitNumber: 2,
      splitLine: {
        show: true,
        lineStyle: {
          color: ['#eaebed']
        }
      },
      axisLabel: {
        show: true,
        textStyle: {
          fontSize: 12,
          color: '#666'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#666',
          width: 1,//这里是为了突出显示加上的
        },
      }
    },
    series: [
      {
        type: 'bar',
        label: {
          normal: {
            show: true,
            lineHeight: 20,
            distance: 0,
            top: 5,
            position: 'top',
            color: '#666'
          }
        },
        data: [
          {
            value: weekObj[0],
            itemStyle: {
              color: '#4ecca3'
            }
          },
          {
            value: weekObj[1],
            itemStyle: {
              color: '#4ecca3'
            }
          },
          {
            value: weekObj[2],
            itemStyle: {
              color: '#4ecca3'
            }
          },
          {
            value: weekObj[3],
            itemStyle: {
              color: '#4ecca3'
            }
          },
          {
            value: weekObj[4],
            itemStyle: {
              color: '#4ecca3'
            }
          },
          {
            value: weekObj[5],
            itemStyle: {
              color: '#fce38a'
            }
          },
          {
            value: weekObj[6],
            itemStyle: {
              color: '#fce38a'
            }
          }
        ],
        showBackground: true,
        backgroundStyle: {
          opacity: 0
        },
        itemStyle: {
          color: '#24D8DA',
          borderRadius: [10, 10, 0, 0]
        },
        barWidth: 15,
        emphasis: {
          itemStyle: {
            color: '#1874ef'
          }
        }
      }
    ]
  }
  //如果非5的倍数，向上取值
  if (max > 0) {
    option.yAxis.max = max
    option.yAxis.splitNumber = max / 5
  }
  // option.series[0].data.value=10
  barChart.setOption(option, true);
  return barChart;
}
function initBar2(canvas, width, height, dpr, monthArr, max) {
  const barChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(barChart);

  var option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {            // 坐标轴指示器，坐标轴触发有效
        type: 'line'        // 默认为直线，可选为：'line' | 'shadow'
      }
    },
    grid: {
      left: 5,
      right: 5,
      bottom: 12,
      top: 20,
      containLabel: true
    },
    xAxis:
    {
      type: 'category',
      data: days(),
      axisLabel: {
        textStyle: {
          fontSize: 10,
          color: '#666'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#666',
          width: 1,//这里是为了突出显示加上的
        },
      },
      axisTick: {
        show: false
      },
    },
    yAxis:
    {
      type: 'value',
      min: 0,
      max: '',
      splitNumber: 2,
      splitLine: {
        show: true,
        lineStyle: {
          color: ['#eaebed']
        }
      },
      axisLabel: {
        show: true,
        textStyle: {
          fontSize: 12,
          color: '#666'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#666',
          width: 1,//这里是为了突出显示加上的
        },
      }
    },
    series: [
      {
        type: 'bar',
        label: {
          normal: {
            show: false,
            lineHeight: 20,
            distance: 0,
            top: 5,
            position: 'top',
            color: '#666'
          }
        },
        data: getMonthData(),
        showBackground: true,
        backgroundStyle: {
          opacity: 0
        },
        itemStyle: {
          color: '#4ecca3',
          borderRadius: [10, 10, 0, 0]
        },
        barWidth: 5,
        emphasis: {
          itemStyle: {
            color: '#1874ef'
          }
        }
      }
    ]
  }
  // 获取天数
  function days() {
    var days = []
    for (var i = 0; i < monthArr.length; i++) {
      days.push(i + 1)
    }
    return days
  }
  // 获取月跑量
  function getMonthData() {
    var jsonstr = [];
    for (var i = 0; i < monthArr.length; i++) {
      var data = {}
      data.value = monthArr[i]
      jsonstr.push(data)
    }
    return jsonstr
  }
  //如果非5的倍数，向上取值
  if (max > 0) {
    option.yAxis.max = max
    option.yAxis.splitNumber = max / 5
  }
  // option.series[0].data.value=10
  barChart.setOption(option, true);
  return barChart;
}

function initBar3(canvas, width, height, dpr, monthArr, max) {
  const barChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(barChart);

  var option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {            // 坐标轴指示器，坐标轴触发有效
        type: 'line'        // 默认为直线，可选为：'line' | 'shadow'
      }
    },
    grid: {
      left: 5,
      right: 5,
      bottom: 12,
      top: 20,
      containLabel: true
    },
    xAxis:
    {
      type: 'category',
      data: months(),
      axisLabel: {
        textStyle: {
          fontSize: 10,
          color: '#666'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#666',
          width: 1,//这里是为了突出显示加上的
        },
      },
      axisTick: {
        show: false
      },
    },
    yAxis:
    {
      type: 'value',
      min: 0,
      max: '500',
      splitNumber: 2,
      splitLine: {
        show: true,
        lineStyle: {
          color: ['#eaebed']
        }
      },
      axisLabel: {
        show: true,
        textStyle: {
          fontSize: 12,
          color: '#666'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#666',
          width: 1,//这里是为了突出显示加上的
        },
      }
    },
    series: [
      {
        type: 'bar',
        label: {
          normal: {
            show: true,
            lineHeight: 20,
            distance: 0,
            top: 5,
            position: 'top',
            color: '#666'
          }
        },
        data: getMonthData(),
        showBackground: true,
        backgroundStyle: {
          opacity: 0
        },
        itemStyle: {
          color: '#4ecca3',
          borderRadius: [10, 10, 0, 0]
        },
        barWidth: 5,
        emphasis: {
          itemStyle: {
            color: '#1874ef'
          }
        }
      }
    ]
  }
  // 获取天数
  function months() {
    var days = []
    for (var i = 0; i < 12; i++) {
      days.push(i + 1)
    }
    return days
  }
  // 获取月跑量
  function getMonthData() {
    var jsonstr = [];
    for (var i = 0; i < monthArr.length; i++) {
      var data = {}
      data.value = Math.floor(monthArr[i])
      jsonstr.push(data)
    }
    return jsonstr
  }
  //如果非5的倍数，向上取值
  // option.series[0].data.value=10
  option.yAxis.max = max
  option.yAxis.splitNumber = 6
  barChart.setOption(option, true);
  return barChart;
}

function initCirle0(canvas, width, height, dpr, list, total, myall) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(chart);
  var option = {
    title: {
      text: myall + '/' + total,
      subtext: '',
      subtextStyle: {
        color: "#fff",
        fontSize: 10,
        fontWeight: 'bold',
        // textShadowColor: '#000',
        // textShadowBlur: 1
      },
      itemGap: 3,
      left: 'center',
      top: '42%'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    series: [
      {
        name: 'girls data',
        type: 'pie',
        radius: ['30%', '65%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        showEmptyCircle: true,
        label: {
          show: true
        },
        labelLine: {
          show: true
        },
        data: getData()
      }
    ]
  };
  function getData() {
    var jsonstr = [];
    for (var i = 0; i < list.length; i++) {
      var json = {};
      switch (i) {
        case 0:
          json.name = '第一周' + list[i] + '天';
          break;
        case 1:
          json.name = '第二周' + list[i] + '天';
          break;
        case 2:
          json.name = '第三周' + list[i] + '天';
          break;
        case 3:
          json.name = '第四周' + list[i] + '天';
          break;
        case 4:
          json.name = '第五周' + list[i] + '天';
          break;
      }
      json.value = list[i];
      jsonstr.push(json);
    }
    return jsonstr;
  }
  if (myall >= total) {
    option.title.subtext = '达标'
    option.title.subtextStyle.color = "#4ecca3"
  } else {
    option.title.subtext = '未达标'
    option.title.subtextStyle.color = "#ff7559"
  }
  chart.setOption(option);
  return chart;
}
function initCirle(canvas, width, height, dpr, single, total) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(chart);

  var option = {
    title: {
      text: single + '/' + total,  //图形标题，配置在中间对应效果图的80%
      left: 'center',
      top: '20%',
      textStyle: {
        color: '#666',
        fontSize: 16,
        align: "center"
      }
    },
    series: [{
      label: {
        normal: {
          show: false,
        }
      },
      type: 'pie',
      silent: true,
      radius: ['55%', '70%'],
      center: ['50%', '35%'],
      data: [{
        value: (single / total) * 100,
        itemStyle: {
          normal: {
            color: '#fb929e'
          }
        }
      }, {
        value: 100 - (single / total) * 100,
        itemStyle: {
          normal: {
            color: '#f7f6e7'
          }
        }
      }]
    }]
  };
  //进度100%时颜色为红色
  if (option.series[0].data[0].value >= 100) {
    option.series[0].data[0].itemStyle.normal.color = '#4ecca3'
  }
  chart.setOption(option);
  return chart;
}
module.exports = {
  initCirle0: initCirle0,
  initBar: initBar,
  initBar2: initBar2,
  initBar3: initBar3,
  initCirle: initCirle
}
import { chart } from './chart'
import testData from './data'

const myChart = chart(document.getElementById('chart'), testData[0])

myChart.init()
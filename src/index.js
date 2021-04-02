import testData from './data.js'

const WIDTH = 600
const HEIGHT = 200
const PADDING = 40
const DPI_HEIGHT = HEIGHT * 2
const DPI_WIDTH = WIDTH * 2
const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2
const VIEW_WIDTH = DPI_WIDTH
const ROWS_COUNT = 5
const COLS_COUNT = 6
const CIRCLE_RADIUS = 8

const myChart = chart(document.getElementById('chart'), testData[0])
myChart.init()

function chart(canvas, data) {

	const ctx = canvas.getContext('2d');
	let frame
	canvas.style.width = WIDTH + 'px';
	canvas.style.height = HEIGHT + 'px';
	canvas.width = DPI_WIDTH
	canvas.height = DPI_HEIGHT

	const proxy = new Proxy({}, {
		set(...args) {
			const result = Reflect.set(...args)
			frame = requestAnimationFrame(paint)
			return result
		}
	})

	function mousemove({ clientX }) {
		proxy.mouse = {
			x: (clientX - canvas.getBoundingClientRect().left) * 2,
		}
	}

	function mouseleave() {
		proxy.mouse = null
	}

	canvas.addEventListener('mousemove', mousemove)
	canvas.addEventListener('mouseleave', mouseleave)

	function clear() {
		ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT)
	}

	function paint() {
		clear()
		const { min: yMin, max: yMax } = computeBoundaries(data)
		const xMax = data.columns[0].length

		const yRatio = VIEW_HEIGHT / (yMax - yMin)
		const xRatio = VIEW_WIDTH / (xMax - 2)

		const yData = data.columns.filter(col => data.types[col[0]] === 'line')
		const xData = data.columns.filter(col => data.types[col[0]] !== 'line')[0].slice(1)

		yAxis(ctx, yMin, yMax)
		xAxis(ctx, xData, xRatio, proxy)

		yData.map(toCoords(xRatio, yRatio)).forEach((coords, idx) => {
			const color = data.colors[yData[idx][0]]
			line(ctx, coords, color)

			for (const [x, y] of coords) {
				if (isOver(proxy.mouse, x, coords.length)) {
					circle(ctx, [x, y], color)
					break
				}
			}
		})
	}

	return {
		init() {
			paint()
		},
		destroy() {
			cancelAnimationFrame(frame)
			canvas.removeEventListener('mousemove', mousemove)
			canvas.removeEventListener('mousemove', mouseleave)
		}
	}
}

function toCoords(xRatio, yRatio) {
	return (col) =>
		col.slice(1).map((y, i) =>
			[
				Math.floor(i * xRatio),
				Math.floor(DPI_HEIGHT - PADDING - y * yRatio)
			])
}

// function line(ctx, coords, color) {
// 	ctx.beginPath();
// 	ctx.lineWidth = 4
// 	ctx.strokeStyle = color
// 	for (const [x, y] of coords) {
// 		ctx.lineTo(x, y)
// 	}
// 	ctx.stroke();
// 	ctx.closePath();
// }

export function line(ctx, coords, color) {
	ctx.beginPath()
	ctx.save()
	ctx.lineWidth = 4
	ctx.strokeStyle = color
	for (const [x, y] of coords) {
		ctx.lineTo(x, y)
	}
	ctx.stroke()
	ctx.restore()
	ctx.closePath()
}

function computeBoundaries({ columns, types }) {
	return columns.reduce((acc, value) => {
		if (types[value[0]] !== 'line') return acc;

		const currentMin = Math.min(...value.slice(1))
		const currentMax = Math.max(...value.slice(1))

		return {
			min: currentMin < acc.min ? currentMin : acc.min,
			max: currentMax > acc.max ? currentMax : acc.max
		}
	}, {
		min: Number.MAX_SAFE_INTEGER,
		max: Number.MIN_SAFE_INTEGER,
	})
}

function yAxis(ctx, yMin, yMax) {
	const textStep = (yMax - yMin) / ROWS_COUNT
	const step = VIEW_HEIGHT / ROWS_COUNT

	ctx.beginPath();
	ctx.lineWidth = 1
	ctx.strokeStyle = '#bbb'
	ctx.font = 'normal 20px Helvetica,sans-serif'
	ctx.fillStyle = "#96a2aa"
	for (let i = 1; i <= ROWS_COUNT; i++) {
		const y = step * i + PADDING
		const text = Math.round(yMax - textStep * i)
		ctx.fillText(text, 5, y - 10)
		ctx.moveTo(0, y)
		ctx.lineTo(DPI_WIDTH, y)
	}
	ctx.stroke();
	ctx.closePath();
}

function xAxis(ctx, xData, xRatio, { mouse }) {
	const step = Math.round(xData.length / COLS_COUNT)
	ctx.beginPath();
	ctx.strokeStyle = '#bbb'
	ctx.lineWidth = 4
	ctx.font = 'normal 20px Helvetica,sans-serif'
	ctx.fillStyle = "#96a2aa"
	xData.forEach((timestamp, i) => {
		const x = i * xRatio
		if ((i - 1) % step === 0) {
			const date = toDate(timestamp)
			ctx.fillText(date, x, DPI_HEIGHT - 10)
		}
		if (isOver(mouse, x, xData.length)) {
			ctx.save()
			ctx.moveTo(x, PADDING / 2)
			ctx.lineTo(x, DPI_HEIGHT - PADDING)
			ctx.restore()
		}
	})
	ctx.stroke()
	ctx.closePath();
}

function toDate(timestamp) {
	const shortMonths = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	]
	const date = new Date(timestamp)
	return `${shortMonths[date.getMonth()]} ${date.getDate()}`
}

function isOver(mouse, x, length) {
	console.log(mouse, x, length)
	if (!mouse) {
		return false
	}
	const segmentWidth = DPI_WIDTH / length
	return Math.abs(x - mouse.x) < segmentWidth / 2
}

function circle(ctx, [x, y], color) {
	ctx.beginPath()
	ctx.save()
	ctx.strokeStyle = color
	ctx.fillStyle = '#fff'
	ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2)
	ctx.fill()
	ctx.stroke()
	ctx.restore()
	ctx.closePath()
}




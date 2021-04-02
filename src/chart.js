import { isOver, toDate, circle, computeBoundaries, line, toCoords, css } from './utils'
import { tooltip } from './tooltip'

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

export function chart(root, data) {

	const canvas = root.querySelector('canvas')
	const ctx = canvas.getContext('2d');
	const tip = tooltip(root.querySelector('[data-el="tooltip"]'))
	let frame

	canvas.width = DPI_WIDTH
	canvas.height = DPI_HEIGHT
	css(canvas, {
		width: WIDTH + 'px',
		height: HEIGHT + 'px'
	})

	const proxy = new Proxy({}, {
		set(...args) {
			const result = Reflect.set(...args)
			frame = requestAnimationFrame(paint)
			return result
		}
	})

	canvas.addEventListener('mousemove', mousemove)
	canvas.addEventListener('mouseleave', mouseleave)

	function mousemove({ clientX, clientY }) {
		const { left, top } = canvas.getBoundingClientRect()
		proxy.mouse = {
			x: (clientX - left) * 2,
			tooltip: {
				left: clientX - left,
				top: clientY - top
			}
		}
	}

	function mouseleave() {
		proxy.mouse = null
		tip.hide()
	}

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

		yAxis(yMin, yMax)
		xAxis(xData, yData, xRatio, data)

		yData.map(toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING)).forEach((coords, idx) => {
			const color = data.colors[yData[idx][0]]
			line(ctx, coords, color)

			for (const [x, y] of coords) {
				if (isOver(proxy.mouse, x, coords.length, DPI_WIDTH)) {
					circle(ctx, [x, y], { color, radius: CIRCLE_RADIUS })
					break
				}
			}
		})
	}

	function yAxis(yMin, yMax) {
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

	function xAxis(xData, yData, xRatio, data) {
		const step = Math.round(xData.length / COLS_COUNT)
		ctx.beginPath();
		ctx.strokeStyle = '#bbb'
		ctx.lineWidth = 2
		ctx.font = 'normal 20px Helvetica,sans-serif'
		ctx.fillStyle = "#96a2aa"
		xData.forEach((timestamp, i) => {
			const x = i * xRatio
			if ((i - 1) % step === 0) {
				const date = toDate(timestamp)
				ctx.fillText(date, x, DPI_HEIGHT - 10)
			}
			if (isOver(proxy.mouse, x, xData.length, DPI_WIDTH)) {
				ctx.save()
				ctx.moveTo(x, PADDING / 2)
				ctx.lineTo(x, DPI_HEIGHT - PADDING)
				ctx.restore()



				tip.show(proxy.mouse.tooltip, {
					title: toDate(timestamp),
					items: yData.map(col => {
						return {
							color: data.colors[col[0]],
							name: data.names[col[0]],
							value: col[i + 1]
						}
					})
				})
			}
		})
		ctx.stroke()
		ctx.closePath();
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

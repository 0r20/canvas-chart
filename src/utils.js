export function toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING) {
	return (col) =>
		col.slice(1).map((y, i) =>
			[
				Math.floor(i * xRatio),
				Math.floor(DPI_HEIGHT - PADDING - y * yRatio)
			])
}

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

export function computeBoundaries({ columns, types }) {
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

export function toDate(timestamp) {
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

export function isOver(mouse, x, length, DPI_WIDTH) {
	if (!mouse) {
		return false
	}
	const segmentWidth = DPI_WIDTH / length
	return Math.abs(x - mouse.x) < segmentWidth / 2
}

export function circle(ctx, [x, y], { color, radius }) {
	ctx.beginPath()
	ctx.save()
	ctx.strokeStyle = color
	ctx.fillStyle = '#fff'
	ctx.arc(x, y, radius, 0, Math.PI * 2)
	ctx.fill()
	ctx.stroke()
	ctx.restore()
	ctx.closePath()
}

export function css(el, styles) {
	return Object.assign(el.style, styles)
}
import React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

// Extend dayjs with weekOfYear plugin
dayjs.extend(weekOfYear)

interface CommitData {
	project: string
	branch: string
	date: string
	author: string
	message: string
}

const isCommitData = (data: unknown): data is CommitData => {
	return (
		typeof data === 'object' &&
		data !== null &&
		'project' in data &&
		'branch' in data &&
		'date' in data &&
		'author' in data &&
		'message' in data
	)
}

interface Commit {
	project: string
	branch: string
	date: string
	author: string
	message: string
}

interface MorphingChartProps {
	projectFilter?: string
	search?: string
	groupBy: 'day' | 'month' | 'week' | 'year'
	getFiltered: (data: CommitData[]) => Commit[]
}

function formatGroupKey(date: string, unit: 'day' | 'month' | 'week' | 'year') {
	const d = dayjs(date)
	switch (unit) {
		case 'day':
			return d.format('MMM D, YYYY')
		case 'month':
			return d.format('MMM YYYY')
		case 'week':
			return `Week ${d.week()} ${d.year()}`
		case 'year':
			return d.format('YYYY')
	}
}

function getFormatForGroup(groupBy: 'day' | 'month' | 'week' | 'year'): string {
	switch (groupBy) {
		case 'day':
			return 'MMM D, YYYY'
		case 'month':
			return 'MMM YYYY'
		case 'week':
			return '[Week] W YYYY'
		case 'year':
			return 'YYYY'
	}
}

function getTickFormat(groupBy: 'day' | 'month' | 'week' | 'year'): string {
	switch (groupBy) {
		case 'day':
			return 'MMM D'
		case 'month':
			return 'MMM YY'
		case 'week':
			return '[W]W'
		case 'year':
			return 'YYYY'
	}
}

function MorphingChart({
	projectFilter = 'all',
	search = '',
	groupBy,
	getFiltered
}: MorphingChartProps) {
	const svgRef = useRef<SVGSVGElement | null>(null)
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	const [commits, setCommits] = useState<Commit[]>([])
	const [filtered, setFiltered] = useState<Commit[]>([])
	const [dimensions, setDimensions] = useState({ width: 960, height: 300 })
	const [showingPie, setShowingPie] = useState(false)

	// Memoize the filter function
	const filterCommits = useCallback(() => {
		const filteredCommits = commits
			.filter(
				(c) =>
					(projectFilter === 'all' || c.project === projectFilter) &&
					(search ? JSON.stringify(c).toLowerCase().includes(search.toLowerCase()) : true)
			)
			.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())

		getFiltered(filteredCommits)
		setFiltered(filteredCommits)
	}, [commits, projectFilter, search, getFiltered])

	// Load initial data
	useEffect(() => {
		fetch('/commits/all-commits.json')
			.then((res) => res.json())
			.then((data) => {
				const commitsData = data.filter(isCommitData)
				setCommits(commitsData)
			})
			.catch((err) => console.error('Failed to load commits:', err))
	}, [])

	// Apply filtering when dependencies change
	useEffect(() => {
		console.log('Filtering commits')
		filterCommits()
	}, [filterCommits])

	// Handle resize
	useEffect(() => {
		if (!wrapperRef.current) return

		const resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				const { width, height } = entry.contentRect
				setDimensions({ width, height })
			}
		})

		resizeObserver.observe(wrapperRef.current)
		return () => resizeObserver.disconnect()
	}, [])

	// Render chart
	useEffect(() => {
		if (!filtered.length || !svgRef.current) return

		const svg = d3
			.select(svgRef.current)
			.attr('width', dimensions.width)
			.attr('height', dimensions.height)
		svg.selectAll('*').remove()

		const grouped: Record<string, Record<string, number>> = {}
		filtered.forEach((commit) => {
			const groupKey = formatGroupKey(commit.date, groupBy)
			if (!grouped[groupKey]) grouped[groupKey] = {}
			if (!grouped[groupKey][commit.project]) grouped[groupKey][commit.project] = 0
			grouped[groupKey][commit.project]++
		})

		const projects = Array.from(new Set(filtered.map((d) => d.project)))
		const timeGroups = Object.keys(grouped).sort((a, b) => {
			const dateA = dayjs(a, getFormatForGroup(groupBy))
			const dateB = dayjs(b, getFormatForGroup(groupBy))
			return dateA.valueOf() - dateB.valueOf()
		})

		const stackedData = timeGroups.map((groupKey) => {
			const entry: any = { date: groupKey }
			projects.forEach((p) => (entry[p] = grouped[groupKey][p] || 0))
			return entry
		})

		const totalsByProject = projects.map((project) => ({
			project,
			total: d3.sum(stackedData, (d) => d[project])
		}))
		const totalCommits = d3.sum(totalsByProject, (d) => d.total)

		const margin = { top: 30, right: 30, bottom: 50, left: 50 }
		const innerWidth = dimensions.width - margin.left - margin.right
		const innerHeight = dimensions.height - margin.top - margin.bottom

		const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

		const x = d3.scaleBand().domain(timeGroups).range([0, innerWidth]).padding(0.1)

		const y = d3.scaleLinear().range([innerHeight, 0])

		const color = d3.scaleOrdinal(d3.schemeCategory10).domain(projects)

		const stack = d3.stack().keys(projects)
		const layers = stack(stackedData)
		y.domain([0, d3.max(layers[layers.length - 1], (d) => d[1]) || 0])

		const tooltip = d3
			.select('body')
			.append('div')
			.attr('id', 'tooltip')
			.style('position', 'absolute')
			.style('background', 'var(--popover)')
			.style('border', '1px solid var(--border)')
			.style('padding', '10px')
			.style('border-radius', '4px')
			.style('font-size', '13px')
			.style('pointer-events', 'none')
			.style('opacity', 0)
			.style('box-shadow', '0 2px 6px rgba(0,0,0,0.2)')

		const barsGroup = g.append('g')

		barsGroup
			.selectAll('g')
			.data(layers)
			.join('g')
			.attr('fill', (d) => color(d.key))
			.selectAll('rect')
			.data((d) => d.map((v) => ({ ...v, key: d.key })))
			.join('rect')
			.attr('x', (d) => x(String(d.data.date)) || 0)
			.attr('y', (d) => y(d[1]))
			.attr('height', (d) => y(d[0]) - y(d[1]))
			.attr('width', x.bandwidth())
			.attr('class', 'bar')
			.style('cursor', 'crosshair')
			.on('mouseover', function (event: MouseEvent, d: any) {
				const date = d.data.date
				const total = d3.sum(projects, (p) => d.data[p])
				const content = projects
					.filter((p) => d.data[p] > 0)
					.map((p) => {
						const pct = ((d.data[p] / total) * 100).toFixed(1)
						return `<div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:12px;height:12px;background:${color(p)};border-radius:2px;"></span>
              <span><strong>${p}</strong>: ${d.data[p]} (${pct}%)</span>
            </div>`
					})
					.join('')
				tooltip
					.html(`<div><strong>${date}</strong></div>${content}`)
					.style('left', event.pageX + 10 + 'px')
					.style('top', event.pageY - 28 + 'px')
					.transition()
					.duration(200)
					.style('opacity', 1)
			})
			.on('mousemove', function (event: MouseEvent) {
				tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 28 + 'px')
			})
			.on('mouseout', function () {
				tooltip.transition().duration(300).style('opacity', 0)
			})
			.transition()
			.duration(1000)
			.attr('opacity', showingPie ? 0 : 1)

		const xAxis = d3.axisBottom(x)
		if (timeGroups.every((t) => dayjs(t, getFormatForGroup(groupBy)).isValid())) {
			xAxis.tickFormat((d) => dayjs(d, getFormatForGroup(groupBy)).format(getTickFormat(groupBy)))
		}

		const xAxisGroup = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(xAxis)

		const tickCount = Math.min(10, timeGroups.length)
		xAxisGroup
			.selectAll('.tick')
			.style('display', (d, i) =>
				i % Math.ceil(timeGroups.length / tickCount) === 0 ? 'block' : 'none'
			)

		g.append('g').call(d3.axisLeft(y))

		const pieGroup = svg
			.append('g')
			.attr('transform', `translate(${dimensions.width / 2}, ${dimensions.height / 2})`)
			.attr('class', 'pie-chart')
			.style('cursor', 'crosshair')

		pieGroup
			.transition()
			.duration(1000)
			.attr('opacity', showingPie ? 1 : 0)

		const pie = d3.pie<any>().value((d) => d.total)
		const arc = d3
			.arc<any>()
			.innerRadius(0)
			.outerRadius(Math.min(innerWidth, innerHeight) / 2.5)

		if (showingPie) {
			pieGroup
				.selectAll('path')
				.data(pie(totalsByProject), (d, i) => i.toString())
				.join('path')
				.attr('fill', (d: d3.PieArcDatum<{ project: string; total: number }>) =>
					color(d.data.project)
				)
				.attr('d', arc)
				.on(
					'mouseover',
					function (event: MouseEvent, d: d3.PieArcDatum<{ project: string; total: number }>) {
						const percent = ((d.data.total / totalCommits) * 100).toFixed(1)
						const content = `<div style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:12px;height:12px;background:${color(d.data.project)};border-radius:2px;"></span>
            <span><strong>${d.data.project}</strong>: ${d.data.total} (${percent}%)</span>
          </div>`
						tooltip
							.html(content)
							.style('left', event.pageX + 10 + 'px')
							.style('top', event.pageY - 28 + 'px')
							.transition()
							.duration(200)
							.style('opacity', 1)
					}
				)
				.on('mousemove', function (event: MouseEvent) {
					tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 28 + 'px')
				})
				.on('mouseout', function () {
					tooltip.transition().duration(300).style('opacity', 0)
				})
		}

		return () => {
			tooltip.remove()
		}
	}, [filtered, dimensions, showingPie, groupBy])

	return (
		<div ref={wrapperRef} style={{ width: '100%', height: '300px' }}>
			<button onClick={() => setShowingPie((prev) => !prev)} style={{ marginBottom: '1rem' }}>
				Toggle Chart
			</button>
			<svg ref={svgRef} />
		</div>
	)
}

export { MorphingChart }

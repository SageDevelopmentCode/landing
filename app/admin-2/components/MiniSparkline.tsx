'use client'

interface MiniSparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function MiniSparkline({ data, color = '#7C3AED', width = 80, height = 36 }: MiniSparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const xStep = width / (data.length - 1)

  const normalize = (v: number) => height - ((v - min) / range) * (height - 4) - 2

  const points = data.map((v, i) => `${i * xStep},${normalize(v)}`).join(' ')

  // Path for area fill
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * xStep},${normalize(v)}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`

  const gradId = `spark-${color.replace('#', '')}-${width}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

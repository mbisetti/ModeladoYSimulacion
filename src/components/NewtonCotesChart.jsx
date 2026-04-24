import React, { useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot
} from 'recharts'
import { compileFunction, generatePlotPoints, fmt } from '../utils/mathUtils'
import { getMethod } from '../methods/registry'

const METHOD_COLORS = {
  newtonCotes_trapezoid:  '#69f0ae',
  newtonCotes_simpson13:  '#ffd740',
  newtonCotes_simpson38:  '#ff6e40',
  newtonCotes_midpoint:   '#80cbc4',
  monteCarlo:             '#ff80ab',
}

const TooltipNC = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-active)',
      borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem',
      fontFamily: 'var(--font-mono)', fontSize: '0.74rem',
    }}>
      <div style={{ color: 'var(--text-muted)' }}>x = <span style={{ color: 'var(--accent)' }}>{Number(d?.x).toFixed(5)}</span></div>
      {d?.y != null && <div style={{ color: 'var(--text-muted)' }}>f(x) = <span style={{ color: '#69f0ae' }}>{Number(d.y).toFixed(6)}</span></div>}
    </div>
  )
}

// Build SVG bars for each subinterval (rendered as custom background layer via foreignObject is tricky,
// so we use a trick: duplicate the data with zero-fill outside the bars for area fills)
function buildAreaData(fn, a, b, n, rule) {
  const h = (b - a) / n
  const segments = []

  for (let i = 0; i < n; i++) {
    const x0 = a + i * h
    const x1 = a + (i + 1) * h
    const pts = []

    if (rule === 'midpoint') {
      const xm = (x0 + x1) / 2
      const fm = fn(xm)
      // Rectangle
      pts.push({ x: x0, y: 0 }, { x: x0, y: fm }, { x: x1, y: fm }, { x: x1, y: 0 })
    } else if (rule === 'trapezoid') {
      pts.push({ x: x0, y: 0 }, { x: x0, y: fn(x0) }, { x: x1, y: fn(x1) }, { x: x1, y: 0 })
    } else if (rule === 'simpson13') {
      if (i % 2 === 0 && i + 1 < n) {
        const xm = (x0 + x1) / 2
        pts.push({ x: x0, y: fn(x0) }, { x: xm, y: fn(xm) }, { x: x1, y: fn(x1) })
      }
    } else if (rule === 'simpson38') {
      if (i % 3 === 0 && i + 2 < n) {
        const x2 = x0 + h; const x3 = x0 + 2 * h; const x4 = x0 + 3 * h
        pts.push({ x: x0, y: fn(x0) }, { x: x2, y: fn(x2) }, { x: x3, y: fn(x3) }, { x: x4, y: fn(x4) })
      }
    }
    if (pts.length) segments.push(pts)
  }
  return segments
}

export default function NewtonCotesChart({ fnExpr, result, params, methodId }) {
  const { fn, error: fnError } = useMemo(() => compileFunction(fnExpr), [fnExpr])
  const method = getMethod(methodId)
  const color = METHOD_COLORS[methodId] || '#69f0ae'

  const a = parseFloat(params.a)
  const b = parseFloat(params.b)
  const rawN = parseInt(params.n) || 8
  // Match the adjusted n from result if available
  const n = result?.nAdjusted ?? rawN

  const xMin = isNaN(a) ? -1 : a - Math.abs(b - a) * 0.15
  const xMax = isNaN(b) ? 5  : b + Math.abs(b - a) * 0.15

  const curvePts = useMemo(() => {
    if (!fn || fnError || isNaN(a) || isNaN(b)) return []
    return generatePlotPoints(fn, xMin, xMax, 350)
  }, [fn, fnError, xMin, xMax, a, b])

  // Subinterval sample points for area shading (dense within [a,b])
  const shadePts = useMemo(() => {
    if (!fn || fnError || isNaN(a) || isNaN(b) || n < 1) return []
    const h = (b - a) / n
    const pts = []
    const steps = 6  // points per subinterval for smooth fill
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= steps; j++) {
        const x = a + i * h + (j / steps) * h
        let y = 0
        try { y = fn(x) } catch {}
        pts.push({ x: parseFloat(x.toFixed(6)), area: isFinite(y) ? y : 0, y: null })
      }
    }
    return pts
  }, [fn, fnError, a, b, n])

  // Merge curve + shade data on same x axis
  const mergedData = useMemo(() => {
    const map = new Map()
    curvePts.forEach(p => map.set(p.x, { x: p.x, y: p.y, area: null }))
    shadePts.forEach(p => {
      const ex = map.get(p.x)
      if (ex) { ex.area = p.area }
      else map.set(p.x, { x: p.x, y: null, area: p.area })
    })
    return [...map.values()].sort((a, b) => a.x - b.x)
  }, [curvePts, shadePts])

  // Subinterval tick marks
  const subTicks = useMemo(() => {
    if (isNaN(a) || isNaN(b) || n < 1) return []
    const h = (b - a) / n
    return Array.from({ length: n + 1 }, (_, i) => parseFloat((a + i * h).toFixed(8)))
  }, [a, b, n])

  const yVals = curvePts.map(p => p.y).filter(y => y != null && isFinite(y))
  const yMin = yVals.length ? Math.min(...yVals) : -2
  const yMax = yVals.length ? Math.max(...yVals) : 2
  const yPad = Math.max((yMax - yMin) * 0.18, 0.5)

  // Rule abbreviation for rule name label
  const ruleLabel = {
    newtonCotes_trapezoid:  'Regla del Trapecio',
    newtonCotes_simpson13:  'Simpson 1/3',
    newtonCotes_simpson38:  'Simpson 3/8',
    newtonCotes_midpoint:   'Rectángulo Medio',
  }[methodId] || method?.label

  const integralResult = result?.root

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">
          {ruleLabel} — <code>∫f(x)dx</code> en <code>[{isNaN(a)?'a':fmt(a,4)}, {isNaN(b)?'b':fmt(b,4)}]</code>
        </span>
        <div className="chart-badges">
          <span className="badge-n">{n} subintervalos</span>
          {integralResult != null && (
            <span className="root-badge" style={{ '--c': color }}>
              ∫ ≈ {Number(integralResult).toFixed(7)}
            </span>
          )}
        </div>
      </div>

      {fnError ? (
        <div className="chart-empty">Función inválida.</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={mergedData} margin={{ top: 12, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.45} />
            <XAxis
              dataKey="x" type="number" domain={[xMin, xMax]} tickCount={8}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-active)' }} tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              domain={[Math.min(yMin - yPad, -0.1), yMax + yPad]} tickCount={6} width={56}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-active)' }} tickLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip content={<TooltipNC />} />

            {/* Shaded area under curve within [a,b] */}
            <Area
              type="monotone" dataKey="area"
              stroke="none"
              fill={color}
              fillOpacity={0.2}
              connectNulls={false}
              isAnimationActive={false}
              dot={false}
              activeDot={false}
            />

            {/* Subinterval vertical lines */}
            {subTicks.map(t => (
              <ReferenceLine key={t} x={t} stroke={color} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 2" />
            ))}

            {/* a and b bounds */}
            {!isNaN(a) && <ReferenceLine x={a} stroke={color} strokeWidth={2} strokeOpacity={0.9}
              label={{ value: 'a', fill: color, fontSize: 11, fontFamily: 'var(--font-mono)', position: 'top' }} />}
            {!isNaN(b) && <ReferenceLine x={b} stroke={color} strokeWidth={2} strokeOpacity={0.9}
              label={{ value: 'b', fill: color, fontSize: 11, fontFamily: 'var(--font-mono)', position: 'top' }} />}

            {/* Zero line */}
            <ReferenceLine y={0} stroke="var(--border-active)" strokeWidth={1.5} />

            {/* f(x) curve on top */}
            <Line
              type="monotone" dataKey="y" name="f(x)"
              stroke="var(--accent)" strokeWidth={2.5}
              dot={false} connectNulls={false}
              activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--bg-base)' }}
            />

            {/* Sample points at subinterval boundaries */}
            {fn && subTicks.map(t => {
              let yt = 0
              try { yt = fn(t) } catch {}
              if (!isFinite(yt)) return null
              return (
                <ReferenceDot key={'dot-' + t} x={t} y={yt}
                  r={3} fill={color} stroke="var(--bg-base)" strokeWidth={1} />
              )
            })}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <style>{`
        .chart-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .chart-header { padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .chart-title { font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; }
        .chart-title code { font-family: var(--font-mono); color: var(--accent); font-size: 0.8rem; }
        .chart-badges { display: flex; align-items: center; gap: 0.5rem; }
        .badge-n { font-family: var(--font-mono); font-size: 0.7rem; padding: 0.15rem 0.55rem; border-radius: 99px; border: 1px solid var(--border); color: var(--text-muted); }
        .root-badge { font-family: var(--font-mono); font-size: 0.72rem; background: color-mix(in srgb, var(--c, #69f0ae) 12%, transparent); border: 1px solid color-mix(in srgb, var(--c, #69f0ae) 35%, transparent); color: var(--c, #69f0ae); border-radius: 99px; padding: 0.15rem 0.6rem; }
        .chart-empty { height: 320px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem; font-style: italic; }
      `}</style>
    </div>
  )
}

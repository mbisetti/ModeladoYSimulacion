import React, { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceDot
} from 'recharts'
import { getMethod } from '../methods/registry'

const METHOD_COLORS = {
  euler: '#81d4fa',
  heun:  '#a5d6a7',
  rk4:   '#ce93d8',
}

const TooltipODE = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-active)',
      borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem',
      fontFamily: 'var(--font-mono)', fontSize: '0.74rem',
    }}>
      <div style={{ color: 'var(--text-muted)' }}>
        x = <span style={{ color: 'var(--accent)' }}>{Number(payload[0]?.payload?.x).toFixed(4)}</span>
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name} = <span style={{ fontWeight: 600 }}>{Number(p.value).toFixed(6)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ODEChart({ result, params, methodId }) {
  const method = getMethod(methodId)
  const color = METHOD_COLORS[methodId] || '#00e5ff'

  // Build plot data from iterations
  const plotData = useMemo(() => {
    if (!result?.iterations?.length) return []
    const rows = []
    // Add initial point
    rows.push({ x: parseFloat(params.x0 ?? 0), y: parseFloat(params.y0 ?? 0) })
    result.iterations.forEach(it => {
      rows.push({ x: parseFloat(it._x ?? it.xn), y: parseFloat(it._approx) })
    })
    return rows.filter(p => isFinite(p.x) && isFinite(p.y))
  }, [result, params])

  const odeExpr = params.odeExpr || '?'
  const lastY = result?.root
  const lastX = plotData.at(-1)?.x

  // Y range
  const yVals = plotData.map(p => p.y)
  const yMin = yVals.length ? Math.min(...yVals) : 0
  const yMax = yVals.length ? Math.max(...yVals) : 1
  const yPad = Math.max((yMax - yMin) * 0.18, 0.5)

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">
          Solución numérica — <code>dy/dx = {odeExpr}</code>
        </span>
        <div className="chart-badges">
          <span className="badge-method" style={{ '--c': color }}>{method?.label}</span>
          {lastY != null && (
            <span className="root-badge">
              y({typeof lastX === 'number' ? lastX.toFixed(3) : '?'}) ≈ {Number(lastY).toFixed(6)}
            </span>
          )}
        </div>
      </div>

      {!plotData.length ? (
        <div className="chart-empty">Ejecutá el método para ver la trayectoria.</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={plotData} margin={{ top: 12, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.45} />
            <XAxis
              dataKey="x" type="number"
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-active)' }} tickLine={{ stroke: 'var(--border)' }}
              label={{ value: 'x', position: 'insideBottomRight', offset: -8, fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <YAxis
              domain={[yMin - yPad, yMax + yPad]} tickCount={6} width={56}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-active)' }} tickLine={{ stroke: 'var(--border)' }}
              label={{ value: 'y', angle: -90, position: 'insideLeft', offset: 12, fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <Tooltip content={<TooltipODE />} />
            <Line
              type="monotone" dataKey="y" name={method?.label ?? 'y(x)'}
              stroke={color} strokeWidth={2.5}
              dot={{ r: 2.5, fill: color, stroke: 'var(--bg-base)', strokeWidth: 1 }}
              activeDot={{ r: 5, fill: color, stroke: 'var(--bg-base)', strokeWidth: 2 }}
            />
            {/* Mark initial condition */}
            <ReferenceDot
              x={parseFloat(params.x0 ?? 0)} y={parseFloat(params.y0 ?? 0)}
              r={6} fill="var(--amber)" stroke="var(--bg-base)" strokeWidth={2}
              label={{ value: 'y₀', position: 'top', fill: 'var(--amber)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            />
            {/* Mark final point */}
            {lastY != null && lastX != null && (
              <ReferenceDot
                x={lastX} y={lastY}
                r={6} fill="var(--green)" stroke="var(--bg-base)" strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      <style>{`
        .chart-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .chart-header { padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .chart-title { font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; }
        .chart-title code { font-family: var(--font-mono); color: var(--accent); font-size: 0.8rem; }
        .chart-badges { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .badge-method { font-family: var(--font-mono); font-size: 0.7rem; padding: 0.15rem 0.55rem; border-radius: 99px; border: 1px solid color-mix(in srgb, var(--c) 40%, transparent); color: var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); }
        .root-badge { font-family: var(--font-mono); font-size: 0.72rem; background: var(--green-dim); border: 1px solid rgba(0,255,135,0.3); color: var(--green); border-radius: 99px; padding: 0.15rem 0.6rem; }
        .chart-empty { height: 320px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem; font-style: italic; }
      `}</style>
    </div>
  )
}

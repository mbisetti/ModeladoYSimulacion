import React, { useMemo } from 'react'
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, Legend
} from 'recharts'
import { fmt } from '../utils/mathUtils'
import * as math from 'mathjs'

const TooltipLag = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-active)',
      borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem',
      fontFamily: 'var(--font-mono)', fontSize: '0.74rem',
    }}>
      <div style={{ color: 'var(--text-muted)' }}>x = <span style={{ color: 'var(--accent)' }}>{Number(d?.x).toFixed(5)}</span></div>
      {d?.poly != null && <div style={{ color: '#ea80fc' }}>L(x) = <span style={{ fontWeight: 600 }}>{Number(d.poly).toFixed(6)}</span></div>}
      {d?.node != null && <div style={{ color: '#ffd740' }}>nodo f(x) = <span style={{ fontWeight: 600 }}>{Number(d.node).toFixed(6)}</span></div>}
    </div>
  )
}

function evalLagrange(xs, ys, x) {
  let L = 0
  const n = xs.length
  for (let i = 0; i < n; i++) {
    let li = ys[i]
    for (let j = 0; j < n; j++) {
      if (j !== i) li *= (x - xs[j]) / (xs[i] - xs[j])
    }
    L += li
  }
  return L
}

export default function LagrangeChart({ result, params }) {
  const xs = useMemo(() =>
    String(params.xPoints || '').split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v)),
    [params.xPoints])
  const ys = useMemo(() =>
    String(params.yPoints || '').split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v)),
    [params.yPoints])
  const xEval = parseFloat(params.evalPoint)

  const valid = xs.length >= 2 && ys.length === xs.length

  const xMin = valid ? Math.min(...xs) - Math.abs(Math.max(...xs) - Math.min(...xs)) * 0.25 : -1
  const xMax = valid ? Math.max(...xs) + Math.abs(Math.max(...xs) - Math.min(...xs)) * 0.25 : 3

  // Dense polynomial curve
  const polyCurve = useMemo(() => {
    if (!valid) return []
    const pts = []
    const steps = 250
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin)
      const y = evalLagrange(xs, ys, x)
      if (isFinite(y) && Math.abs(y) < 1e8)
        pts.push({ x: parseFloat(x.toFixed(5)), poly: parseFloat(y.toFixed(8)) })
      else
        pts.push({ x: parseFloat(x.toFixed(5)), poly: null })
    }
    return pts
  }, [valid, xs, ys, xMin, xMax])

  // Node points as scatter
  const nodePts = valid ? xs.map((x, i) => ({ x, node: ys[i] })) : []

  // Eval point
  const evalY = valid && !isNaN(xEval) ? evalLagrange(xs, ys, xEval) : null

  const yVals = polyCurve.map(p => p.poly).filter(y => y != null && isFinite(y))
  const nodeYs = ys.filter(y => isFinite(y))
  const allY = [...yVals, ...nodeYs].filter(isFinite)
  const yMin = allY.length ? Math.min(...allY) : -2
  const yMax = allY.length ? Math.max(...allY) : 2
  const yPad = Math.max((yMax - yMin) * 0.2, 0.5)

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">
          Polinomio Interpolante de Lagrange — <code>L(x)</code>
          &nbsp;con {xs.length} nodos
        </span>
        <div className="chart-badges">
          {evalY != null && (
            <span className="root-badge">
              L({fmt(xEval, 4)}) ≈ {fmt(evalY, 6)}
            </span>
          )}
        </div>
      </div>

      {!valid ? (
        <div className="chart-empty">
          Ingresá los nodos x e y para ver el polinomio interpolante.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart margin={{ top: 12, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.45} />
            <XAxis
              dataKey="x" type="number" domain={[xMin, xMax]} tickCount={8}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-active)' }} tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              domain={[yMin - yPad, yMax + yPad]} tickCount={6} width={56}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-active)' }} tickLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip content={<TooltipLag />} />
            <ReferenceLine y={0} stroke="var(--border-active)" strokeWidth={1.5} />

            {/* Polynomial curve */}
            <Line
              data={polyCurve} dataKey="poly" type="monotone" name="L(x)"
              stroke="#ea80fc" strokeWidth={2.5}
              dot={false} connectNulls={false}
              activeDot={{ r: 4, fill: '#ea80fc', stroke: 'var(--bg-base)' }}
            />

            {/* Interpolation nodes as scatter */}
            <Scatter data={nodePts} dataKey="node" name="Nodos"
              fill="#ffd740" r={6} stroke="var(--bg-base)" strokeWidth={2}
              shape={(props) => {
                const { cx, cy } = props
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={6} fill="#ffd740" stroke="var(--bg-base)" strokeWidth={2} />
                    <circle cx={cx} cy={cy} r={2.5} fill="var(--bg-base)" />
                  </g>
                )
              }}
            />

            {/* Eval point */}
            {evalY != null && isFinite(evalY) && !isNaN(xEval) && (
              <ReferenceDot
                x={xEval} y={evalY}
                r={7} fill="#ea80fc" stroke="var(--bg-base)" strokeWidth={2.5}
                label={{ value: `x*=${fmt(xEval,3)}`, position: 'top', fill: '#ea80fc', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              />
            )}

            {/* Vertical line at eval point */}
            {!isNaN(xEval) && (
              <ReferenceLine x={xEval} stroke="#ea80fc" strokeDasharray="4 3" strokeOpacity={0.5} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Nodes legend */}
      {valid && (
        <div className="nodes-row">
          <span className="nodes-label">Nodos:</span>
          {xs.map((x, i) => (
            <span key={i} className="node-chip">
              ({fmt(x, 4)}, {fmt(ys[i], 4)})
            </span>
          ))}
        </div>
      )}

      <style>{`
        .chart-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .chart-header { padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .chart-title { font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; }
        .chart-title code { font-family: var(--font-mono); color: var(--accent); font-size: 0.8rem; }
        .chart-badges { display: flex; align-items: center; gap: 0.5rem; }
        .root-badge { font-family: var(--font-mono); font-size: 0.72rem; background: rgba(234,128,252,0.12); border: 1px solid rgba(234,128,252,0.35); color: #ea80fc; border-radius: 99px; padding: 0.15rem 0.6rem; }
        .chart-empty { height: 320px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem; font-style: italic; text-align: center; padding: 1rem; }
        .nodes-row { padding: 0.5rem 1.25rem 0.65rem; display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; border-top: 1px solid var(--border); }
        .nodes-label { font-size: 0.68rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-right: 0.2rem; }
        .node-chip { font-family: var(--font-mono); font-size: 0.7rem; background: rgba(255,215,64,0.1); border: 1px solid rgba(255,215,64,0.25); color: #ffd740; border-radius: 4px; padding: 0.1rem 0.4rem; }
      `}</style>
    </div>
  )
}

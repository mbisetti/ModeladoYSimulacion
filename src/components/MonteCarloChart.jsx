import React, { useMemo } from 'react'
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area
} from 'recharts'
import { compileFunction, generatePlotPoints, fmt } from '../utils/mathUtils'

const TooltipMC = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-active)',
      borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem',
      fontFamily: 'var(--font-mono)', fontSize: '0.74rem',
    }}>
      {d?.x != null && <div style={{ color: 'var(--text-muted)' }}>x = <span style={{ color: 'var(--accent)' }}>{Number(d.x).toFixed(5)}</span></div>}
      {d?.ci != null && <div style={{ color: '#ff80ab' }}>I estimada = <span style={{ fontWeight: 600 }}>{Number(d.ci).toFixed(6)}</span></div>}
    </div>
  )
}

// LCG to match the solver's seeded RNG — reproduce the same points visually
function lcgRand(seed) {
  let s = (seed >>> 0)
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export default function MonteCarloChart({ fnExpr, result, params }) {
  const { fn, error: fnError } = useMemo(() => compileFunction(fnExpr), [fnExpr])

  const a = parseFloat(params.a)
  const b = parseFloat(params.b)
  const N = Math.min(parseInt(params.nSamples) || 1000, 500) // show max 500 points visually
  const seed = parseInt(params.seed) || 42

  const xMin = isNaN(a) ? 0 : a
  const xMax = isNaN(b) ? 1 : b

  const curvePts = useMemo(() => {
    if (!fn || fnError || isNaN(a) || isNaN(b)) return []
    return generatePlotPoints(fn, xMin, xMax, 250)
  }, [fn, fnError, xMin, xMax, a, b])

  // Shaded area under curve
  const shadePts = useMemo(() => curvePts.map(p => ({ ...p, shade: p.y })), [curvePts])

  // Scatter points: reproduce the PRNG to show same points as solver
  const scatterPts = useMemo(() => {
    if (!fn || fnError || isNaN(a) || isNaN(b)) return { inside: [], outside: [] }
    const rand = lcgRand(seed)
    const inside = [], outside = []
    const displayN = Math.min(N, 500)
    for (let i = 0; i < displayN; i++) {
      const x = a + rand() * (b - a)
      let fx = 0
      try { fx = fn(x) } catch {}
      if (!isFinite(fx)) continue
      // Random y between 0 and f(x) (or f(x) to 0 if negative)
      const yLo = Math.min(0, fx)
      const yHi = Math.max(0, fx)
      const yRange = yHi - yLo || 1
      const y = yLo + rand() * yRange
      if ((fx >= 0 && y >= 0 && y <= fx) || (fx < 0 && y <= 0 && y >= fx)) {
        inside.push({ x, y })
      } else {
        outside.push({ x, y })
      }
    }
    return { inside, outside }
  }, [fn, fnError, a, b, N, seed])

  // Convergence line from iterations
  const convLine = useMemo(() => {
    if (!result?.iterations?.length) return []
    return result.iterations.map(it => ({
      x: typeof it._approx === 'number' ? it.iter : it.iter,
      ci: parseFloat(it.approx),
    }))
  }, [result])

  const yVals = curvePts.map(p => p.y).filter(y => y != null && isFinite(y))
  const yMin = yVals.length ? Math.min(...yVals) : -1
  const yMax = yVals.length ? Math.max(...yVals) : 1
  const yPad = Math.max((yMax - yMin) * 0.2, 0.5)

  const integralResult = result?.root
  const displayN_actual = scatterPts.inside.length + scatterPts.outside.length

  return (
    <div className="chart-card">
      {/* Top: scatter over f(x) */}
      <div className="chart-header">
        <span className="chart-title">
          Monte Carlo — <code>f(x) = {fnExpr}</code>
        </span>
        <div className="chart-badges">
          <span className="badge-n">{displayN_actual} puntos visualizados</span>
          {integralResult != null && (
            <span className="root-badge">∫ ≈ {Number(integralResult).toFixed(7)}</span>
          )}
        </div>
      </div>

      {fnError ? (
        <div className="chart-empty">Función inválida.</div>
      ) : (
        <>
          {/* Scatter plot */}
          <div style={{ padding: '4px 0 0' }}>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart margin={{ top: 8, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.45} />
                <XAxis
                  dataKey="x" type="number" domain={[xMin, xMax]} tickCount={7}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'var(--border-active)' }} tickLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  domain={[yMin - yPad, yMax + yPad]} tickCount={5} width={52}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'var(--border-active)' }} tickLine={{ stroke: 'var(--border)' }}
                />
                <Tooltip content={<TooltipMC />} />
                <ReferenceLine y={0} stroke="var(--border-active)" strokeWidth={1.5} />
                <ReferenceLine x={a} stroke="#ff80ab" strokeWidth={1.5} strokeOpacity={0.7}
                  label={{ value: 'a', fill: '#ff80ab', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <ReferenceLine x={b} stroke="#ff80ab" strokeWidth={1.5} strokeOpacity={0.7}
                  label={{ value: 'b', fill: '#ff80ab', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                {/* Shaded area */}
                <Area data={shadePts} dataKey="shade" type="monotone"
                  stroke="none" fill="#ff80ab" fillOpacity={0.15} connectNulls={false}
                  isAnimationActive={false} dot={false} activeDot={false} />
                {/* f(x) line */}
                <Line data={curvePts} dataKey="y" type="monotone"
                  stroke="var(--accent)" strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--bg-base)' }} />
                {/* Inside points */}
                <Scatter data={scatterPts.inside} dataKey="y" fill="#00ff87" fillOpacity={0.55} r={2} line={false} />
                {/* Outside points */}
                <Scatter data={scatterPts.outside} dataKey="y" fill="#ff4d6d" fillOpacity={0.35} r={1.5} line={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mc-legend">
            <span className="mc-leg-item">
              <span className="mc-dot" style={{ background: '#00ff87' }} />
              Puntos bajo f(x) ({scatterPts.inside.length})
            </span>
            <span className="mc-leg-item">
              <span className="mc-dot" style={{ background: '#ff4d6d' }} />
              Puntos fuera ({scatterPts.outside.length})
            </span>
          </div>

          {/* Convergence line */}
          {convLine.length > 1 && (
            <>
              <div className="chart-sub-header">Convergencia de la estimación</div>
              <ResponsiveContainer width="100%" height={100}>
                <ComposedChart data={convLine} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="x" type="number"
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    axisLine={{ stroke: 'var(--border-active)' }}
                    label={{ value: 'N muestras', position: 'insideBottomRight', offset: -6, fill: 'var(--text-muted)', fontSize: 10 }}
                  />
                  <YAxis tickCount={3} width={52}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    axisLine={{ stroke: 'var(--border-active)' }}
                  />
                  {integralResult != null && (
                    <ReferenceLine y={integralResult} stroke="#ff80ab" strokeDasharray="4 3"
                      label={{ value: 'I final', fill: '#ff80ab', fontSize: 9, fontFamily: 'var(--font-mono)' }} />
                  )}
                  <Line dataKey="ci" type="monotone" stroke="#ff80ab" strokeWidth={2}
                    dot={false} activeDot={{ r: 3, fill: '#ff80ab' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </>
          )}
        </>
      )}

      <style>{`
        .chart-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .chart-header { padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .chart-title { font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; }
        .chart-title code { font-family: var(--font-mono); color: var(--accent); font-size: 0.8rem; }
        .chart-badges { display: flex; align-items: center; gap: 0.5rem; }
        .badge-n { font-family: var(--font-mono); font-size: 0.7rem; padding: 0.15rem 0.55rem; border-radius: 99px; border: 1px solid var(--border); color: var(--text-muted); }
        .root-badge { font-family: var(--font-mono); font-size: 0.72rem; background: rgba(255,128,171,0.12); border: 1px solid rgba(255,128,171,0.35); color: #ff80ab; border-radius: 99px; padding: 0.15rem 0.6rem; }
        .chart-empty { height: 220px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem; font-style: italic; }
        .mc-legend { display: flex; gap: 1.2rem; padding: 0.4rem 1.25rem 0.5rem; flex-wrap: wrap; }
        .mc-leg-item { font-size: 0.72rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem; font-family: var(--font-mono); }
        .mc-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .chart-sub-header { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; padding: 0.4rem 1.25rem 0; border-top: 1px solid var(--border); }
      `}</style>
    </div>
  )
}

import React, { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot, ResponsiveContainer, Legend
} from 'recharts'
import { compileFunction, generatePlotPoints } from '../utils/mathUtils'
import { getMethod } from '../methods/registry'

function getPlotBounds(methodId, params, result) {
  let center = 0
  let span = 4

  if (methodId === 'bisection' || methodId === 'falsePosition') {
    const a = parseFloat(params.a)
    const b = parseFloat(params.b)
    if (!isNaN(a) && !isNaN(b)) {
      center = (a + b) / 2
      span = Math.max(Math.abs(b - a) * 2, 2)
    }
  } else if (params.x0) {
    const x0 = parseFloat(params.x0)
    if (!isNaN(x0)) { center = x0; span = 6 }
  }

  if (result?.root && isFinite(result.root)) {
    center = result.root
  }

  return [center - span / 2, center + span / 2]
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { x, y } = payload[0].payload
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-active)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.4rem 0.7rem',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.75rem',
    }}>
      <div style={{ color: 'var(--text-secondary)' }}>x = <span style={{ color: 'var(--accent)' }}>{typeof x === 'number' ? x.toFixed(5) : x}</span></div>
      {y !== null && <div style={{ color: 'var(--text-secondary)' }}>f(x) = <span style={{ color: 'var(--green)' }}>{typeof y === 'number' ? y.toFixed(5) : y}</span></div>}
    </div>
  )
}

export default function FunctionChart({ fnExpr, result, params, methodId }) {
  const { fn, error: fnError } = useMemo(() => compileFunction(fnExpr), [fnExpr])

  const [xMin, xMax] = useMemo(
    () => getPlotBounds(methodId, params, result),
    [methodId, params, result]
  )

  const plotData = useMemo(() => {
    if (!fn || fnError) return []
    return generatePlotPoints(fn, xMin, xMax, 400)
  }, [fn, fnError, xMin, xMax])

  const method = getMethod(methodId)

  // Bracket points for closed methods
  const aVal = parseFloat(params.a)
  const bVal = parseFloat(params.b)
  const x0Val = parseFloat(params.x0)

  // Y range — remove nulls and extreme values
  const yVals = plotData.map(p => p.y).filter(y => y !== null && isFinite(y))
  const yMin = yVals.length ? Math.min(...yVals) : -5
  const yMax = yVals.length ? Math.max(...yVals) : 5
  const yPad = Math.max((yMax - yMin) * 0.15, 0.5)

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">
          Gráfica de <code>f(x) = {fnExpr}</code>
        </span>
        {result?.root != null && (
          <span className="root-badge">
            Raíz ≈ {parseFloat(result.root.toFixed(7))}
          </span>
        )}
      </div>

      {fnError ? (
        <div className="chart-empty">Función inválida. Verifica la expresión.</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={plotData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
            <XAxis
              dataKey="x"
              type="number"
              domain={[xMin, xMax]}
              tickCount={8}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-active)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              domain={[yMin - yPad, yMax + yPad]}
              tickCount={6}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-active)' }}
              tickLine={{ stroke: 'var(--border)' }}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Zero line */}
            <ReferenceLine y={0} stroke="var(--border-active)" strokeWidth={1.5} />

            {/* f(x) curve */}
            <Line
              type="monotone"
              dataKey="y"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--bg-base)' }}
              connectNulls={false}
            />

            {/* Bracket markers */}
            {(methodId === 'bisection' || methodId === 'falsePosition') && !isNaN(aVal) && (
              <ReferenceLine x={aVal} stroke="var(--green)" strokeDasharray="4 3" opacity={0.7} label={{ value: 'a', fill: 'var(--green)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            )}
            {(methodId === 'bisection' || methodId === 'falsePosition') && !isNaN(bVal) && (
              <ReferenceLine x={bVal} stroke="var(--green)" strokeDasharray="4 3" opacity={0.7} label={{ value: 'b', fill: 'var(--green)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            )}
            {(methodId === 'newtonRaphson' || methodId === 'fixedPoint' || methodId === 'secant') && !isNaN(x0Val) && (
              <ReferenceLine x={x0Val} stroke="var(--amber)" strokeDasharray="4 3" opacity={0.7} label={{ value: 'x₀', fill: 'var(--amber)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
            )}

            {/* Root marker */}
            {result?.root != null && isFinite(result.root) && fn && (() => {
              let yRoot
              try { yRoot = fn(result.root) } catch { yRoot = 0 }
              return (
                <ReferenceDot
                  x={parseFloat(result.root.toFixed(7))}
                  y={0}
                  r={6}
                  fill={result.converged ? 'var(--green)' : 'var(--amber)'}
                  stroke="var(--bg-base)"
                  strokeWidth={2}
                />
              )
            })()}
          </LineChart>
        </ResponsiveContainer>
      )}

      <style>{`
        .chart-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .chart-header {
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .chart-title {
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .chart-title code {
          font-family: var(--font-mono);
          color: var(--accent);
          font-size: 0.82rem;
        }
        .root-badge {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          background: var(--green-dim);
          border: 1px solid rgba(0,255,135,0.3);
          color: var(--green);
          border-radius: 99px;
          padding: 0.15rem 0.6rem;
        }
        .chart-empty {
          height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-style: italic;
        }
        .recharts-wrapper { padding: 0.5rem 0.5rem 0; }
      `}</style>
    </div>
  )
}

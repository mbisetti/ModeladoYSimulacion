import React from 'react'
import { getMethod } from '../methods/registry'
import { fmt } from '../utils/mathUtils'

function getResultLabel(method, result) {
  if (!method) return { primary: 'Resultado', value: result?.root }
  if (method.isIntegration) return { primary: 'Integral aproximada ∫f(x)dx', value: result?.root }
  if (method.isODE || result?.isODE) return { primary: 'y(x_final) ≈', value: result?.root }
  if (method.id === 'lagrange') return { primary: 'L(x*) ≈', value: result?.root }
  return { primary: 'Raíz aproximada', value: result?.root }
}

export default function SummaryCard({ result }) {
  if (!result) return null
  const method = getMethod(result.methodId)
  const isConverged = result.converged
  const { primary, value } = getResultLabel(method, result)

  return (
    <div className={`summary-card ${isConverged ? 'converged' : 'diverged'} animate-in`}>
      <div className="summary-status">
        <span className={`status-dot ${isConverged ? 'dot-green' : 'dot-amber'}`} />
        <span className="status-text">{isConverged ? 'Completado' : 'No convergió'}</span>
        {method && (
          <span className="method-tag" style={{ '--c': method.color }}>{method.label}</span>
        )}
      </div>

      <div className="summary-metrics">
        <div className="metric">
          <span className="metric-label">{primary}</span>
          <span className="metric-value accent">
            {value != null ? fmt(value, 8) : '—'}
          </span>
        </div>
        {!result.isIntegration && !result.isODE && result.root != null && (
          <div className="metric">
            <span className="metric-label">Iteraciones</span>
            <span className="metric-value">{result.iterations.length}</span>
          </div>
        )}
        {result.isIntegration && (
          <div className="metric">
            <span className="metric-label">Subintervalos / Muestras</span>
            <span className="metric-value">{result.iterations.length}</span>
          </div>
        )}
        {result.isODE && (
          <div className="metric">
            <span className="metric-label">Pasos</span>
            <span className="metric-value">{result.iterations.length}</span>
          </div>
        )}
        {result.iterations.length > 0 && !result.isODE && !result.isIntegration && (
          <div className="metric">
            <span className="metric-label">Error final</span>
            <span className="metric-value dim">{result.iterations.at(-1)?.error ?? '—'}</span>
          </div>
        )}
        {result.ci95 && (
          <div className="metric">
            <span className="metric-label">IC 95%</span>
            <span className="metric-value dim">
              [{fmt(result.ci95[0], 6)}, {fmt(result.ci95[1], 6)}]
            </span>
          </div>
        )}
      </div>

      {result.message && (
        <div className="summary-message">{result.message}</div>
      )}

      <style>{`
        .summary-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          animation: fadeIn 0.3s ease forwards;
        }
        .summary-card.converged { border-color: rgba(0,255,135,0.2); }
        .summary-card.diverged  { border-color: rgba(255,179,0,0.2); }
        .summary-status {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }
        .status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dot-green { background: var(--green); box-shadow: 0 0 8px var(--green); }
        .dot-amber { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
        .status-text {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .method-tag {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 0.12rem 0.45rem;
          border-radius: 99px;
          border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
          color: var(--c);
          background: color-mix(in srgb, var(--c) 10%, transparent);
          margin-left: auto;
        }
        .summary-metrics {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .metric {
          display: flex;
          flex-direction: column;
          gap: 0.18rem;
        }
        .metric-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          font-weight: 600;
        }
        .metric-value {
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .metric-value.accent { color: var(--accent); font-size: 1.05rem; }
        .metric-value.dim { color: var(--text-secondary); font-size: 0.82rem; }
        .summary-message {
          font-size: 0.74rem;
          color: var(--text-secondary);
          font-style: italic;
          padding-top: 0.25rem;
          border-top: 1px solid var(--border);
          line-height: 1.55;
        }
      `}</style>
    </div>
  )
}

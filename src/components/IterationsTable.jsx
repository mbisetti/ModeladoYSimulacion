import React, { useState } from 'react'
import { getMethod } from '../methods/registry'

function exportCSV(columns, iterations, methodLabel) {
  const headers = columns.map(c => c.label).join(',')
  const rows = iterations.map(row =>
    columns.map(c => `"${row[c.key] ?? ''}"`).join(',')
  )
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${methodLabel}_iteraciones.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function IterationsTable({ result }) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  if (!result || !result.iterations?.length) return null

  const method = getMethod(result.methodId)
  const columns = method?.columns ?? []
  const iterations = result.iterations
  const totalPages = Math.ceil(iterations.length / PAGE_SIZE)
  const pageData = iterations.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="table-card animate-in">
      <div className="table-header">
        <div className="table-title">
          <span className="table-icon">≡</span>
          Tabla de iteraciones
          <span className="iter-count">{iterations.length} iteraciones</span>
        </div>
        <button
          className="export-btn"
          onClick={() => exportCSV(columns, iterations, method?.label ?? 'metodo')}
          title="Exportar CSV"
        >
          ↓ CSV
        </button>
      </div>

      <div className="table-wrap">
        <table className="iter-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={col.isError ? 'th-error' : col.highlight ? 'th-highlight' : ''}>
                  <span dangerouslySetInnerHTML={{ __html: col.label.replace(/_\{?([^}]+)\}?/g, '<sub>$1</sub>').replace(/\{([^}]+)\}/g, '$1') }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => {
              const isLast = page * PAGE_SIZE + i === iterations.length - 1
              return (
                <tr key={row.iter} className={isLast ? 'row-last' : ''}>
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={[
                        col.mono ? 'td-mono' : '',
                        col.highlight ? 'td-highlight' : '',
                        col.isError ? 'td-error' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            ‹ Anterior
          </button>
          <span className="page-info">
            Página {page + 1} de {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page === totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente ›
          </button>
        </div>
      )}

      <style>{`
        .table-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .table-header {
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .table-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .table-icon { color: var(--accent); }
        .iter-count {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 0.1rem 0.5rem;
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0;
        }
        .export-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          padding: 0.3rem 0.6rem;
          border-radius: var(--radius-sm);
          transition: all var(--transition);
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .export-btn:hover {
          border-color: var(--green);
          color: var(--green);
          background: var(--green-dim);
        }
        .table-wrap {
          overflow-x: auto;
          max-height: 420px;
          overflow-y: auto;
        }
        .iter-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }
        .iter-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg-elevated);
        }
        .iter-table th {
          padding: 0.55rem 0.9rem;
          text-align: right;
          color: var(--text-muted);
          font-weight: 600;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        .iter-table th:first-child { text-align: left; }
        .th-highlight { color: var(--accent) !important; }
        .th-error { color: var(--red) !important; }

        .iter-table td {
          padding: 0.5rem 0.9rem;
          text-align: right;
          color: var(--text-secondary);
          border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
          white-space: nowrap;
        }
        .iter-table td:first-child { text-align: left; }
        .iter-table tr:last-child td { border-bottom: none; }
        .iter-table tbody tr:hover td { background: var(--bg-hover); color: var(--text-primary); }

        .td-mono { font-family: var(--font-mono); font-size: 0.76rem; }
        .td-highlight { color: var(--accent) !important; font-weight: 600; }
        .td-error { color: var(--red) !important; }

        .row-last td { background: color-mix(in srgb, var(--green) 5%, transparent) !important; }
        .row-last .td-highlight { color: var(--green) !important; }

        .pagination {
          padding: 0.65rem 1.25rem;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .page-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-family: var(--font-sans);
          font-weight: 600;
          padding: 0.3rem 0.7rem;
          border-radius: var(--radius-sm);
          transition: all var(--transition);
        }
        .page-btn:disabled { opacity: 0.35; cursor: default; }
        .page-btn:not(:disabled):hover { border-color: var(--accent); color: var(--accent); }
        .page-info {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  )
}

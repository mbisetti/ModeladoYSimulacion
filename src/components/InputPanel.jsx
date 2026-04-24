import React, { useState } from 'react'
import { METHOD_LIST, METHOD_CATEGORIES, getMethod } from '../methods/registry'

const INPUT_META = {
  a:         { label: 'Límite inferior a',         placeholder: 'ej: 1' },
  b:         { label: 'Límite superior b',         placeholder: 'ej: 2' },
  x0:        { label: 'Valor inicial x₀',          placeholder: 'ej: 1.5' },
  x1:        { label: 'Segundo valor x₁',          placeholder: 'ej: 2' },
  gExpr:     { label: 'Función de iteración g(x)', placeholder: 'ej: (x+2)^(1/3)', wide: true },
  tol:       { label: 'Tolerancia / Error',         placeholder: 'ej: 0.0001' },
  maxIter:   { label: 'Máx. iteraciones',           placeholder: 'ej: 50' },
  // Interpolation
  xPoints:   { label: 'Nodos x (separados por coma)', placeholder: 'ej: 0,1,2,3', wide: true },
  yPoints:   { label: 'Valores f(x) (coma)',          placeholder: 'ej: 0,1,4,9', wide: true },
  evalPoint: { label: 'Punto de evaluación x*',       placeholder: 'ej: 1.5' },
  // Integration
  n:         { label: 'Subintervalos n',            placeholder: 'ej: 8' },
  nSamples:  { label: 'Muestras N (Monte Carlo)',   placeholder: 'ej: 5000' },
  seed:      { label: 'Semilla aleatoria',          placeholder: 'ej: 42' },
  // ODE
  odeExpr:   { label: 'f(x,y) = dy/dx',            placeholder: 'ej: x + y', wide: true },
  y0:        { label: 'Condición inicial y₀',       placeholder: 'ej: 1' },
  xEnd:      { label: 'x final',                    placeholder: 'ej: 2' },
  h:         { label: 'Paso h',                     placeholder: 'ej: 0.1' },
}

// Category color accents
const CAT_COLORS = {
  'Raíces — Cerrados':           '#00e5ff',
  'Raíces — Abiertos':           '#b388ff',
  'Interpolación':               '#ea80fc',
  'Integración — Newton-Cotes':  '#69f0ae',
  'Integración — Estocástica':   '#ff80ab',
  'EDOs':                        '#81d4fa',
}

export default function InputPanel({
  fnExpr, methodId, params, isRunning,
  onFnChange, onMethodChange, onParamChange,
  onSolve, onReset, onLoadExample,
}) {
  const method = getMethod(methodId)
  const [collapsedCats, setCollapsedCats] = useState({})

  const toggleCat = (cat) => setCollapsedCats(s => ({ ...s, [cat]: !s[cat] }))

  const methodsByCategory = METHOD_CATEGORIES.map(cat => ({
    cat,
    methods: METHOD_LIST.filter(m => m.category === cat),
  }))

  return (
    <div className="input-panel">

      {/* f(x) input — hide for ODE/Interpolation methods */}
      {!method?.hideMainFn && (
        <section className="panel-section">
          <label className="section-label">
            <span className="label-icon">ƒ</span>
            Función f(x)
          </label>
          <input
            type="text"
            value={fnExpr}
            onChange={e => onFnChange(e.target.value)}
            placeholder="ej: x^3 - x - 2"
            spellCheck={false}
            autoComplete="off"
            className="fn-input"
          />
          <p className="input-hint">
            Usa: <code>x^2</code> <code>sin(x)</code> <code>exp(x)</code> <code>log(x)</code> <code>sqrt(x)</code> <code>pi</code>
          </p>
        </section>
      )}

      {/* Method selector */}
      <section className="panel-section">
        <label className="section-label">
          <span className="label-icon">⚙</span>
          Método numérico
        </label>
        <div className="method-grid">
          {methodsByCategory.map(({ cat, methods }) => {
            const catColor = CAT_COLORS[cat] || '#888'
            const collapsed = collapsedCats[cat]
            return (
              <div key={cat} className="method-category">
                <button
                  className="category-header"
                  onClick={() => toggleCat(cat)}
                  style={{ '--cc': catColor }}
                >
                  <span className="cat-dot" />
                  <span className="cat-name">{cat}</span>
                  <span className="cat-toggle">{collapsed ? '▸' : '▾'}</span>
                </button>
                {!collapsed && (
                  <div className="method-buttons">
                    {methods.map(m => (
                      <button
                        key={m.id}
                        onClick={() => onMethodChange(m.id)}
                        className={`method-btn ${methodId === m.id ? 'active' : ''}`}
                        style={{ '--method-color': m.color }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {method && (
          <p className="method-desc">{method.description}</p>
        )}
      </section>

      {/* Dynamic params */}
      {method && (
        <section className="panel-section">
          <label className="section-label">
            <span className="label-icon">⌨</span>
            Parámetros
          </label>
          <div className="params-grid">
            {method.inputs.map(key => {
              const meta = INPUT_META[key] || { label: key, placeholder: '' }
              const isRequired = method.requiredInputs.includes(key)
              return (
                <div key={key} className={`param-field ${meta.wide ? 'wide' : ''}`}>
                  <label className="param-label">
                    {meta.label}
                    {isRequired && <span className="required-dot">*</span>}
                  </label>
                  <input
                    type="text"
                    value={params[key] ?? ''}
                    onChange={e => onParamChange(key, e.target.value)}
                    placeholder={meta.placeholder}
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Examples */}
      {method && method.examples?.length > 0 && (
        <section className="panel-section">
          <label className="section-label">
            <span className="label-icon">◈</span>
            Ejemplos rápidos
          </label>
          <div className="examples-list">
            {method.examples.map((ex, i) => (
              <button
                key={i}
                className="example-btn"
                onClick={() => onLoadExample(ex)}
              >
                <code>{ex.label}</code>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="panel-actions">
        <button className="btn-solve" onClick={onSolve} disabled={isRunning}>
          {isRunning
            ? <><span className="spinner" />Calculando…</>
            : <><span className="btn-icon">▶</span>Resolver</>
          }
        </button>
        <button className="btn-reset" onClick={onReset}>Limpiar</button>
      </section>

      <style>{`
        .input-panel {
          padding: 1.1rem 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .panel-section {
          padding: 0.9rem 0;
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .section-label {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .label-icon { font-size: 0.9rem; color: var(--accent); font-style: normal; }
        .fn-input {
          font-size: 0.95rem !important;
          padding: 0.65rem 0.9rem !important;
          background: var(--bg-elevated) !important;
          border-color: var(--border-active) !important;
        }
        .input-hint { font-size: 0.7rem; color: var(--text-muted); line-height: 1.6; }
        .input-hint code {
          background: var(--bg-hover);
          border-radius: 3px;
          padding: 0.05rem 0.3rem;
          font-family: var(--font-mono);
          color: var(--accent);
          font-size: 0.68rem;
          margin-right: 0.15rem;
        }

        /* Category collapsible headers */
        .method-grid { display: flex; flex-direction: column; gap: 0.35rem; }
        .method-category { display: flex; flex-direction: column; gap: 0.3rem; }
        .category-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: transparent;
          border: none;
          padding: 0.2rem 0;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .cat-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--cc, var(--accent));
          flex-shrink: 0;
        }
        .cat-name {
          font-size: 0.66rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          font-weight: 700;
          flex: 1;
        }
        .cat-toggle { font-size: 0.65rem; color: var(--text-muted); }
        .category-header:hover .cat-name { color: var(--text-primary); }

        .method-buttons { display: flex; flex-wrap: wrap; gap: 0.3rem; padding-left: 0.6rem; }
        .method-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-family: var(--font-sans);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.35rem 0.6rem;
          border-radius: var(--radius-sm);
          transition: all var(--transition);
          white-space: nowrap;
        }
        .method-btn:hover {
          border-color: var(--method-color, var(--accent));
          color: var(--method-color, var(--accent));
          background: color-mix(in srgb, var(--method-color, var(--accent)) 10%, transparent);
        }
        .method-btn.active {
          background: color-mix(in srgb, var(--method-color, var(--accent)) 15%, transparent);
          border-color: var(--method-color, var(--accent));
          color: var(--method-color, var(--accent));
          box-shadow: 0 0 10px color-mix(in srgb, var(--method-color, var(--accent)) 25%, transparent);
        }
        .method-desc {
          font-size: 0.72rem;
          color: var(--text-secondary);
          line-height: 1.55;
          font-style: italic;
          padding-left: 0.1rem;
        }

        .params-grid { display: flex; flex-direction: column; gap: 0.5rem; }
        .param-field { display: flex; flex-direction: column; gap: 0.22rem; }
        .param-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .required-dot { color: var(--accent); font-size: 1rem; line-height: 1; }

        .examples-list { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .example-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0.28rem 0.55rem;
          color: var(--text-secondary);
          font-size: 0.72rem;
          transition: all var(--transition);
        }
        .example-btn:hover {
          border-color: var(--border-active);
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        .example-btn code { font-family: var(--font-mono); font-size: inherit; color: inherit; }

        .panel-actions {
          padding: 1rem 0 0;
          display: flex;
          gap: 0.55rem;
        }
        .btn-solve {
          flex: 1;
          background: var(--accent);
          color: #000;
          font-family: var(--font-sans);
          font-size: 0.88rem;
          font-weight: 800;
          padding: 0.65rem 1rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          letter-spacing: 0.03em;
          transition: all var(--transition);
        }
        .btn-solve:hover:not(:disabled) {
          background: #33ecff;
          box-shadow: var(--shadow-accent);
          transform: translateY(-1px);
        }
        .btn-solve:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-icon { font-size: 0.7rem; }
        .spinner {
          display: inline-block;
          width: 13px; height: 13px;
          border: 2px solid rgba(0,0,0,0.25);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .btn-reset {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.65rem 0.9rem;
          border-radius: var(--radius-md);
        }
        .btn-reset:hover {
          border-color: var(--border-active);
          color: var(--text-primary);
          background: var(--bg-hover);
        }
      `}</style>
    </div>
  )
}

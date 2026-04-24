import React, { useState, useCallback } from 'react'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import ResultsPanel from './components/ResultsPanel'
import ChartRouter from './components/ChartRouter'
import SummaryCard from './components/SummaryCard'
import IterationsTable from './components/IterationsTable'
import { compileFunction } from './utils/mathUtils'
import { getMethod } from './methods/registry'

const DEFAULT_STATE = {
  fnExpr: 'x^3 - x - 2',
  methodId: 'bisection',
  params: {
    a: '1', b: '2',
    x0: '1.5', x1: '2',
    tol: '0.0001', maxIter: '50',
    gExpr: '',
    // Lagrange
    xPoints: '', yPoints: '', evalPoint: '',
    // Integration
    n: '8', nSamples: '5000', seed: '42',
    // ODE
    odeExpr: '', y0: '1', xEnd: '2', h: '0.1',
  },
  result: null,
  error: null,
  isRunning: false,
}

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE)
  const update = useCallback((patch) => setState(s => ({ ...s, ...patch })), [])

  const handleSolve = useCallback(() => {
    const { fnExpr, methodId, params } = state
    update({ isRunning: true, error: null, result: null })

    setTimeout(() => {
      const method = getMethod(methodId)
      if (!method) {
        update({ error: 'Método no encontrado.', isRunning: false }); return
      }

      // Validate required inputs
      for (const req of method.requiredInputs) {
        const val = params[req]
        if (val === undefined || val === null || String(val).trim() === '') {
          update({ error: `El campo "${INPUT_LABEL_MAP[req] || req}" es requerido.`, isRunning: false }); return
        }
      }

      // For methods that use f(x), compile it. ODE/Lagrange/Integration get a passthrough.
      let fn = () => 0, dfn = () => 0
      if (!method.hideMainFn) {
        const compiled = compileFunction(fnExpr)
        if (compiled.error) {
          update({ error: compiled.error, isRunning: false }); return
        }
        fn = compiled.fn
        dfn = compiled.dfn
      } else if (method.isIntegration || method.id === 'monteCarlo' || method.id?.startsWith('newtonCotes')) {
        // Integration methods need f(x) from fnExpr unless hideMainFn
        const compiled = compileFunction(fnExpr)
        if (compiled.error) {
          update({ error: compiled.error, isRunning: false }); return
        }
        fn = compiled.fn
        dfn = compiled.dfn
      }

      // For integration methods that DO show f(x)
      if (method.isIntegration && !method.hideMainFn) {
        const compiled = compileFunction(fnExpr)
        if (compiled.error) {
          update({ error: compiled.error, isRunning: false }); return
        }
        fn = compiled.fn
        dfn = compiled.dfn
      }

      try {
        const result = method.solver(fn, dfn, params)
        update({ result: { ...result, methodId }, isRunning: false })
      } catch (e) {
        update({ error: `Error en la ejecución: ${e.message}`, isRunning: false })
      }
    }, 50)
  }, [state, update])

  const handleReset = useCallback(() => setState(DEFAULT_STATE), [])

  const handleLoadExample = useCallback((ex) => {
    const { label, fn, gExpr, xPoints, yPoints, evalPoint,
            odeExpr, nSamples, seed, ...rest } = ex
    update({
      fnExpr: fn || state.fnExpr,
      params: {
        ...state.params,
        ...rest,
        gExpr:     gExpr     ?? state.params.gExpr,
        xPoints:   xPoints   ?? state.params.xPoints,
        yPoints:   yPoints   ?? state.params.yPoints,
        evalPoint: evalPoint ?? state.params.evalPoint,
        odeExpr:   odeExpr   ?? state.params.odeExpr,
        nSamples:  nSamples  ?? state.params.nSamples,
        seed:      seed      ?? state.params.seed,
      },
      result: null,
      error: null,
    })
  }, [state, update])

  const method = getMethod(state.methodId)
  // All methods are now chartable via ChartRouter
  const showChart = true

  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">
        <div className="grid-left">
          <InputPanel
            fnExpr={state.fnExpr}
            methodId={state.methodId}
            params={state.params}
            isRunning={state.isRunning}
            onFnChange={(v) => update({ fnExpr: v })}
            onMethodChange={(v) => update({ methodId: v, result: null, error: null })}
            onParamChange={(k, v) => update({ params: { ...state.params, [k]: v } })}
            onSolve={handleSolve}
            onReset={handleReset}
            onLoadExample={handleLoadExample}
          />
        </div>
        <div className="grid-right">
          <ChartRouter
            fnExpr={state.fnExpr}
            result={state.result}
            params={state.params}
            methodId={state.methodId}
          />
          {state.error && (
            <div className="error-banner animate-in">
              <span className="error-icon">⚠</span>
              <span>{state.error}</span>
            </div>
          )}
          {state.result && (
            <ResultsPanel result={state.result} methodId={state.methodId} />
          )}
        </div>
      </main>

      <style>{`
        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-base);
        }
        .app-main {
          flex: 1;
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 0;
          max-width: 1700px;
          width: 100%;
          margin: 0 auto;
          padding: 0 0 2rem;
        }
        .grid-left {
          border-right: 1px solid var(--border);
          position: sticky;
          top: 0;
          height: calc(100vh - 60px);
          overflow-y: auto;
          overflow-x: hidden;
        }
        .grid-right {
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
        }
        .error-banner {
          background: var(--red-dim);
          border: 1px solid var(--red);
          color: var(--red);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          font-family: var(--font-mono);
          font-size: 0.83rem;
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          line-height: 1.55;
        }
        .error-icon { font-size: 1rem; flex-shrink: 0; margin-top: 0.05rem; }
        @media (max-width: 900px) {
          .app-main { grid-template-columns: 1fr; }
          .grid-left { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
          .grid-right { padding: 1rem; }
        }
      `}</style>
    </div>
  )
}

const INPUT_LABEL_MAP = {
  a: 'Límite inferior a', b: 'Límite superior b',
  x0: 'Valor inicial x₀', x1: 'Segundo valor x₁',
  gExpr: 'Función g(x)', tol: 'Tolerancia',
  xPoints: 'Nodos x', yPoints: 'Valores f(x)',
  evalPoint: 'Punto de evaluación x*',
  odeExpr: 'f(x,y) = dy/dx', xEnd: 'x final',
}

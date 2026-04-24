import React from 'react'
import FunctionChart    from './FunctionChart'
import ODEChart         from './ODEChart'
import NewtonCotesChart from './NewtonCotesChart'
import MonteCarloChart  from './MonteCarloChart'
import LagrangeChart    from './LagrangeChart'

const ODE_METHODS          = new Set(['euler', 'heun', 'rk4'])
const NEWTON_COTES_METHODS = new Set(['newtonCotes_trapezoid', 'newtonCotes_simpson13', 'newtonCotes_simpson38', 'newtonCotes_midpoint'])

/**
 * ChartRouter
 * Picks the correct chart component based on the active method.
 *
 * Routing rules:
 *  - ODE methods          → ODEChart (y vs x trajectory)
 *  - Newton-Cotes methods → NewtonCotesChart (f(x) + shaded subintervals)
 *  - Monte Carlo          → MonteCarloChart (scatter + convergence)
 *  - Lagrange             → LagrangeChart (nodes + polynomial curve)
 *  - Everything else      → FunctionChart (generic f(x) + root markers)
 */
export default function ChartRouter({ fnExpr, result, params, methodId }) {
  if (ODE_METHODS.has(methodId)) {
    return <ODEChart result={result} params={params} methodId={methodId} />
  }

  if (NEWTON_COTES_METHODS.has(methodId)) {
    return <NewtonCotesChart fnExpr={fnExpr} result={result} params={params} methodId={methodId} />
  }

  if (methodId === 'monteCarlo') {
    return <MonteCarloChart fnExpr={fnExpr} result={result} params={params} />
  }

  if (methodId === 'lagrange') {
    return <LagrangeChart result={result} params={params} />
  }

  // Default: root-finding methods (bisection, falsePosition, newtonRaphson, secant, fixedPoint, aitken)
  return <FunctionChart fnExpr={fnExpr} result={result} params={params} methodId={methodId} />
}

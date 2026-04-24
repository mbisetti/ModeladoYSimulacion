import { fmt } from '../utils/mathUtils'
import { compileFunction } from '../utils/mathUtils'
import * as math from 'mathjs'

/**
 * ODE Solvers — Euler, Heun (Euler Mejorado), Runge-Kutta 4
 * Solves: dy/dx = f(x, y),  y(x0) = y0
 *
 * The `method` param selects the algorithm: 'euler' | 'heun' | 'rk4'
 *
 * Based on: Caceres - Fundamentos de Modelado y Simulación, Cap I p.44-56
 */

function compileFxy(expr) {
  try {
    const compiled = math.compile(expr)
    return { fn: (x, y) => compiled.evaluate({ x, y }), error: null }
  } catch (e) {
    return { fn: null, error: `Expresión inválida: ${e.message}` }
  }
}

export function odeSolver(_fn, _dfn, params) {
  const { odeExpr, x0: x0Str, y0: y0Str, xEnd: xEndStr, h: hStr, odeMethod = 'euler' } = params

  if (!odeExpr || odeExpr.trim() === '') {
    return { root: null, iterations: [], converged: false, message: 'Ingresá f(x,y) = dy/dx.' }
  }

  const { fn: f, error: fErr } = compileFxy(odeExpr)
  if (fErr) return { root: null, iterations: [], converged: false, message: fErr }

  const x0 = parseFloat(x0Str)
  const y0 = parseFloat(y0Str ?? 0)
  const xEnd = parseFloat(xEndStr)
  const h = parseFloat(hStr || 0.1)

  if (isNaN(x0) || isNaN(xEnd)) return { root: null, iterations: [], converged: false, message: 'x₀ y x_final son requeridos.' }
  if (h <= 0) return { root: null, iterations: [], converged: false, message: 'El paso h debe ser positivo.' }
  if (xEnd <= x0) return { root: null, iterations: [], converged: false, message: 'x_final debe ser mayor que x₀.' }

  const maxSteps = Math.min(Math.ceil((xEnd - x0) / h), 500)
  const iterations = []
  let x = x0
  let y = y0

  for (let i = 0; i < maxSteps; i++) {
    let yNext
    let k1, k2, k3, k4
    const extraCols = {}

    if (odeMethod === 'euler') {
      k1 = f(x, y)
      yNext = y + h * k1
      extraCols.slope = fmt(k1)

    } else if (odeMethod === 'heun') {
      k1 = f(x, y)
      const yPred = y + h * k1
      k2 = f(x + h, yPred)
      yNext = y + (h / 2) * (k1 + k2)
      extraCols.k1 = fmt(k1)
      extraCols.k2 = fmt(k2)
      extraCols.yPred = fmt(yPred)

    } else { // rk4
      k1 = f(x, y)
      k2 = f(x + h / 2, y + (h / 2) * k1)
      k3 = f(x + h / 2, y + (h / 2) * k2)
      k4 = f(x + h, y + h * k3)
      yNext = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
      extraCols.k1 = fmt(k1)
      extraCols.k2 = fmt(k2)
      extraCols.k3 = fmt(k3)
      extraCols.k4 = fmt(k4)
    }

    if (!isFinite(yNext)) {
      return { root: y, iterations, converged: false, message: `Divergencia en paso ${i + 1}, x = ${fmt(x)}.` }
    }

    iterations.push({
      iter: i + 1,
      xn: fmt(x),
      yn: fmt(y),
      ...extraCols,
      approx: fmt(yNext),
      error: fmt(Math.abs(yNext - y)),
      _approx: yNext,
      _x: x + h,
    })

    x = parseFloat((x + h).toFixed(12))
    y = yNext
  }

  return {
    root: y,
    iterations,
    converged: true,
    isODE: true,
    message: `y(${fmt(x, 4)}) ≈ ${fmt(y)} en ${iterations.length} pasos (h = ${h}).`,
  }
}

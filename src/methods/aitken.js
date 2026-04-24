import { fmt, absError } from '../utils/mathUtils'
import { compileFunction } from '../utils/mathUtils'

/**
 * Aitken Acceleration Method (Δ² de Aitken)
 * Applies Aitken's formula on top of fixed-point iteration to accelerate convergence.
 * x*_n = x_n - (x_{n+1} - x_n)² / (x_{n+2} - 2*x_{n+1} + x_n)
 *
 * Based on: Caceres - Fundamentos de Modelado y Simulación, Cap I p.13
 */
export function aitken(_fn, _dfn, params) {
  const { gExpr, x0: x0Init, tol = 1e-7, maxIter = 100 } = params

  if (!gExpr || gExpr.trim() === '') {
    return { root: null, iterations: [], converged: false, message: 'Debes ingresar la función de iteración g(x).' }
  }

  const { fn: gFn, error: gError } = compileFunction(gExpr)
  if (gError) {
    return { root: null, iterations: [], converged: false, message: `g(x) inválida: ${gError}` }
  }

  let x = parseFloat(x0Init)
  const tolerance = parseFloat(tol)
  const maxIterations = parseInt(maxIter)
  const iterations = []

  for (let i = 1; i <= maxIterations; i++) {
    let x1, x2
    try {
      x1 = gFn(x)
      x2 = gFn(x1)
    } catch {
      return { root: x, iterations, converged: false, message: `Error evaluando g(x) en iteración ${i}.` }
    }

    if (!isFinite(x1) || !isFinite(x2)) {
      return { root: x, iterations, converged: false, message: `g(x) diverge en iteración ${i}.` }
    }

    const denominador = x2 - 2 * x1 + x
    let xAcelerado
    if (Math.abs(denominador) > 1e-14) {
      xAcelerado = x - Math.pow(x1 - x, 2) / denominador
    } else {
      xAcelerado = x2 // fallback sin aceleración
    }

    const error = absError(xAcelerado, x)

    iterations.push({
      iter: i,
      xn: fmt(x),
      x1: fmt(x1),
      x2: fmt(x2),
      approx: fmt(xAcelerado),
      error: fmt(error),
      _approx: xAcelerado,
      _xn: x,
    })

    if (error < tolerance) {
      return { root: xAcelerado, iterations, converged: true, message: `Convergió con aceleración de Aitken en ${i} iteraciones.` }
    }

    x = xAcelerado
  }

  return {
    root: x,
    iterations,
    converged: false,
    message: `Máximo de iteraciones (${maxIterations}) alcanzado.`,
  }
}

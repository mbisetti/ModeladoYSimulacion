import { fmt, absError } from '../utils/mathUtils'
import { compileFunction } from '../utils/mathUtils'

/**
 * Fixed Point Iteration
 * x_{n+1} = g(x_n)
 */
export function fixedPoint(_fn, _dfn, params) {
  const { x0: x0Init, gExpr, tol = 1e-7, maxIter = 100 } = params

  if (!gExpr || gExpr.trim() === '') {
    return { root: null, iterations: [], converged: false, message: 'Debes ingresar la función de iteración g(x).' }
  }

  const { fn: gFn, error: gError } = compileFunction(gExpr)
  if (gError) {
    return { root: null, iterations: [], converged: false, message: `g(x) inválida: ${gError}` }
  }

  let xn = parseFloat(x0Init)
  const tolerance = parseFloat(tol)
  const maxIterations = parseInt(maxIter)
  const iterations = []

  for (let i = 1; i <= maxIterations; i++) {
    let gxn
    try {
      gxn = gFn(xn)
    } catch {
      return { root: xn, iterations, converged: false, message: `Error evaluando g(${fmt(xn, 4)}).` }
    }

    if (!isFinite(gxn)) {
      return { root: xn, iterations, converged: false, message: `g(x) diverge: g(${fmt(xn, 4)}) = ${gxn}` }
    }

    const error = absError(gxn, xn)

    iterations.push({
      iter: i,
      xn: fmt(xn),
      gxn: fmt(gxn),
      approx: fmt(gxn),
      error: fmt(error),
      _approx: gxn,
      _xn: xn,
    })

    if (error < tolerance) {
      return { root: gxn, iterations, converged: true, message: `Convergió en ${i} iteraciones.` }
    }

    xn = gxn
  }

  return {
    root: xn,
    iterations,
    converged: false,
    message: `Máximo de iteraciones (${maxIterations}) alcanzado. La serie podría estar divergiendo.`,
  }
}

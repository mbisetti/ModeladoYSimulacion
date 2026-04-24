import { fmt, absError } from '../utils/mathUtils'

/**
 * Newton-Raphson Method
 * x_{n+1} = x_n - f(x_n) / f'(x_n)
 */
export function newtonRaphson(fn, dfn, params) {
  const { x0: x0Init, tol = 1e-7, maxIter = 100 } = params

  let xn = parseFloat(x0Init)
  const tolerance = parseFloat(tol)
  const maxIterations = parseInt(maxIter)

  const iterations = []
  let prevXn = null

  for (let i = 1; i <= maxIterations; i++) {
    const fxn = fn(xn)
    const dfxn = dfn(xn)

    if (Math.abs(dfxn) < 1e-14) {
      return {
        root: xn,
        iterations,
        converged: false,
        message: `Derivada ≈ 0 en x = ${fmt(xn, 6)}. El método no puede continuar (posible punto de inflexión o máximo/mínimo).`,
      }
    }

    const xNext = xn - fxn / dfxn
    const error = prevXn === null ? Math.abs(xNext - xn) : absError(xNext, xn)

    iterations.push({
      iter: i,
      xn: fmt(xn),
      fxn: fmt(fxn),
      dfxn: fmt(dfxn),
      approx: fmt(xNext),
      error: fmt(error),
      _approx: xNext,
      _xn: xn,
    })

    if (error < tolerance || Math.abs(fxn) < 1e-14) {
      return { root: xNext, iterations, converged: true, message: `Convergió en ${i} iteraciones.` }
    }

    prevXn = xn
    xn = xNext
  }

  return {
    root: xn,
    iterations,
    converged: false,
    message: `Máximo de iteraciones (${maxIterations}) alcanzado.`,
  }
}

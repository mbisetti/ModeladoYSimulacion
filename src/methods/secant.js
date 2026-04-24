import { fmt, absError } from '../utils/mathUtils'

/**
 * Secant Method
 * x_{n+1} = x_n - f(x_n) * (x_n - x_{n-1}) / (f(x_n) - f(x_{n-1}))
 */
export function secant(fn, _dfn, params) {
  const { x0: x0Init, x1: x1Init, tol = 1e-7, maxIter = 100 } = params

  let x0 = parseFloat(x0Init)
  let x1 = parseFloat(x1Init)
  const tolerance = parseFloat(tol)
  const maxIterations = parseInt(maxIter)

  const iterations = []

  for (let i = 1; i <= maxIterations; i++) {
    const fx0 = fn(x0)
    const fx1 = fn(x1)
    const denom = fx1 - fx0

    if (Math.abs(denom) < 1e-14) {
      return {
        root: x1,
        iterations,
        converged: false,
        message: `f(x_n) - f(x_{n-1}) ≈ 0. El método no puede continuar.`,
      }
    }

    const x2 = x1 - fx1 * (x1 - x0) / denom
    const error = absError(x2, x1)

    iterations.push({
      iter: i,
      x0: fmt(x0),
      x1: fmt(x1),
      fx0: fmt(fx0),
      fx1: fmt(fx1),
      approx: fmt(x2),
      error: fmt(error),
      _approx: x2,
      _x0: x0,
      _x1: x1,
    })

    if (error < tolerance || Math.abs(fx1) < 1e-14) {
      return { root: x2, iterations, converged: true, message: `Convergió en ${i} iteraciones.` }
    }

    x0 = x1
    x1 = x2
  }

  return {
    root: x1,
    iterations,
    converged: false,
    message: `Máximo de iteraciones (${maxIterations}) alcanzado.`,
  }
}

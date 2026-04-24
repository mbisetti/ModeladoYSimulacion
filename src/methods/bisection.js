import { fmt, absError } from '../utils/mathUtils'

/**
 * Bisection Method
 * Finds root in [a, b] where f(a)*f(b) < 0.
 */
export function bisection(fn, _dfn, params) {
  const { a: aInit, b: bInit, tol = 1e-7, maxIter = 100 } = params

  let a = parseFloat(aInit)
  let b = parseFloat(bInit)
  const tolerance = parseFloat(tol)
  const maxIterations = parseInt(maxIter)

  const iterations = []

  // Validate bracket
  const fa0 = fn(a)
  const fb0 = fn(b)

  if (fa0 * fb0 > 0) {
    return {
      root: null,
      iterations: [],
      converged: false,
      message: `f(${fmt(a, 4)}) = ${fmt(fa0, 4)} y f(${fmt(b, 4)}) = ${fmt(fb0, 4)} tienen el mismo signo. No se puede garantizar una raíz en el intervalo.`,
    }
  }

  let xm = a
  let prevXm = null

  for (let i = 1; i <= maxIterations; i++) {
    xm = (a + b) / 2
    const fa = fn(a)
    const fb = fn(b)
    const fm = fn(xm)
    const error = prevXm === null ? Math.abs(b - a) / 2 : absError(xm, prevXm)

    iterations.push({
      iter: i,
      a: fmt(a),
      b: fmt(b),
      approx: fmt(xm),
      fa: fmt(fa),
      fb: fmt(fb),
      fm: fmt(fm),
      error: fmt(error),
      _a: a,
      _b: b,
      _approx: xm,
    })

    if (error < tolerance || Math.abs(fm) < 1e-14) {
      return { root: xm, iterations, converged: true, message: `Convergió en ${i} iteraciones. |f(raíz)| = ${fmt(Math.abs(fm), 4)}` }
    }

    if (fa * fm < 0) {
      b = xm
    } else {
      a = xm
    }

    prevXm = xm
  }

  return {
    root: xm,
    iterations,
    converged: false,
    message: `Máximo de iteraciones alcanzado (${maxIterations}). Última aproximación: ${fmt(xm)}`,
  }
}

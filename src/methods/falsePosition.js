import { fmt, absError } from '../utils/mathUtils'

/**
 * False Position (Regula Falsi) Method
 */
export function falsePosition(fn, _dfn, params) {
  const { a: aInit, b: bInit, tol = 1e-7, maxIter = 100 } = params

  let a = parseFloat(aInit)
  let b = parseFloat(bInit)
  const tolerance = parseFloat(tol)
  const maxIterations = parseInt(maxIter)

  const fa0 = fn(a)
  const fb0 = fn(b)

  if (fa0 * fb0 > 0) {
    return {
      root: null,
      iterations: [],
      converged: false,
      message: `f(a) y f(b) tienen el mismo signo. El intervalo no garantiza una raíz.`,
    }
  }

  const iterations = []
  let xr = a
  let prevXr = null

  for (let i = 1; i <= maxIterations; i++) {
    const fa = fn(a)
    const fb = fn(b)

    // Prevent division by zero
    if (Math.abs(fb - fa) < 1e-14) {
      return { root: xr, iterations, converged: false, message: 'f(b) - f(a) ≈ 0, el método no puede continuar.' }
    }

    xr = b - (fb * (a - b)) / (fa - fb)
    const fr = fn(xr)
    const error = prevXr === null ? Math.abs(b - a) : absError(xr, prevXr)

    iterations.push({
      iter: i,
      a: fmt(a),
      b: fmt(b),
      approx: fmt(xr),
      fa: fmt(fa),
      fb: fmt(fb),
      fr: fmt(fr),
      error: fmt(error),
      _a: a,
      _b: b,
      _approx: xr,
    })

    if (error < tolerance || Math.abs(fr) < 1e-14) {
      return { root: xr, iterations, converged: true, message: `Convergió en ${i} iteraciones.` }
    }

    if (fa * fr < 0) {
      b = xr
    } else {
      a = xr
    }

    prevXr = xr
  }

  return {
    root: xr,
    iterations,
    converged: false,
    message: `Máximo de iteraciones (${maxIterations}) alcanzado.`,
  }
}

import * as math from 'mathjs'

/**
 * Compile a math expression string into an evaluatable function.
 * Returns { fn, dfn, error } where dfn is the numerical derivative.
 */
export function compileFunction(expr) {
  try {
    const compiled = math.compile(expr)
    const fn = (x) => compiled.evaluate({ x })
    // Numerical derivative using central difference
    const dfn = (x, h = 1e-7) => (fn(x + h) - fn(x - h)) / (2 * h)
    return { fn, dfn, error: null }
  } catch (e) {
    return { fn: null, dfn: null, error: `Expresión inválida: ${e.message}` }
  }
}

/**
 * Generate points for plotting f(x) over [xMin, xMax].
 */
export function generatePlotPoints(fn, xMin, xMax, nPoints = 300) {
  const points = []
  const step = (xMax - xMin) / (nPoints - 1)
  for (let i = 0; i < nPoints; i++) {
    const x = xMin + i * step
    try {
      const y = fn(x)
      if (isFinite(y) && !isNaN(y) && Math.abs(y) < 1e10) {
        points.push({ x: parseFloat(x.toFixed(6)), y: parseFloat(y.toFixed(6)) })
      } else {
        points.push({ x: parseFloat(x.toFixed(6)), y: null })
      }
    } catch {
      points.push({ x: parseFloat(x.toFixed(6)), y: null })
    }
  }
  return points
}

/**
 * Format a number to a readable string with fixed decimals.
 */
export function fmt(val, decimals = 8) {
  if (val === null || val === undefined || isNaN(val)) return '—'
  if (!isFinite(val)) return val > 0 ? '+∞' : '−∞'
  return parseFloat(val.toFixed(decimals)).toString()
}

/**
 * Absolute error between consecutive approximations.
 */
export function absError(current, previous) {
  return Math.abs(current - previous)
}

/**
 * Relative error.
 */
export function relError(current, previous) {
  if (Math.abs(current) < 1e-14) return Math.abs(previous)
  return Math.abs((current - previous) / current)
}

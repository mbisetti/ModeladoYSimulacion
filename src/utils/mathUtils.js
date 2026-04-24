import * as math from 'mathjs'

// Normalize common pi/e variants before compiling
function preprocessExpr(expr) {
  return expr
    .replace(/π/g, 'pi')
    .replace(/\bPI\b/g, 'pi')
    .replace(/\bPi\b/g, 'pi')
}

/**
 * Compile a math expression string into an evaluatable function.
 * Returns { fn, dfn, error } where dfn is the numerical derivative.
 */
export function compileFunction(expr) {
  try {
    const compiled = math.compile(preprocessExpr(expr))
    const fn = (x) => compiled.evaluate({ x })
    // Numerical derivative using central difference
    const dfn = (x, h = 1e-7) => (fn(x + h) - fn(x - h)) / (2 * h)
    return { fn, dfn, error: null }
  } catch (e) {
    return { fn: null, dfn: null, error: `Expresión inválida: ${e.message}` }
  }
}

/**
 * Evaluate fn(x) safely, resolving removable singularities (0/0, ∞/∞) via
 * numerical limit — the discrete analogue of L'Hôpital's rule.
 * Returns the two-sided limit when fn(x) is NaN or ±Infinity.
 */
export function safeEval(fn, x) {
  try {
    const y = fn(x)
    if (isFinite(y) && !isNaN(y)) return y

    // Approach from both sides and average (L'Hôpital numerically)
    const eps = 1e-8
    let yL, yR, lOk = false, rOk = false
    try { yL = fn(x - eps); lOk = isFinite(yL) && !isNaN(yL) } catch {}
    try { yR = fn(x + eps); rOk = isFinite(yR) && !isNaN(yR) } catch {}

    if (lOk && rOk) return (yL + yR) / 2
    if (lOk) return yL
    if (rOk) return yR
    return 0 // non-integrable singularity; contributes 0 to the sum
  } catch {
    return 0
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

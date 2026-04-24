import { fmt, safeEval } from '../utils/mathUtils'

// Numerically estimate max|f^(order)(x)| over [a,b] by sampling
function estimateMaxDeriv(fn, a, b, order, samples = 30) {
  const range = b - a
  // delta for finite-difference stencil: larger for higher orders to reduce cancellation
  const delta = range * (order === 2 ? 5e-4 : 1.5e-2)
  const pad = delta * (order + 1)
  let maxD = 0
  for (let i = 0; i <= samples; i++) {
    const x = a + pad + (i / samples) * Math.max(0, range - 2 * pad)
    try {
      let d
      if (order === 2) {
        d = (fn(x + delta) - 2 * fn(x) + fn(x - delta)) / (delta * delta)
      } else {
        // 4th-order central difference
        d = (fn(x + 2 * delta) - 4 * fn(x + delta) + 6 * fn(x)
           - 4 * fn(x - delta) + fn(x - 2 * delta)) / (delta ** 4)
      }
      if (isFinite(d) && !isNaN(d)) maxD = Math.max(maxD, Math.abs(d))
    } catch {}
  }
  return maxD
}

// Composite truncation error bound and display formula per rule
function truncationError(fn, a, b, h, rule) {
  const ba = b - a
  if (rule === 'midpoint') {
    const M2 = estimateMaxDeriv(fn, a, b, 2)
    return {
      bound: (ba * h * h / 24) * M2,
      formula: '|E_T| ≤ (b−a)·h²/24 · max|f\'\'(ξ)|',
      derivOrder: 2,
      maxDeriv: M2,
    }
  }
  if (rule === 'trapezoid') {
    const M2 = estimateMaxDeriv(fn, a, b, 2)
    return {
      bound: (ba * h * h / 12) * M2,
      formula: '|E_T| ≤ (b−a)·h²/12 · max|f\'\'(ξ)|',
      derivOrder: 2,
      maxDeriv: M2,
    }
  }
  if (rule === 'simpson13') {
    const M4 = estimateMaxDeriv(fn, a, b, 4)
    return {
      bound: (ba * h ** 4 / 180) * M4,
      formula: '|E_T| ≤ (b−a)·h⁴/180 · max|f⁴(ξ)|',
      derivOrder: 4,
      maxDeriv: M4,
    }
  }
  if (rule === 'simpson38') {
    const M4 = estimateMaxDeriv(fn, a, b, 4)
    return {
      bound: (ba * h ** 4 / 80) * M4,
      formula: '|E_T| ≤ (b−a)·h⁴/80 · max|f⁴(ξ)|',
      derivOrder: 4,
      maxDeriv: M4,
    }
  }
  return null
}

/**
 * Newton-Cotes Integration Rules
 * All rules share the same runner, selected by `rule` param.
 *
 * Rules: 'trapezoid' | 'simpson13' | 'simpson38' | 'midpoint'
 *
 * Based on: Caceres - Fundamentos de Modelado y Simulación, Cap I p.24-35
 */
export function newtonCotes(_fn, _dfn, params) {
  const { a: aStr, b: bStr, n: nStr, rule = 'trapezoid' } = params

  const a = parseFloat(aStr)
  const b = parseFloat(bStr)
  let n = parseInt(nStr) || 4

  if (isNaN(a) || isNaN(b)) return { root: null, iterations: [], converged: false, message: 'Los límites a y b son requeridos.' }
  if (a >= b) return { root: null, iterations: [], converged: false, message: 'Se requiere a < b.' }
  if (n < 1) n = 1

  // Enforce parity constraints
  if (rule === 'simpson13' && n % 2 !== 0) {
    n += 1 // Simpson 1/3 requires even n
  }
  if (rule === 'simpson38' && n % 3 !== 0) {
    n = Math.ceil(n / 3) * 3 // Simpson 3/8 requires n multiple of 3
  }

  const h = (b - a) / n
  const iterations = []
  let integral = 0

  if (rule === 'midpoint') {
    // ∫f(x)dx ≈ h * Σ f((x_{i-1}+x_i)/2)
    for (let i = 1; i <= n; i++) {
      const xMid = a + (i - 0.5) * h
      const fMid = safeEval(_fn, xMid)
      const contrib = h * fMid
      integral += contrib
      iterations.push({
        iter: i,
        xi: fmt(xMid),
        fi: fmt(fMid),
        approx: fmt(integral),
        error: fmt(Math.abs(contrib)),
        _approx: integral,
      })
    }

  } else if (rule === 'trapezoid') {
    // ∫f(x)dx ≈ h/2 * (f(a) + 2Σf(x_i) + f(b))
    const xs = Array.from({ length: n + 1 }, (_, i) => a + i * h)
    const fs = xs.map(x => safeEval(_fn, x))

    for (let i = 0; i < n; i++) {
      const contrib = (h / 2) * (fs[i] + fs[i + 1])
      integral += contrib
      iterations.push({
        iter: i + 1,
        xi: fmt(xs[i]),
        fi: fmt(fs[i]),
        xiNext: fmt(xs[i + 1]),
        fiNext: fmt(fs[i + 1]),
        approx: fmt(integral),
        error: fmt(Math.abs(contrib)),
        _approx: integral,
      })
    }

  } else if (rule === 'simpson13') {
    // ∫f(x)dx ≈ h/3 * (f(x_0) + 4f(x_1) + 2f(x_2) + 4f(x_3) + ... + f(x_n))
    const xs = Array.from({ length: n + 1 }, (_, i) => a + i * h)
    const fs = xs.map(x => safeEval(_fn, x))
    let groupIntegral = 0

    for (let i = 0; i < n; i += 2) {
      const contrib = (h / 3) * (fs[i] + 4 * fs[i + 1] + fs[i + 2])
      groupIntegral += contrib
      integral = groupIntegral
      iterations.push({
        iter: Math.floor(i / 2) + 1,
        xi: fmt(xs[i]),
        xMid: fmt(xs[i + 1]),
        xiNext: fmt(xs[i + 2]),
        fi: fmt(fs[i]),
        fMid: fmt(fs[i + 1]),
        fiNext: fmt(fs[i + 2]),
        approx: fmt(integral),
        error: fmt(Math.abs(contrib)),
        _approx: integral,
      })
    }

  } else if (rule === 'simpson38') {
    // ∫f(x)dx ≈ 3h/8 * (f(x_0) + 3f(x_1) + 3f(x_2) + 2f(x_3) + ... + f(x_n))
    const xs = Array.from({ length: n + 1 }, (_, i) => a + i * h)
    const fs = xs.map(x => safeEval(_fn, x))
    let groupIntegral = 0

    for (let i = 0; i < n; i += 3) {
      const contrib = (3 * h / 8) * (fs[i] + 3 * fs[i + 1] + 3 * fs[i + 2] + fs[i + 3])
      groupIntegral += contrib
      integral = groupIntegral
      iterations.push({
        iter: Math.floor(i / 3) + 1,
        xi: fmt(xs[i]),
        x1: fmt(xs[i + 1]),
        x2: fmt(xs[i + 2]),
        xiNext: fmt(xs[i + 3]),
        fi: fmt(fs[i]),
        f1: fmt(fs[i + 1]),
        f2: fmt(fs[i + 2]),
        fiNext: fmt(fs[i + 3]),
        approx: fmt(integral),
        error: fmt(Math.abs(contrib)),
        _approx: integral,
      })
    }
  }

  const trunc = truncationError(_fn, a, b, h, rule)

  return {
    root: integral,
    iterations,
    converged: true,
    isIntegration: true,
    message: `∫f(x)dx ≈ ${fmt(integral)} usando ${n} subintervalos (h = ${fmt(h, 6)}).`,
    nAdjusted: n,
    truncBound: trunc?.bound,
    truncFormula: trunc?.formula,
    truncDerivOrder: trunc?.derivOrder,
    truncMaxDeriv: trunc?.maxDeriv,
  }
}

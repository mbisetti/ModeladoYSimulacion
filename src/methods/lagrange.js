import { fmt } from '../utils/mathUtils'

// Multiply polynomial (ascending coeffs) by (x - root)
function polyMul(p, root) {
  const r = new Array(p.length + 1).fill(0)
  for (let i = 0; i < p.length; i++) {
    r[i] -= root * p[i]
    r[i + 1] += p[i]
  }
  return r
}

// Build expanded coefficient array for basis polynomial L_i (ascending order)
function basisCoeffs(xs, i) {
  let p = [1]
  let scalar = 1
  for (let j = 0; j < xs.length; j++) {
    if (j !== i) {
      p = polyMul(p, xs[j])
      scalar *= xs[i] - xs[j]
    }
  }
  return p.map(c => c / scalar)
}

// Format polynomial coefficients (ascending order) as a readable string
function formatPolynomial(coeffs) {
  const n = coeffs.length - 1
  const terms = []
  for (let deg = n; deg >= 0; deg--) {
    const c = coeffs[deg]
    if (Math.abs(c) < 1e-10) continue
    const absC = Math.abs(c)
    const isFirst = terms.length === 0
    const sign = isFirst ? (c < 0 ? '-' : '') : (c < 0 ? ' - ' : ' + ')
    const cRounded = parseFloat(absC.toFixed(6))
    const showC = deg === 0 || Math.abs(absC - 1) > 1e-10
    const varPart = deg === 0 ? '' : deg === 1 ? 'x' : `x^${deg}`
    terms.push(`${sign}${showC ? cRounded : ''}${varPart}`)
  }
  return terms.length ? terms.join('') : '0'
}

/**
 * Lagrange Interpolating Polynomial
 * Given a set of (x_i, f(x_i)) points, builds the interpolating polynomial
 * and evaluates it at a query point x*.
 *
 * L(x) = Σ_i f(x_i) * Π_{j≠i} (x - x_j) / (x_i - x_j)
 *
 * Based on: Caceres - Fundamentos de Modelado y Simulación, Cap I p.15
 */
export function lagrange(_fn, _dfn, params) {
  const { xPoints, yPoints, evalPoint } = params

  // Parse comma-separated x and y points
  const xs = String(xPoints).split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v))
  const ys = String(yPoints).split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v))

  if (xs.length < 2) return { root: null, iterations: [], converged: false, message: 'Se necesitan al menos 2 puntos x.' }
  if (ys.length < 2) return { root: null, iterations: [], converged: false, message: 'Se necesitan al menos 2 puntos f(x).' }
  if (xs.length !== ys.length) return { root: null, iterations: [], converged: false, message: `Cantidad de puntos x (${xs.length}) y f(x) (${ys.length}) no coincide.` }

  // Check for duplicate x values
  const uniqueX = new Set(xs)
  if (uniqueX.size !== xs.length) return { root: null, iterations: [], converged: false, message: 'Los valores de x deben ser distintos (sin repetidos).' }

  const xEval = parseFloat(evalPoint)
  if (isNaN(xEval)) return { root: null, iterations: [], converged: false, message: 'El punto de evaluación x* es inválido.' }

  const n = xs.length
  const iterations = []
  let Lx = 0

  for (let i = 0; i < n; i++) {
    // Compute basis polynomial L_i(xEval)
    let Li = 1
    const factors = []
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const num = xEval - xs[j]
        const den = xs[i] - xs[j]
        Li *= num / den
        factors.push(`(x-${fmt(xs[j], 4)})/(${fmt(xs[i], 4)}-${fmt(xs[j], 4)})`)
      }
    }
    const contribution = ys[i] * Li
    Lx += contribution

    iterations.push({
      iter: i,
      xi: fmt(xs[i]),
      fi: fmt(ys[i]),
      Li: fmt(Li),
      approx: fmt(Lx),  // running sum
      error: fmt(Math.abs(contribution)),
      _approx: Lx,
    })
  }

  // Build full polynomial by summing y_i * L_i coefficients
  const totalCoeffs = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    const bc = basisCoeffs(xs, i)
    for (let k = 0; k < bc.length; k++) {
      totalCoeffs[k] += ys[i] * bc[k]
    }
  }
  const polynomial = formatPolynomial(totalCoeffs)

  return {
    root: Lx,
    iterations,
    converged: true,
    message: `L(${fmt(xEval, 4)}) ≈ ${fmt(Lx)} usando ${n} nodos de interpolación.`,
    isInterpolation: true,
    evalPoint: xEval,
    xs,
    ys,
    polynomial,
    polynomialCoeffs: totalCoeffs,
  }
}

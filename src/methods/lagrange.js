import { fmt } from '../utils/mathUtils'

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

  return {
    root: Lx,
    iterations,
    converged: true,
    message: `L(${fmt(xEval, 4)}) ≈ ${fmt(Lx)} usando ${n} nodos de interpolación.`,
    isInterpolation: true,
    evalPoint: xEval,
    xs,
    ys,
  }
}

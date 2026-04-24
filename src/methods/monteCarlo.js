import { fmt } from '../utils/mathUtils'

/**
 * Monte Carlo Integration
 * Estimates ∫_a^b f(x)dx using random sampling.
 *
 * I ≈ (b-a) * (1/N) * Σ f(x_i),   x_i ~ Uniform(a, b)
 * Also includes 95% confidence interval.
 *
 * Based on: Caceres - Fundamentos de Modelado y Simulación, Cap I p.36-43
 */
export function monteCarlo(_fn, _dfn, params) {
  const { a: aStr, b: bStr, nSamples: nStr, seed: seedStr } = params

  const a = parseFloat(aStr)
  const b = parseFloat(bStr)
  const N = Math.min(parseInt(nStr) || 1000, 100000) // cap at 100k for performance

  if (isNaN(a) || isNaN(b)) return { root: null, iterations: [], converged: false, message: 'Los límites a y b son requeridos.' }
  if (a >= b) return { root: null, iterations: [], converged: false, message: 'Se requiere a < b.' }

  // Simple seeded LCG RNG for reproducibility
  let rngState = (parseInt(seedStr) || 42) >>> 0
  const rand = () => {
    rngState = (Math.imul(1664525, rngState) + 1013904223) >>> 0
    return rngState / 4294967296
  }

  const iterations = []
  const SNAPSHOT_COUNT = 20 // only store 20 snapshots in table (not all N)
  const snapshotEvery = Math.max(1, Math.floor(N / SNAPSHOT_COUNT))

  let sum = 0
  let sumSq = 0
  let estimate = 0

  for (let i = 1; i <= N; i++) {
    const xi = a + rand() * (b - a)
    let fxi
    try { fxi = _fn(xi) } catch { fxi = 0 }
    if (!isFinite(fxi)) fxi = 0

    sum += fxi
    sumSq += fxi * fxi
    estimate = (b - a) * sum / i

    if (i % snapshotEvery === 0 || i === N) {
      const mean = sum / i
      const variance = i > 1 ? (sumSq / i - mean * mean) : 0
      const stdErr = Math.sqrt(Math.max(variance, 0) / i)
      const ci95Half = 1.96 * (b - a) * stdErr

      iterations.push({
        iter: i,
        xi: fmt(xi),
        fi: fmt(fxi),
        approx: fmt(estimate),
        ci95: `±${fmt(ci95Half, 6)}`,
        error: fmt(ci95Half),
        _approx: estimate,
      })
    }
  }

  // Final stats
  const mean = sum / N
  const variance = N > 1 ? (sumSq / N - mean * mean) : 0
  const stdErr = Math.sqrt(Math.max(variance, 0) / N)
  const ci95Half = 1.96 * (b - a) * stdErr

  return {
    root: estimate,
    iterations,
    converged: true,
    isIntegration: true,
    message: `I ≈ ${fmt(estimate)} | IC 95%: [${fmt(estimate - ci95Half, 6)}, ${fmt(estimate + ci95Half, 6)}] | N = ${N} muestras`,
    ci95: [estimate - ci95Half, estimate + ci95Half],
  }
}

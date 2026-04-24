import { bisection }    from './bisection'
import { falsePosition } from './falsePosition'
import { newtonRaphson } from './newtonRaphson'
import { secant }        from './secant'
import { fixedPoint }    from './fixedPoint'
import { aitken }        from './aitken'
import { lagrange }      from './lagrange'
import { newtonCotes }   from './newtonCotes'
import { monteCarlo }    from './monteCarlo'
import { odeSolver }     from './odeSolver'

/**
 * METHOD REGISTRY — Strategy Pattern
 * ====================================
 * To add a new method:
 *  1. Create src/methods/myMethod.js exporting a solver function.
 *  2. Import it here and add an entry to METHODS.
 *
 * Solver signature: (fn, dfn, params) => { root, iterations[], converged, message }
 */

export const METHODS = {

  // ─── CLASE 1 & 2: Búsqueda de raíces ────────────────────────────────────

  bisection: {
    id: 'bisection',
    label: 'Bisección',
    description: 'Divide el intervalo [a,b] a la mitad en cada paso. Convergencia garantizada si f(a)·f(b)<0.',
    category: 'Raíces — Cerrados',
    color: '#00e5ff',
    inputs: ['a', 'b', 'tol', 'maxIter'],
    requiredInputs: ['a', 'b'],
    columns: [
      { key: 'iter',  label: 'n',      mono: true },
      { key: 'a',     label: 'a',      mono: true },
      { key: 'b',     label: 'b',      mono: true },
      { key: 'approx',label: 'x_m',    mono: true, highlight: true },
      { key: 'fa',    label: 'f(a)',   mono: true },
      { key: 'fb',    label: 'f(b)',   mono: true },
      { key: 'fm',    label: 'f(x_m)',  mono: true },
      { key: 'error', label: 'Error',  mono: true, isError: true },
    ],
    solver: bisection,
    examples: [
      { label: 'x^3 - x - 2', fn: 'x^3 - x - 2', a: 1, b: 2 },
      { label: 'cos(x) - x', fn: 'cos(x) - x',  a: 0, b: 1 },
      { label: 'e^x - 3x',   fn: 'exp(x) - 3*x', a: 1, b: 2 },
    ],
  },

  falsePosition: {
    id: 'falsePosition',
    label: 'Regla Falsa',
    description: 'Variante de bisección que usa interpolación lineal (regula falsi) para estimar la raíz.',
    category: 'Raíces — Cerrados',
    color: '#00ff87',
    inputs: ['a', 'b', 'tol', 'maxIter'],
    requiredInputs: ['a', 'b'],
    columns: [
      { key: 'iter',  label: 'n',      mono: true },
      { key: 'a',     label: 'a',      mono: true },
      { key: 'b',     label: 'b',      mono: true },
      { key: 'approx',label: 'x_r',    mono: true, highlight: true },
      { key: 'fa',    label: 'f(a)',   mono: true },
      { key: 'fb',    label: 'f(b)',   mono: true },
      { key: 'fr',    label: 'f(x_r)', mono: true },
      { key: 'error', label: 'Error',  mono: true, isError: true },
    ],
    solver: falsePosition,
    examples: [
      { label: 'x^3 - x - 2',   fn: 'x^3 - x - 2',  a: 1, b: 2 },
      { label: 'sin(x) - x/2',  fn: 'sin(x) - x/2', a: 1, b: 2 },
    ],
  },

  newtonRaphson: {
    id: 'newtonRaphson',
    label: 'Newton-Raphson',
    description: "Usa la derivada f'(x) para convergencia cuadrática. Requiere f diferenciable y buen x0.",
    category: 'Raíces — Abiertos',
    color: '#b388ff',
    inputs: ['x0', 'tol', 'maxIter'],
    requiredInputs: ['x0'],
    columns: [
      { key: 'iter',  label: 'n',        mono: true },
      { key: 'xn',    label: 'x_n',      mono: true },
      { key: 'fxn',   label: 'f(x_n)',   mono: true },
      { key: 'dfxn',  label: "f'(x_n)",  mono: true },
      { key: 'approx',label: 'x_{n+1}',  mono: true, highlight: true },
      { key: 'error', label: 'Error',    mono: true, isError: true },
    ],
    solver: newtonRaphson,
    examples: [
      { label: 'x^3 - x - 2', fn: 'x^3 - x - 2', x0: 1.5 },
      { label: 'cos(x) - x',  fn: 'cos(x) - x',   x0: 1   },
      { label: 'x^2 - 2',     fn: 'x^2 - 2',      x0: 1   },
    ],
  },

  secant: {
    id: 'secant',
    label: 'Secante',
    description: "Aproxima f'(x) usando dos puntos. No requiere derivada analítica.",
    category: 'Raíces — Abiertos',
    color: '#ffb300',
    inputs: ['x0', 'x1', 'tol', 'maxIter'],
    requiredInputs: ['x0', 'x1'],
    columns: [
      { key: 'iter',  label: 'n',           mono: true },
      { key: 'x0',    label: 'x_{n-1}',     mono: true },
      { key: 'x1',    label: 'x_n',         mono: true },
      { key: 'fx0',   label: 'f(x_{n-1})',  mono: true },
      { key: 'fx1',   label: 'f(x_n)',      mono: true },
      { key: 'approx',label: 'x_{n+1}',     mono: true, highlight: true },
      { key: 'error', label: 'Error',       mono: true, isError: true },
    ],
    solver: secant,
    examples: [
      { label: 'x^3 - x - 2', fn: 'x^3 - x - 2', x0: 1,   x1: 2   },
      { label: 'e^x - 3x',    fn: 'exp(x) - 3*x', x0: 0.5, x1: 1.5 },
    ],
  },

  fixedPoint: {
    id: 'fixedPoint',
    label: 'Punto Fijo',
    description: 'Itera x = g(x) hasta convergencia. Requiere ingresar g(x) tal que la raíz de f sea el punto fijo.',
    category: 'Raíces — Abiertos',
    color: '#ff4d6d',
    inputs: ['gExpr', 'x0', 'tol', 'maxIter'],
    requiredInputs: ['gExpr', 'x0'],
    columns: [
      { key: 'iter',  label: 'n',       mono: true },
      { key: 'xn',    label: 'x_n',     mono: true },
      { key: 'gxn',   label: 'g(x_n)',  mono: true },
      { key: 'approx',label: 'x_{n+1}', mono: true, highlight: true },
      { key: 'error', label: 'Error',   mono: true, isError: true },
    ],
    solver: fixedPoint,
    examples: [
      { label: 'x^3-x-2 -> (x+2)^(1/3)', fn: 'x^3 - x - 2', gExpr: '(x+2)^(1/3)', x0: 1.5 },
      { label: 'cos(x)-x -> cos(x)',       fn: 'cos(x) - x',  gExpr: 'cos(x)',       x0: 0.5 },
    ],
  },

  aitken: {
    id: 'aitken',
    label: 'Aitken Delta2',
    description: 'Acelera la convergencia del punto fijo con la formula Delta2: x* = x - (Dx)2 / D2x.',
    category: 'Raíces — Abiertos',
    color: '#40c4ff',
    inputs: ['gExpr', 'x0', 'tol', 'maxIter'],
    requiredInputs: ['gExpr', 'x0'],
    columns: [
      { key: 'iter',  label: 'n',           mono: true },
      { key: 'xn',    label: 'x_n',         mono: true },
      { key: 'x1',    label: 'g(x_n)',      mono: true },
      { key: 'x2',    label: 'g(g(x_n))',   mono: true },
      { key: 'approx',label: 'x* (Aitken)', mono: true, highlight: true },
      { key: 'error', label: 'Error',       mono: true, isError: true },
    ],
    solver: aitken,
    examples: [
      { label: 'x^3-x-2 -> (x+2)^(1/3)',   fn: 'x^3 - x - 2',      gExpr: '(x+2)^(1/3)',    x0: 1.5 },
      { label: 'cos(x)-x -> cos(x)',         fn: 'cos(x) - x',        gExpr: 'cos(x)',          x0: 0.5 },
      { label: 'g(x) = (2x-1)^(1/2)',       fn: 'x^2 - x/2 - 1/2',  gExpr: '(2*x-1)^(1/2)',  x0: 2   },
    ],
  },

  // ─── CLASE 3: Interpolación de Lagrange ─────────────────────────────────

  lagrange: {
    id: 'lagrange',
    label: 'Lagrange',
    description: 'Construye el polinomio interpolante L(x) a partir de nodos (x_i, f(x_i)) y evalua en x*.',
    category: 'Interpolación',
    color: '#ea80fc',
    inputs: ['xPoints', 'yPoints', 'evalPoint'],
    requiredInputs: ['xPoints', 'yPoints', 'evalPoint'],
    hideMainFn: true,
    columns: [
      { key: 'iter',  label: 'i',            mono: true },
      { key: 'xi',    label: 'x_i',          mono: true },
      { key: 'fi',    label: 'f(x_i)',       mono: true },
      { key: 'Li',    label: 'L_i(x*)',      mono: true },
      { key: 'approx',label: 'Suma parcial', mono: true, highlight: true },
      { key: 'error', label: '|contrib|',    mono: true, isError: true },
    ],
    solver: lagrange,
    examples: [
      { label: 'Nodos cuadraticos',  fn: 'x^2',    xPoints: '0,1,2',     yPoints: '0,1,4',            evalPoint: '1.5' },
      { label: 'sin(x) 3 nodos',     fn: 'sin(x)', xPoints: '0,1,2',     yPoints: '0,0.8415,0.9093',  evalPoint: '0.5' },
      { label: '4 nodos cubicos',    fn: 'x^3',    xPoints: '0,1,2,3',   yPoints: '0,1,8,27',         evalPoint: '2.5' },
    ],
  },

  // ─── CLASE 4: Newton-Cotes ───────────────────────────────────────────────

  newtonCotes_trapezoid: {
    id: 'newtonCotes_trapezoid',
    label: 'Trapecio',
    description: 'Newton-Cotes orden 1: aproxima la integral como suma de areas de trapecios.',
    category: 'Integración — Newton-Cotes',
    color: '#69f0ae',
    inputs: ['a', 'b', 'n', 'tol'],
    requiredInputs: ['a', 'b'],
    isIntegration: true,
    columns: [
      { key: 'iter',   label: 'i',           mono: true },
      { key: 'xi',     label: 'x_i',         mono: true },
      { key: 'fi',     label: 'f(x_i)',      mono: true },
      { key: 'xiNext', label: 'x_{i+1}',     mono: true },
      { key: 'fiNext', label: 'f(x_{i+1})',  mono: true },
      { key: 'approx', label: 'Sum parcial', mono: true, highlight: true },
      { key: 'error',  label: 'Aporte',      mono: true, isError: true },
    ],
    solver: (fn, dfn, params) => newtonCotes(fn, dfn, { ...params, rule: 'trapezoid' }),
    examples: [
      { label: 'sin(x) en [0,pi]',   fn: 'sin(x)',    a: 0, b: 3.14159, n: 8  },
      { label: 'e^(-x^2) en [0,1]',  fn: 'exp(-x^2)', a: 0, b: 1,       n: 10 },
      { label: 'x^2 en [0,4]',       fn: 'x^2',       a: 0, b: 4,       n: 4  },
    ],
  },

  newtonCotes_simpson13: {
    id: 'newtonCotes_simpson13',
    label: 'Simpson 1/3',
    description: 'Newton-Cotes orden 2: usa polinomios cuadraticos. Requiere n par. Mas preciso que trapecio.',
    category: 'Integración — Newton-Cotes',
    color: '#ffd740',
    inputs: ['a', 'b', 'n', 'tol'],
    requiredInputs: ['a', 'b'],
    isIntegration: true,
    columns: [
      { key: 'iter',   label: 'Grupo',       mono: true },
      { key: 'xi',     label: 'x_i',         mono: true },
      { key: 'xMid',   label: 'x_mid',       mono: true },
      { key: 'xiNext', label: 'x_{i+2}',     mono: true },
      { key: 'fi',     label: 'f(x_i)',      mono: true },
      { key: 'fMid',   label: 'f(x_mid)',    mono: true },
      { key: 'fiNext', label: 'f(x_{i+2})',  mono: true },
      { key: 'approx', label: 'Sum parcial', mono: true, highlight: true },
      { key: 'error',  label: 'Aporte',      mono: true, isError: true },
    ],
    solver: (fn, dfn, params) => newtonCotes(fn, dfn, { ...params, rule: 'simpson13' }),
    examples: [
      { label: 'sin(x) en [0,pi]',  fn: 'sin(x)',    a: 0, b: 3.14159, n: 6 },
      { label: 'e^(-x^2) en [0,1]', fn: 'exp(-x^2)', a: 0, b: 1,       n: 4 },
      { label: 'x^3 en [0,2]',      fn: 'x^3',       a: 0, b: 2,       n: 4 },
    ],
  },

  newtonCotes_simpson38: {
    id: 'newtonCotes_simpson38',
    label: 'Simpson 3/8',
    description: 'Newton-Cotes orden 3: usa 4 puntos por grupo. Requiere n multiplo de 3.',
    category: 'Integración — Newton-Cotes',
    color: '#ff6e40',
    inputs: ['a', 'b', 'n', 'tol'],
    requiredInputs: ['a', 'b'],
    isIntegration: true,
    columns: [
      { key: 'iter',   label: 'Grupo',    mono: true },
      { key: 'xi',     label: 'x_0',     mono: true },
      { key: 'x1',     label: 'x_1',     mono: true },
      { key: 'x2',     label: 'x_2',     mono: true },
      { key: 'xiNext', label: 'x_3',     mono: true },
      { key: 'fi',     label: 'f(x_0)',  mono: true },
      { key: 'f1',     label: 'f(x_1)',  mono: true },
      { key: 'f2',     label: 'f(x_2)',  mono: true },
      { key: 'fiNext', label: 'f(x_3)',  mono: true },
      { key: 'approx', label: 'Sum parcial', mono: true, highlight: true },
      { key: 'error',  label: 'Aporte',  mono: true, isError: true },
    ],
    solver: (fn, dfn, params) => newtonCotes(fn, dfn, { ...params, rule: 'simpson38' }),
    examples: [
      { label: 'sin(x) en [0,pi]', fn: 'sin(x)', a: 0, b: 3.14159, n: 6 },
      { label: 'x^3 en [0,3]',     fn: 'x^3',    a: 0, b: 3,       n: 3 },
      { label: 'log(x) en [1,4]',  fn: 'log(x)', a: 1, b: 4,       n: 3 },
    ],
  },

  newtonCotes_midpoint: {
    id: 'newtonCotes_midpoint',
    label: 'Rectangulo Medio',
    description: 'Evalua f en el punto medio de cada subintervalo. Regla de cuadratura mas simple.',
    category: 'Integración — Newton-Cotes',
    color: '#80cbc4',
    inputs: ['a', 'b', 'n', 'tol'],
    requiredInputs: ['a', 'b'],
    isIntegration: true,
    columns: [
      { key: 'iter',  label: 'i',         mono: true },
      { key: 'xi',    label: 'x_mid_i',   mono: true },
      { key: 'fi',    label: 'f(x_mid)',  mono: true },
      { key: 'approx',label: 'Sum parcial',mono: true, highlight: true },
      { key: 'error', label: 'Aporte',    mono: true, isError: true },
    ],
    solver: (fn, dfn, params) => newtonCotes(fn, dfn, { ...params, rule: 'midpoint' }),
    examples: [
      { label: 'x^2 en [0,4]',     fn: 'x^2',   a: 0, b: 4,       n: 4 },
      { label: 'sin(x) en [0,pi]', fn: 'sin(x)', a: 0, b: 3.14159, n: 6 },
    ],
  },

  // ─── CLASE 5: Monte Carlo ────────────────────────────────────────────────

  monteCarlo: {
    id: 'monteCarlo',
    label: 'Monte Carlo',
    description: 'Estima la integral por muestreo aleatorio uniforme. Incluye intervalo de confianza 95%.',
    category: 'Integración — Estocástica',
    color: '#ff80ab',
    inputs: ['a', 'b', 'nSamples', 'seed'],
    requiredInputs: ['a', 'b'],
    isIntegration: true,
    columns: [
      { key: 'iter',   label: 'Muestra N',  mono: true },
      { key: 'xi',     label: 'x_i',       mono: true },
      { key: 'fi',     label: 'f(x_i)',    mono: true },
      { key: 'approx', label: 'I estimada', mono: true, highlight: true },
      { key: 'ci95',   label: 'IC 95%',    mono: true },
      { key: 'error',  label: 'CI half',   mono: true, isError: true },
    ],
    solver: monteCarlo,
    examples: [
      { label: 'e^(-x^2) en [0,1]', fn: 'exp(-x^2)', a: 0, b: 1,       nSamples: 5000 },
      { label: 'sin(x) en [0,pi]',  fn: 'sin(x)',     a: 0, b: 3.14159, nSamples: 5000 },
      { label: 'sqrt(x) en [0,4]',  fn: 'sqrt(x)',    a: 0, b: 4,       nSamples: 5000 },
    ],
  },

  // ─── CLASE 5: EDOs ───────────────────────────────────────────────────────

  euler: {
    id: 'euler',
    label: 'Euler',
    description: 'Metodo de Euler para EDOs: y_{n+1} = y_n + h*f(x_n, y_n). Ingresa f(x,y) = dy/dx.',
    category: 'EDOs',
    color: '#81d4fa',
    inputs: ['odeExpr', 'x0', 'y0', 'xEnd', 'h'],
    requiredInputs: ['odeExpr', 'x0', 'xEnd'],
    hideMainFn: true,
    columns: [
      { key: 'iter',  label: 'n',         mono: true },
      { key: 'xn',    label: 'x_n',       mono: true },
      { key: 'yn',    label: 'y_n',       mono: true },
      { key: 'slope', label: 'f(x_n,y_n)',mono: true },
      { key: 'approx',label: 'y_{n+1}',   mono: true, highlight: true },
      { key: 'error', label: '|Dy|',      mono: true, isError: true },
    ],
    solver: (fn, dfn, params) => odeSolver(fn, dfn, { ...params, odeMethod: 'euler' }),
    examples: [
      { label: 'dy/dx = x+y, y(0)=1',      fn: 'x+y',     odeExpr: 'x+y',     x0: 0, y0: 1, xEnd: 1, h: 0.1 },
      { label: 'dy/dx = 0.4*x*y, y(1)=1',  fn: '0.4*x*y', odeExpr: '0.4*x*y', x0: 1, y0: 1, xEnd: 2, h: 0.1 },
    ],
  },

  heun: {
    id: 'heun',
    label: 'Heun (Euler Mej.)',
    description: 'Euler mejorado: predice con Euler y corrige promediando pendientes inicial y predicha.',
    category: 'EDOs',
    color: '#a5d6a7',
    inputs: ['odeExpr', 'x0', 'y0', 'xEnd', 'h'],
    requiredInputs: ['odeExpr', 'x0', 'xEnd'],
    hideMainFn: true,
    columns: [
      { key: 'iter',  label: 'n',          mono: true },
      { key: 'xn',    label: 'x_n',        mono: true },
      { key: 'yn',    label: 'y_n',        mono: true },
      { key: 'k1',    label: 'k1 (pred)',  mono: true },
      { key: 'yPred', label: 'y* pred',    mono: true },
      { key: 'k2',    label: 'k2 (corr)',  mono: true },
      { key: 'approx',label: 'y_{n+1}',    mono: true, highlight: true },
      { key: 'error', label: '|Dy|',       mono: true, isError: true },
    ],
    solver: (fn, dfn, params) => odeSolver(fn, dfn, { ...params, odeMethod: 'heun' }),
    examples: [
      { label: 'dy/dx = 0.4*x*y, y(1)=1', fn: '0.4*x*y', odeExpr: '0.4*x*y', x0: 1, y0: 1, xEnd: 2, h: 0.1 },
      { label: 'dy/dx = x+y, y(0)=1',      fn: 'x+y',     odeExpr: 'x+y',      x0: 0, y0: 1, xEnd: 1, h: 0.1 },
    ],
  },

  rk4: {
    id: 'rk4',
    label: 'Runge-Kutta 4',
    description: 'RK4: promedia 4 pendientes intermedias. Error O(h4), muy preciso para EDOs suaves.',
    category: 'EDOs',
    color: '#ce93d8',
    inputs: ['odeExpr', 'x0', 'y0', 'xEnd', 'h'],
    requiredInputs: ['odeExpr', 'x0', 'xEnd'],
    hideMainFn: true,
    columns: [
      { key: 'iter',  label: 'n',       mono: true },
      { key: 'xn',    label: 'x_n',     mono: true },
      { key: 'yn',    label: 'y_n',     mono: true },
      { key: 'k1',    label: 'k1',      mono: true },
      { key: 'k2',    label: 'k2',      mono: true },
      { key: 'k3',    label: 'k3',      mono: true },
      { key: 'k4',    label: 'k4',      mono: true },
      { key: 'approx',label: 'y_{n+1}', mono: true, highlight: true },
      { key: 'error', label: '|Dy|',    mono: true, isError: true },
    ],
    solver: (fn, dfn, params) => odeSolver(fn, dfn, { ...params, odeMethod: 'rk4' }),
    examples: [
      { label: 'dy/dx = 0.4*x*y, y(1)=1', fn: '0.4*x*y', odeExpr: '0.4*x*y', x0: 1, y0: 1, xEnd: 2, h: 0.2 },
      { label: 'dy/dx = x+y, y(0)=1',      fn: 'x+y',     odeExpr: 'x+y',      x0: 0, y0: 1, xEnd: 1, h: 0.2 },
      { label: 'dy/dx = -2*y, y(0)=1',     fn: '-2*y',    odeExpr: '-2*y',      x0: 0, y0: 1, xEnd: 2, h: 0.2 },
    ],
  },

}

export const METHOD_LIST = Object.values(METHODS)
export const METHOD_CATEGORIES = [...new Set(METHOD_LIST.map(m => m.category))]

export function getMethod(id) {
  return METHODS[id] ?? null
}

// Exact decimal arithmetic for the calculator.
//
// Numbers are held as a scaled BigInt: { units, scale } means units / 10^scale.
// So 0.1 is { units: 1n, scale: 1 } and -12.5 is { units: -125n, scale: 1 }.
// Every supported operation (+, -, *, %) is exact in this form, so there are
// no floating-point glitches to clean up afterwards; the only rounding is the
// final one to 2 decimal places.

export const OPERATIONS = ['+', '-', '%', '*']

const DECIMAL = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i

/**
 * Parse a decimal string (or a finite number) into { units, scale }.
 * Accepts "-12.5", ".5", "5.", "1e-7" (what String(0.0000001) gives).
 * Returns null for anything that is not a finite decimal number.
 */
export function parseDecimal(input) {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return null
    input = String(input)
  }
  if (typeof input !== 'string') return null

  const match = DECIMAL.exec(input.trim())
  if (!match) return null

  const [, sign, intPart, fracPart = '', expPart = '0'] = match
  if (intPart === '' && fracPart === '') return null

  let digits = intPart + fracPart
  let scale = fracPart.length - Number(expPart)
  if (scale < 0) {
    digits += '0'.repeat(-scale)
    scale = 0
  }

  let units = BigInt(digits || '0')
  if (sign === '-') units = -units
  return { units, scale }
}

function pow10(n) {
  return 10n ** BigInt(n)
}

// Bring two decimals to the same scale so their units can be combined.
function align(a, b) {
  const scale = Math.max(a.scale, b.scale)
  return [a.units * pow10(scale - a.scale), b.units * pow10(scale - b.scale), scale]
}

/**
 * Apply `op` exactly. Returns { units, scale }, or throws on an unknown
 * operation or a remainder by zero.
 */
export function applyOperation(a, b, op) {
  switch (op) {
    case '+': {
      const [x, y, scale] = align(a, b)
      return { units: x + y, scale }
    }
    case '-': {
      const [x, y, scale] = align(a, b)
      return { units: x - y, scale }
    }
    case '*':
      return { units: a.units * b.units, scale: a.scale + b.scale }
    case '%': {
      const [x, y, scale] = align(a, b)
      if (y === 0n) throw new RangeError('Cannot take the remainder of division by zero')
      // BigInt % truncates toward zero, so the result has the sign of the
      // dividend - the same semantics as JavaScript's % on numbers.
      return { units: x % y, scale }
    }
    default:
      throw new TypeError(`Unknown operation: ${op}`)
  }
}

/**
 * Round to at most `places` decimals (half away from zero) and format as a
 * plain number string: optional "-", digits, optional "." and decimals.
 * Trailing zeros are dropped and negative zero becomes "0".
 */
export function formatDecimal({ units, scale }, places = 2) {
  if (scale > places) {
    const divisor = pow10(scale - places)
    let quotient = units / divisor
    const remainder = units % divisor
    const abs = remainder < 0n ? -remainder : remainder
    if (abs * 2n >= divisor) quotient += units < 0n ? -1n : 1n
    units = quotient
    scale = places
  }

  const negative = units < 0n
  let digits = (negative ? -units : units).toString().padStart(scale + 1, '0')
  let intPart = digits.slice(0, digits.length - scale)
  let fracPart = digits.slice(digits.length - scale).replace(/0+$/, '')

  if (/^0*$/.test(intPart + fracPart)) return '0'
  return (negative ? '-' : '') + intPart + (fracPart ? '.' + fracPart : '')
}

/**
 * Calculate `first <op> second` and return the result as a plain string
 * rounded to 2 decimals. Throws a user-readable Error on invalid input.
 */
export function calculate(first, second, op) {
  const a = parseDecimal(first)
  const b = parseDecimal(second)
  if (!a || !b) throw new Error('Enter two numbers')
  return formatDecimal(applyOperation(a, b, op))
}

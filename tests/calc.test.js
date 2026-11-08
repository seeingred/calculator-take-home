import { describe, expect, it } from 'vitest'
import { calculate, formatDecimal, parseDecimal } from '../src/calc.js'

const PLAIN = /^-?\d+(\.\d{1,2})?$/

describe('calculate', () => {
  it.each([
    // examples from the brief
    ['0.1', '0.2', '+', '0.3'],
    ['1.1', '1.1', '*', '1.21'],
    ['1.234', '5.678', '*', '7.01'],
    ['0.0001', '0.0001', '*', '0'],
    ['7', '3', '%', '1'],
    ['-7', '3', '%', '-1'],
    ['7.5', '2', '%', '1.5'],

    // addition
    ['2', '3', '+', '5'],
    ['-12.5', '2.25', '+', '-10.25'],
    ['1000000', '1000000', '+', '2000000'],
    ['-1000000', '-1000000', '+', '-2000000'],
    ['0.004', '0.001', '+', '0.01'],
    ['0.3', '-0.1', '+', '0.2'],

    // subtraction
    ['10', '4', '-', '6'],
    ['0.3', '0.1', '-', '0.2'],
    ['-5', '-5', '-', '0'],
    ['1.5', '3.75', '-', '-2.25'],
    ['-1000000', '1000000', '-', '-2000000'],

    // multiplication
    ['1000000', '1000000', '*', '1000000000000'],
    ['-1000000', '999999.99', '*', '-999999990000'],
    ['-2.5', '4', '*', '-10'],
    ['-0.001', '0.001', '*', '0'],
    ['0.125', '1', '*', '0.13'],
    ['-0.125', '1', '*', '-0.13'],
    ['1.005', '1', '*', '1.01'],

    // remainder: sign follows the first number
    ['7', '-3', '%', '1'],
    ['-7', '-3', '%', '-1'],
    ['5.5', '1.25', '%', '0.5'],
    ['0.3', '0.1', '%', '0'],
    ['1000000', '0.07', '%', '0.02'],
    ['-12.5', '5', '%', '-2.5'],
    ['3', '7', '%', '3'],
  ])('%s %s %s = %s', (a, b, op, expected) => {
    const result = calculate(a, b, op)
    expect(result).toBe(expected)
    expect(result).toMatch(PLAIN)
  })

  it('matches JavaScript arithmetic on values that floats represent exactly', () => {
    // Binary fractions (0.25, 0.5, ...) have no float error, so JS itself is a
    // trustworthy reference here. (For e.g. 0.3 % 0.1, JS gives 0.0999..., the
    // exact answer is 0 - that is the kind of glitch calc.js avoids.)
    const values = [-1000000, -12.5, -7, -2.25, 0.25, 0.5, 3, 7.5, 999999.75]
    const ops = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '%': (a, b) => a % b }
    for (const a of values) {
      for (const b of values) {
        for (const [op, fn] of Object.entries(ops)) {
          const expected = Math.round(Math.abs(fn(a, b)) * 100) / 100 * Math.sign(fn(a, b))
          expect(Number(calculate(String(a), String(b), op))).toBeCloseTo(expected, 9)
        }
      }
    }
  })

  it('never produces exponent notation', () => {
    expect(calculate('0.0000001', '0.0000002', '+')).toBe('0')
    expect(calculate(1e-7, 1, '*')).toBe('0')
    expect(calculate('1000000', '1000000', '*')).not.toMatch(/e/i)
  })

  it('accepts numbers as well as strings', () => {
    expect(calculate(0.1, 0.2, '+')).toBe('0.3')
  })

  it.each([
    ['', '1', '+'],
    ['1', '', '+'],
    ['abc', '1', '+'],
    ['1', '2', '/'],
    ['5', '0', '%'],
  ])('throws on invalid input %j %j %j', (a, b, op) => {
    expect(() => calculate(a, b, op)).toThrow()
  })
})

describe('parseDecimal', () => {
  it.each([
    ['-12.5', -125n, 1],
    ['.5', 5n, 1],
    ['5.', 5n, 0],
    ['1e-7', 1n, 7],
    ['1.5e3', 1500n, 0],
    ['+3', 3n, 0],
    [' 42 ', 42n, 0],
  ])('%j', (input, units, scale) => {
    expect(parseDecimal(input)).toEqual({ units, scale })
  })

  it.each(['', '-', '.', '1,000', '1.2.3', 'NaN', Infinity, null])('rejects %j', (input) => {
    expect(parseDecimal(input)).toBeNull()
  })
})

describe('formatDecimal', () => {
  it('drops trailing zeros and negative zero', () => {
    expect(formatDecimal({ units: 1200n, scale: 3 })).toBe('1.2')
    expect(formatDecimal({ units: -1n, scale: 3 })).toBe('0')
    expect(formatDecimal({ units: -5n, scale: 3 })).toBe('-0.01')
  })
})

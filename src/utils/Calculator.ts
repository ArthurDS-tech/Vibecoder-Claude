/**
 * Calculator class with basic arithmetic operations
 * Provides methods for addition, subtraction, multiplication, and division
 */
export class Calculator {
  /**
   * Adds two numbers
   * @param a - First number
   * @param b - Second number
   * @returns The sum of a and b
   */
  add(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    if (!isFinite(a) || !isFinite(b)) {
      throw new Error('Arguments must be finite numbers');
    }
    return a + b;
  }

  /**
   * Subtracts second number from first number
   * @param a - First number
   * @param b - Second number
   * @returns The difference of a and b
   */
  subtract(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    if (!isFinite(a) || !isFinite(b)) {
      throw new Error('Arguments must be finite numbers');
    }
    return a - b;
  }

  /**
   * Multiplies two numbers
   * @param a - First number
   * @param b - Second number
   * @returns The product of a and b
   */
  multiply(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    if (!isFinite(a) || !isFinite(b)) {
      throw new Error('Arguments must be finite numbers');
    }
    return a * b;
  }

  /**
   * Divides first number by second number
   * @param a - Dividend
   * @param b - Divisor
   * @returns The quotient of a divided by b
   * @throws Error if divisor is zero
   */
  divide(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    if (!isFinite(a) || !isFinite(b)) {
      throw new Error('Arguments must be finite numbers');
    }
    if (b === 0) {
      throw new Error('Cannot divide by zero');
    }
    return a / b;
  }
}
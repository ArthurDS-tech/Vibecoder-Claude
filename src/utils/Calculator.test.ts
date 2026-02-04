import { Calculator } from './Calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add', () => {
    it('should add two positive numbers correctly', () => {
      expect(calculator.add(2, 3)).toBe(5);
      expect(calculator.add(10, 25)).toBe(35);
    });

    it('should add two negative numbers correctly', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
      expect(calculator.add(-10, -25)).toBe(-35);
    });

    it('should add positive and negative numbers correctly', () => {
      expect(calculator.add(5, -3)).toBe(2);
      expect(calculator.add(-5, 3)).toBe(-2);
    });

    it('should handle zero correctly', () => {
      expect(calculator.add(0, 0)).toBe(0);
      expect(calculator.add(5, 0)).toBe(5);
      expect(calculator.add(0, 5)).toBe(5);
    });

    it('should handle decimal numbers correctly', () => {
      expect(calculator.add(2.5, 3.7)).toBeCloseTo(6.2);
      expect(calculator.add(0.1, 0.2)).toBeCloseTo(0.3);
    });

    it('should throw error for non-number arguments', () => {
      expect(() => calculator.add('2' as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => calculator.add(2, null as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error for infinite numbers', () => {
      expect(() => calculator.add(Infinity, 5)).toThrow('Arguments must be finite numbers');
      expect(() => calculator.add(5, -Infinity)).toThrow('Arguments must be finite numbers');
    });
  });

  describe('subtract', () => {
    it('should subtract two positive numbers correctly', () => {
      expect(calculator.subtract(5, 3)).toBe(2);
      expect(calculator.subtract(10, 25)).toBe(-15);
    });

    it('should subtract two negative numbers correctly', () => {
      expect(calculator.subtract(-5, -3)).toBe(-2);
      expect(calculator.subtract(-3, -5)).toBe(2);
    });

    it('should subtract positive and negative numbers correctly', () => {
      expect(calculator.subtract(5, -3)).toBe(8);
      expect(calculator.subtract(-5, 3)).toBe(-8);
    });

    it('should handle zero correctly', () => {
      expect(calculator.subtract(0, 0)).toBe(0);
      expect(calculator.subtract(5, 0)).toBe(5);
      expect(calculator.subtract(0, 5)).toBe(-5);
    });

    it('should handle decimal numbers correctly', () => {
      expect(calculator.subtract(5.5, 2.3)).toBeCloseTo(3.2);
      expect(calculator.subtract(0.3, 0.1)).toBeCloseTo(0.2);
    });

    it('should throw error for non-number arguments', () => {
      expect(() => calculator.subtract('5' as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => calculator.subtract(5, undefined as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error for infinite numbers', () => {
      expect(() => calculator.subtract(Infinity, 5)).toThrow('Arguments must be finite numbers');
      expect(() => calculator.subtract(5, -Infinity)).toThrow('Arguments must be finite numbers');
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers correctly', () => {
      expect(calculator.multiply(2, 3)).toBe(6);
      expect(calculator.multiply(5, 7)).toBe(35);
    });

    it('should multiply two negative numbers correctly', () => {
      expect(calculator.multiply(-2, -3)).toBe(6);
      expect(calculator.multiply(-5, -4)).toBe(20);
    });

    it('should multiply positive and negative numbers correctly', () => {
      expect(calculator.multiply(5, -3)).toBe(-15);
      expect(calculator.multiply(-5, 3)).toBe(-15);
    });

    it('should handle zero correctly', () => {
      expect(calculator.multiply(0, 0)).toBe(0);
      expect(calculator.multiply(5, 0)).toBe(0);
      expect(calculator.multiply(0, 5)).toBe(0);
    });

    it('should handle one as identity element', () => {
      expect(calculator.multiply(5, 1)).toBe(5);
      expect(calculator.multiply(1, 5)).toBe(5);
    });

    it('should handle decimal numbers correctly', () => {
      expect(calculator.multiply(2.5, 4)).toBe(10);
      expect(calculator.multiply(0.5, 0.5)).toBe(0.25);
    });

    it('should throw error for non-number arguments', () => {
      expect(() => calculator.multiply('2' as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => calculator.multiply(2, {} as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error for infinite numbers', () => {
      expect(() => calculator.multiply(Infinity, 5)).toThrow('Arguments must be finite numbers');
      expect(() => calculator.multiply(5, -Infinity)).toThrow('Arguments must be finite numbers');
    });
  });

  describe('divide', () => {
    it('should divide two positive numbers correctly', () => {
      expect(calculator.divide(6, 2)).toBe(3);
      expect(calculator.divide(10, 5)).toBe(2);
    });

    it('should divide two negative numbers correctly', () => {
      expect(calculator.divide(-6, -2)).toBe(3);
      expect(calculator.divide(-10, -5)).toBe(2);
    });

    it('should divide positive and negative numbers correctly', () => {
      expect(calculator.divide(6, -2)).toBe(-3);
      expect(calculator.divide(-6, 2)).toBe(-3);
    });

    it('should handle division by one correctly', () => {
      expect(calculator.divide(5, 1)).toBe(5);
      expect(calculator.divide(-5, 1)).toBe(-5);
    });

    it('should handle zero dividend correctly', () => {
      expect(calculator.divide(0, 5)).toBe(0);
      expect(calculator.divide(0, -5)).toBeCloseTo(0); // Use toBeCloseTo for -0 vs 0
    });

    it('should throw error when dividing by zero', () => {
      expect(() => calculator.divide(5, 0)).toThrow('Cannot divide by zero');
      expect(() => calculator.divide(-5, 0)).toThrow('Cannot divide by zero');
      expect(() => calculator.divide(0, 0)).toThrow('Cannot divide by zero');
    });

    it('should handle decimal numbers correctly', () => {
      expect(calculator.divide(7.5, 2.5)).toBe(3);
      expect(calculator.divide(1, 3)).toBeCloseTo(0.333333);
    });

    it('should throw error for non-number arguments', () => {
      expect(() => calculator.divide('6' as any, 2)).toThrow('Both arguments must be numbers');
      expect(() => calculator.divide(6, [] as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error for infinite numbers', () => {
      expect(() => calculator.divide(Infinity, 5)).toThrow('Arguments must be finite numbers');
      expect(() => calculator.divide(5, -Infinity)).toThrow('Arguments must be finite numbers');
    });
  });

  describe('Integration tests', () => {
    it('should perform complex calculations correctly', () => {
      const result1 = calculator.add(calculator.multiply(2, 3), 4); // (2 * 3) + 4 = 10
      expect(result1).toBe(10);

      const result2 = calculator.divide(calculator.subtract(10, 4), 2); // (10 - 4) / 2 = 3
      expect(result2).toBe(3);

      const result3 = calculator.multiply(
        calculator.add(2, 3),
        calculator.subtract(10, 5)
      ); // (2 + 3) * (10 - 5) = 25
      expect(result3).toBe(25);
    });
  });
});
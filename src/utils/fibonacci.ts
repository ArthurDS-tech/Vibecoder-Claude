/**
 * Fibonacci Calculator - Recursive Implementation
 * Implementação de cálculo de Fibonacci com recursão e otimização
 */

/**
 * Cache para armazenar resultados já calculados da sequência de Fibonacci
 */
const fibonacciCache: Map<number, number> = new Map();

/**
 * Calcula o n-ésimo número da sequência de Fibonacci de forma recursiva.
 * 
 * Sequência de Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...
 * Onde cada número é a soma dos dois anteriores.
 * 
 * ATENÇÃO: Esta implementação tem complexidade O(2^n) e pode ser lenta para valores grandes.
 * Para melhor performance, use fibonacciMemoized().
 * 
 * @param n - Posição na sequência de Fibonacci (deve ser >= 0)
 * @returns O n-ésimo número de Fibonacci
 * @throws {Error} Se n for negativo
 * 
 * @example
 * fibonacci(5)  // retorna 5
 * fibonacci(10) // retorna 55
 */
export function fibonacci(n: number): number {
  if (n < 0) {
    throw new Error('Fibonacci não é definido para números negativos');
  }
  
  if (n === 0) return 0;
  if (n === 1) return 1;
  
  return fibonacci(n - 1) + fibonacci(n - 2);
}

/**
 * Calcula o n-ésimo número da sequência de Fibonacci com memoização.
 * Usa cache para evitar recalcular valores já computados.
 * 
 * Complexidade: O(n) tempo, O(n) espaço
 * 
 * @param n - Posição na sequência de Fibonacci (deve ser >= 0)
 * @returns O n-ésimo número de Fibonacci
 * @throws {Error} Se n for negativo
 * 
 * @example
 * fibonacciMemoized(40) // Muito mais rápido que fibonacci(40)
 * fibonacciMemoized(100) // Possível com memoização
 */
export function fibonacciMemoized(n: number): number {
  if (n < 0) {
    throw new Error('Fibonacci não é definido para números negativos');
  }
  
  // Verificar se já está no cache
  if (fibonacciCache.has(n)) {
    return fibonacciCache.get(n)!;
  }
  
  // Casos base
  if (n === 0) return 0;
  if (n === 1) return 1;
  
  // Calcular e armazenar no cache
  const result = fibonacciMemoized(n - 1) + fibonacciMemoized(n - 2);
  fibonacciCache.set(n, result);
  
  return result;
}

/**
 * Limpa o cache da função memoizada.
 * Útil para liberar memória ou resetar o estado.
 */
export function clearFibonacciCache(): void {
  fibonacciCache.clear();
}

/**
 * Gera uma sequência de Fibonacci até o n-ésimo número.
 * 
 * @param n - Quantidade de números da sequência
 * @returns Array com os n primeiros números de Fibonacci
 * 
 * @example
 * fibonacciSequence(10) // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
 */
export function fibonacciSequence(n: number): number[] {
  if (n < 0) {
    throw new Error('Quantidade deve ser >= 0');
  }
  
  const sequence: number[] = [];
  for (let i = 0; i < n; i++) {
    sequence.push(fibonacciMemoized(i));
  }
  
  return sequence;
}

// Exemplos de uso e testes de performance
if (require.main === module) {
  console.log('🧪 Testando Fibonacci\n');
  
  // Testes básicos
  console.log('=== Testes Básicos ===');
  console.log('Fibonacci(0):', fibonacci(0));   // 0
  console.log('Fibonacci(1):', fibonacci(1));   // 1
  console.log('Fibonacci(5):', fibonacci(5));   // 5
  console.log('Fibonacci(10):', fibonacci(10)); // 55
  
  console.log('\n=== Sequência ===');
  console.log('Primeiros 10 números:', fibonacciSequence(10));
  
  console.log('\n=== Comparação de Performance ===');
  
  // Teste de performance - Recursivo simples
  console.time('Fibonacci(30) - Recursivo');
  const result1 = fibonacci(30);
  console.timeEnd('Fibonacci(30) - Recursivo');
  console.log('Resultado:', result1);
  
  // Teste de performance - Memoizado
  console.time('FibonacciMemoized(30) - Memoizado');
  const result2 = fibonacciMemoized(30);
  console.timeEnd('FibonacciMemoized(30) - Memoizado');
  console.log('Resultado:', result2);
  
  // Teste com número maior (só memoizado)
  console.log('\n=== Teste com Número Maior ===');
  console.time('FibonacciMemoized(50)');
  const result3 = fibonacciMemoized(50);
  console.timeEnd('FibonacciMemoized(50)');
  console.log('Fibonacci(50):', result3);
  
  // Teste de erro
  console.log('\n=== Teste de Validação ===');
  try {
    fibonacci(-1);
  } catch (error) {
    console.log('Erro esperado:', (error as Error).message);
  }
  
  console.log('\n✅ Todos os testes concluídos!');
}

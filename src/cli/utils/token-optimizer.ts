/**
 * Otimizador inteligente de tokens
 * Reduz uso de tokens mantendo qualidade das respostas
 */
export class TokenOptimizer {
  
  /**
   * Estima número de tokens em um texto
   * Aproximação: ~4 caracteres por token
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Comprime contexto removendo informações redundantes
   */
  static compressContext(context: string, maxTokens: number = 2000): string {
    const estimatedTokens = this.estimateTokens(context);
    
    if (estimatedTokens <= maxTokens) {
      return context;
    }
    
    // Calcular quanto precisamos reduzir
    const ratio = maxTokens / estimatedTokens;
    const targetLength = Math.floor(context.length * ratio);
    
    // Manter início e fim, remover meio
    const keepStart = Math.floor(targetLength * 0.6);
    const keepEnd = Math.floor(targetLength * 0.4);
    
    const start = context.substring(0, keepStart);
    const end = context.substring(context.length - keepEnd);
    
    return `${start}\n\n[... conteúdo omitido para economizar tokens ...]\n\n${end}`;
  }

  /**
   * Otimiza prompt removendo palavras desnecessárias
   */
  static optimizePrompt(prompt: string): string {
    return prompt
      // Remover espaços extras
      .replace(/\s+/g, ' ')
      // Remover quebras de linha múltiplas
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Cria resumo de arquivo para economizar tokens
   */
  static summarizeFile(content: string, maxLines: number = 50): string {
    const lines = content.split('\n');
    
    if (lines.length <= maxLines) {
      return content;
    }
    
    // Manter imports, exports e definições principais
    const important: string[] = [];
    const other: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('import ') ||
        trimmed.startsWith('export ') ||
        trimmed.startsWith('class ') ||
        trimmed.startsWith('interface ') ||
        trimmed.startsWith('type ') ||
        trimmed.startsWith('function ') ||
        trimmed.startsWith('const ') ||
        trimmed.startsWith('let ') ||
        trimmed.startsWith('var ')
      ) {
        important.push(line);
      } else {
        other.push(line);
      }
    });
    
    // Combinar linhas importantes + algumas outras
    const remainingLines = maxLines - important.length;
    const summary = [
      ...important,
      ...other.slice(0, Math.max(0, remainingLines))
    ];
    
    if (other.length > remainingLines) {
      summary.push(`\n// ... ${other.length - remainingLines} linhas omitidas ...`);
    }
    
    return summary.join('\n');
  }

  /**
   * Cria contexto mínimo necessário para uma tarefa
   */
  static createMinimalContext(files: Array<{ path: string; content: string }>, task: string): string {
    const context: string[] = [];
    
    // Adicionar apenas arquivos relevantes
    files.forEach(file => {
      const isRelevant = this.isFileRelevant(file.path, file.content, task);
      
      if (isRelevant) {
        const summary = this.summarizeFile(file.content, 30);
        context.push(`File: ${file.path}\n${summary}\n`);
      }
    });
    
    return context.join('\n---\n\n');
  }

  /**
   * Verifica se arquivo é relevante para a tarefa
   */
  private static isFileRelevant(path: string, content: string, task: string): boolean {
    const taskLower = task.toLowerCase();
    const pathLower = path.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Verificar se path ou conteúdo mencionam palavras-chave da tarefa
    const keywords = taskLower.split(/\s+/).filter(w => w.length > 3);
    
    return keywords.some(keyword => 
      pathLower.includes(keyword) || contentLower.includes(keyword)
    );
  }

  /**
   * Calcula custo estimado de uma operação
   */
  static estimateCost(inputTokens: number, outputTokens: number, provider: 'openai' | 'anthropic'): number {
    if (provider === 'anthropic') {
      // Claude: $3/$15 per million tokens
      const inputCost = (inputTokens / 1000000) * 3;
      const outputCost = (outputTokens / 1000000) * 15;
      return inputCost + outputCost;
    } else {
      // GPT-4: $30/$60 per million tokens
      const inputCost = (inputTokens / 1000000) * 30;
      const outputCost = (outputTokens / 1000000) * 60;
      return inputCost + outputCost;
    }
  }

  /**
   * Verifica se operação está dentro do orçamento
   */
  static isWithinBudget(estimatedTokens: number, remainingBudget: number, provider: 'openai' | 'anthropic'): boolean {
    const estimatedCost = this.estimateCost(estimatedTokens * 0.7, estimatedTokens * 0.3, provider);
    return estimatedCost <= remainingBudget;
  }

  /**
   * Sugere otimizações para reduzir tokens
   */
  static suggestOptimizations(tokens: number, maxTokens: number): string[] {
    const suggestions: string[] = [];
    
    if (tokens > maxTokens) {
      const excess = tokens - maxTokens;
      const percentOver = ((excess / maxTokens) * 100).toFixed(0);
      
      suggestions.push(`Você está usando ${percentOver}% mais tokens que o recomendado`);
      suggestions.push('Sugestões para reduzir:');
      suggestions.push('  • Use comandos mais específicos');
      suggestions.push('  • Evite incluir arquivos grandes desnecessários');
      suggestions.push('  • Use "explain <arquivo>" ao invés de "ask sobre <arquivo>"');
      suggestions.push('  • Divida tarefas complexas em partes menores');
    }
    
    return suggestions;
  }
}

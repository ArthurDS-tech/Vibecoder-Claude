/**
 * DiffAnalyzer - Análise inteligente de diferenças de código
 * Similar ao diff do Cursor AI
 */

export interface DiffLine {
  type: 'add' | 'remove' | 'unchanged' | 'modified';
  lineNumber: number;
  content: string;
  oldLineNumber?: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface SemanticChange {
  type: 'function-added' | 'function-removed' | 'function-modified' | 
        'variable-added' | 'variable-removed' | 'import-added' | 'import-removed';
  name: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface BreakingChange {
  type: 'api-change' | 'signature-change' | 'removal' | 'rename';
  description: string;
  affectedFiles: string[];
  suggestion: string;
}

export interface DiffAnalysis {
  hunks: DiffHunk[];
  semanticChanges: SemanticChange[];
  breakingChanges: BreakingChange[];
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
  };
  summary: string;
}

export class DiffAnalyzer {
  /**
   * Analisa diferenças entre duas versões de código
   */
  async analyzeDiff(original: string, modified: string, filePath?: string): Promise<DiffAnalysis> {
    const hunks = this.computeDiff(original, modified);
    const semanticChanges = this.detectSemanticChanges(original, modified, filePath);
    const breakingChanges = this.detectBreakingChanges(original, modified, filePath);
    const stats = this.calculateStats(hunks);

    return {
      hunks,
      semanticChanges,
      breakingChanges,
      stats,
      summary: this.generateSummary(stats, semanticChanges, breakingChanges),
    };
  }

  /**
   * Computa diff usando algoritmo Myers simplificado
   */
  private computeDiff(original: string, modified: string): DiffHunk[] {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;

    let oldIndex = 0;
    let newIndex = 0;

    while (oldIndex < originalLines.length || newIndex < modifiedLines.length) {
      const oldLine = originalLines[oldIndex];
      const newLine = modifiedLines[newIndex];

      if (oldLine === newLine) {
        // Linha não mudou
        if (currentHunk) {
          currentHunk.lines.push({
            type: 'unchanged',
            lineNumber: newIndex + 1,
            content: newLine,
            oldLineNumber: oldIndex + 1,
          });
        }
        oldIndex++;
        newIndex++;
      } else {
        // Mudança detectada - criar novo hunk se necessário
        if (!currentHunk) {
          currentHunk = {
            oldStart: oldIndex + 1,
            oldLines: 0,
            newStart: newIndex + 1,
            newLines: 0,
            lines: [],
          };
          hunks.push(currentHunk);
        }

        // Verificar se é adição, remoção ou modificação
        if (oldIndex >= originalLines.length) {
          // Adição
          currentHunk.lines.push({
            type: 'add',
            lineNumber: newIndex + 1,
            content: newLine,
          });
          currentHunk.newLines++;
          newIndex++;
        } else if (newIndex >= modifiedLines.length) {
          // Remoção
          currentHunk.lines.push({
            type: 'remove',
            lineNumber: oldIndex + 1,
            content: oldLine,
            oldLineNumber: oldIndex + 1,
          });
          currentHunk.oldLines++;
          oldIndex++;
        } else {
          // Modificação
          currentHunk.lines.push({
            type: 'remove',
            lineNumber: oldIndex + 1,
            content: oldLine,
            oldLineNumber: oldIndex + 1,
          });
          currentHunk.lines.push({
            type: 'add',
            lineNumber: newIndex + 1,
            content: newLine,
          });
          currentHunk.oldLines++;
          currentHunk.newLines++;
          oldIndex++;
          newIndex++;
        }
      }

      // Fechar hunk se houver muitas linhas inalteradas
      if (currentHunk && currentHunk.lines.length > 0) {
        const lastLines = currentHunk.lines.slice(-3);
        const allUnchanged = lastLines.every(l => l.type === 'unchanged');
        if (allUnchanged && currentHunk.lines.length > 5) {
          currentHunk = null;
        }
      }
    }

    return hunks;
  }

  /**
   * Detecta mudanças semânticas (funções, variáveis, etc)
   */
  private detectSemanticChanges(
    original: string,
    modified: string,
    filePath?: string
  ): SemanticChange[] {
    const changes: SemanticChange[] = [];

    // Detectar funções
    const originalFunctions = this.extractFunctions(original);
    const modifiedFunctions = this.extractFunctions(modified);

    // Funções adicionadas
    for (const func of modifiedFunctions) {
      if (!originalFunctions.includes(func)) {
        changes.push({
          type: 'function-added',
          name: func,
          description: `Função '${func}' foi adicionada`,
          impact: 'medium',
        });
      }
    }

    // Funções removidas
    for (const func of originalFunctions) {
      if (!modifiedFunctions.includes(func)) {
        changes.push({
          type: 'function-removed',
          name: func,
          description: `Função '${func}' foi removida`,
          impact: 'high',
        });
      }
    }

    // Detectar imports
    const originalImports = this.extractImports(original);
    const modifiedImports = this.extractImports(modified);

    for (const imp of modifiedImports) {
      if (!originalImports.includes(imp)) {
        changes.push({
          type: 'import-added',
          name: imp,
          description: `Import '${imp}' foi adicionado`,
          impact: 'low',
        });
      }
    }

    for (const imp of originalImports) {
      if (!modifiedImports.includes(imp)) {
        changes.push({
          type: 'import-removed',
          name: imp,
          description: `Import '${imp}' foi removido`,
          impact: 'medium',
        });
      }
    }

    return changes;
  }

  /**
   * Detecta breaking changes
   */
  private detectBreakingChanges(
    original: string,
    modified: string,
    filePath?: string
  ): BreakingChange[] {
    const changes: BreakingChange[] = [];

    // Detectar remoção de exports
    const originalExports = this.extractExports(original);
    const modifiedExports = this.extractExports(modified);

    for (const exp of originalExports) {
      if (!modifiedExports.includes(exp)) {
        changes.push({
          type: 'removal',
          description: `Export '${exp}' foi removido - pode quebrar código dependente`,
          affectedFiles: [],
          suggestion: `Considere deprecar ao invés de remover, ou adicionar migração`,
        });
      }
    }

    // Detectar mudanças em assinaturas de funções
    const originalSignatures = this.extractFunctionSignatures(original);
    const modifiedSignatures = this.extractFunctionSignatures(modified);

    for (const [name, oldSig] of Object.entries(originalSignatures)) {
      const newSig = modifiedSignatures[name];
      if (newSig && oldSig !== newSig) {
        changes.push({
          type: 'signature-change',
          description: `Assinatura da função '${name}' foi alterada`,
          affectedFiles: [],
          suggestion: `Verifique todos os locais que chamam esta função`,
        });
      }
    }

    return changes;
  }

  /**
   * Calcula estatísticas do diff
   */
  private calculateStats(hunks: DiffHunk[]): {
    additions: number;
    deletions: number;
    modifications: number;
  } {
    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add') additions++;
        if (line.type === 'remove') deletions++;
        if (line.type === 'modified') modifications++;
      }
    }

    return { additions, deletions, modifications };
  }

  /**
   * Gera resumo das mudanças
   */
  private generateSummary(
    stats: { additions: number; deletions: number; modifications: number },
    semanticChanges: SemanticChange[],
    breakingChanges: BreakingChange[]
  ): string {
    const parts: string[] = [];

    if (stats.additions > 0) {
      parts.push(`+${stats.additions} linhas adicionadas`);
    }
    if (stats.deletions > 0) {
      parts.push(`-${stats.deletions} linhas removidas`);
    }

    if (semanticChanges.length > 0) {
      parts.push(`${semanticChanges.length} mudanças semânticas`);
    }

    if (breakingChanges.length > 0) {
      parts.push(`⚠️  ${breakingChanges.length} breaking changes`);
    }

    return parts.join(', ') || 'Sem mudanças';
  }

  /**
   * Extrai nomes de funções
   */
  private extractFunctions(code: string): string[] {
    const functions: string[] = [];
    const functionRegex = /(?:function|const|let|var)\s+(\w+)\s*(?:=\s*)?(?:\([^)]*\)|async)/g;
    let match;

    while ((match = functionRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }

    return functions;
  }

  /**
   * Extrai imports
   */
  private extractImports(code: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Extrai exports
   */
  private extractExports(code: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/g;
    let match;

    while ((match = exportRegex.exec(code)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  /**
   * Extrai assinaturas de funções
   */
  private extractFunctionSignatures(code: string): Record<string, string> {
    const signatures: Record<string, string> = {};
    const functionRegex = /(?:function|const|let)\s+(\w+)\s*(?:=\s*)?\(([^)]*)\)/g;
    let match;

    while ((match = functionRegex.exec(code)) !== null) {
      signatures[match[1]] = match[2];
    }

    return signatures;
  }
}

/**
 * ChangePreview - Preview interativo de mudanças
 * Similar ao preview do Cursor AI
 */

import * as chalk from 'chalk';
import type { CodeChange } from '../../ai/agents/Coder';
import { DiffAnalyzer } from '../../ai/analysis/DiffAnalyzer';

export interface PreviewOptions {
  showLineNumbers?: boolean;
  contextLines?: number;
  colorize?: boolean;
  interactive?: boolean;
}

export class ChangePreview {
  private diffAnalyzer: DiffAnalyzer;

  constructor() {
    this.diffAnalyzer = new DiffAnalyzer();
  }

  /**
   * Mostra preview de todas as mudanças
   */
  async showPreview(changes: CodeChange[], options: PreviewOptions = {}): Promise<void> {
    const {
      showLineNumbers = true,
      contextLines = 3,
      colorize = true,
      interactive = false,
    } = options;

    console.log(chalk.bold('\n📋 PREVIEW DAS MUDANÇAS\n'));
    console.log('═'.repeat(80));

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      
      console.log(`\n${i + 1}. ${this.formatChangeType(change.type)} ${chalk.cyan(change.file)}`);
      console.log(chalk.gray(change.description));
      console.log('─'.repeat(80));

      if (change.type === 'delete') {
        console.log(chalk.red('  Arquivo será deletado'));
        continue;
      }

      if (change.type === 'create') {
        console.log(chalk.green('  Novo arquivo será criado'));
        await this.showNewFilePreview(change, showLineNumbers, colorize);
        continue;
      }

      // Modificação - mostrar diff
      if (change.originalContent) {
        await this.showDiff(change, showLineNumbers, contextLines, colorize);
      }
    }

    console.log('\n' + '═'.repeat(80));
    this.showSummary(changes);
  }

  /**
   * Mostra diff de uma mudança
   */
  private async showDiff(
    change: CodeChange,
    showLineNumbers: boolean,
    contextLines: number,
    colorize: boolean
  ): Promise<void> {
    const analysis = await this.diffAnalyzer.analyzeDiff(
      change.originalContent || '',
      change.content,
      change.file
    );

    // Mostrar estatísticas
    console.log(chalk.gray(`  ${analysis.summary}\n`));

    // Mostrar mudanças semânticas
    if (analysis.semanticChanges.length > 0) {
      console.log(chalk.yellow('  Mudanças semânticas:'));
      for (const sc of analysis.semanticChanges) {
        const icon = this.getImpactIcon(sc.impact);
        console.log(`    ${icon} ${sc.description}`);
      }
      console.log();
    }

    // Mostrar breaking changes
    if (analysis.breakingChanges.length > 0) {
      console.log(chalk.red.bold('  ⚠️  BREAKING CHANGES:'));
      for (const bc of analysis.breakingChanges) {
        console.log(chalk.red(`    • ${bc.description}`));
        console.log(chalk.gray(`      ${bc.suggestion}`));
      }
      console.log();
    }

    // Mostrar hunks
    for (const hunk of analysis.hunks) {
      console.log(chalk.gray(`  @@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`));
      
      for (const line of hunk.lines) {
        const lineNum = showLineNumbers ? this.formatLineNumber(line.lineNumber) : '';
        const content = line.content || '';

        if (colorize) {
          switch (line.type) {
            case 'add':
              console.log(chalk.green(`  ${lineNum}+ ${content}`));
              break;
            case 'remove':
              console.log(chalk.red(`  ${lineNum}- ${content}`));
              break;
            case 'modified':
              console.log(chalk.yellow(`  ${lineNum}~ ${content}`));
              break;
            default:
              console.log(chalk.gray(`  ${lineNum}  ${content}`));
          }
        } else {
          const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
          console.log(`  ${lineNum}${prefix} ${content}`);
        }
      }
      console.log();
    }
  }

  /**
   * Mostra preview de arquivo novo
   */
  private async showNewFilePreview(
    change: CodeChange,
    showLineNumbers: boolean,
    colorize: boolean
  ): Promise<void> {
    const lines = (change.content || '').split('\n');
    const maxLines = 20; // Mostrar no máximo 20 linhas

    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      const lineNum = showLineNumbers ? this.formatLineNumber(i + 1) : '';
      const content = lines[i];
      
      if (colorize) {
        console.log(chalk.green(`  ${lineNum}+ ${content}`));
      } else {
        console.log(`  ${lineNum}+ ${content}`);
      }
    }

    if (lines.length > maxLines) {
      console.log(chalk.gray(`  ... (${lines.length - maxLines} linhas restantes)`));
    }
  }

  /**
   * Aprovação interativa de mudanças
   */
  async interactiveApproval(changes: CodeChange[]): Promise<CodeChange[]> {
    const approved: CodeChange[] = [];

    console.log(chalk.bold('\n🔍 APROVAÇÃO INTERATIVA\n'));

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      
      console.log(`\n${i + 1}/${changes.length} ${this.formatChangeType(change.type)} ${chalk.cyan(change.file)}`);
      console.log(chalk.gray(change.description));

      // Aqui você pode adicionar lógica de input do usuário
      // Por enquanto, aprovamos tudo automaticamente
      approved.push(change);
    }

    return approved;
  }

  /**
   * Aplicação seletiva de mudanças
   */
  async applySelectively(changes: CodeChange[]): Promise<CodeChange[]> {
    // Implementar lógica de seleção interativa
    // Por enquanto, retorna todas
    return changes;
  }

  /**
   * Mostra resumo das mudanças
   */
  private showSummary(changes: CodeChange[]): void {
    const creates = changes.filter(c => c.type === 'create').length;
    const modifies = changes.filter(c => c.type === 'modify').length;
    const deletes = changes.filter(c => c.type === 'delete').length;

    console.log(chalk.bold('\n📊 RESUMO:'));
    
    if (creates > 0) {
      console.log(chalk.green(`  ✓ ${creates} arquivo(s) criado(s)`));
    }
    if (modifies > 0) {
      console.log(chalk.yellow(`  ✓ ${modifies} arquivo(s) modificado(s)`));
    }
    if (deletes > 0) {
      console.log(chalk.red(`  ✓ ${deletes} arquivo(s) deletado(s)`));
    }

    console.log(chalk.gray(`\n  Total: ${changes.length} mudança(s)`));
  }

  /**
   * Formata tipo de mudança
   */
  private formatChangeType(type: string): string {
    switch (type) {
      case 'create':
        return chalk.green.bold('[CREATE]');
      case 'modify':
        return chalk.yellow.bold('[MODIFY]');
      case 'delete':
        return chalk.red.bold('[DELETE]');
      default:
        return chalk.gray.bold('[UNKNOWN]');
    }
  }

  /**
   * Formata número de linha
   */
  private formatLineNumber(num: number): string {
    return num.toString().padStart(4, ' ');
  }

  /**
   * Retorna ícone de impacto
   */
  private getImpactIcon(impact: string): string {
    switch (impact) {
      case 'high':
        return chalk.red('🔴');
      case 'medium':
        return chalk.yellow('🟡');
      case 'low':
        return chalk.green('🟢');
      default:
        return '⚪';
    }
  }
}

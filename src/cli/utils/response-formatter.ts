import chalk from 'chalk';

/**
 * Formata respostas da IA no estilo Claude Code
 * Design limpo, sem boxes, focado em legibilidade
 */
export class ResponseFormatter {
  
  /**
   * Formata resposta da IA no estilo Claude Code
   */
  static formatAIResponse(response: string, type: 'ask' | 'chat' = 'ask'): void {
    console.log('');
    
    // Header simples
    const header = type === 'ask' ? 'Assistant' : 'Chat';
    console.log(chalk.hex('#00D9FF')(`━━━ ${header} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log('');
    
    // Processar resposta
    const lines = response.split('\n');
    
    lines.forEach(line => {
      if (line.trim() === '') {
        console.log('');
        return;
      }
      
      // Detectar código
      if (line.trim().startsWith('```')) {
        console.log(chalk.gray(line));
        return;
      }
      
      // Detectar headers markdown
      if (line.trim().startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        
        if (level === 1) {
          console.log(chalk.bold.hex('#FFD700')(text));
        } else if (level === 2) {
          console.log(chalk.bold.hex('#00D9FF')(text));
        } else {
          console.log(chalk.bold.white(text));
        }
        return;
      }
      
      // Detectar listas
      if (line.trim().match(/^[-*]\s/)) {
        const text = line.replace(/^(\s*)[-*]\s/, '$1');
        console.log(chalk.hex('#00D9FF')('  •') + chalk.white(` ${text}`));
        return;
      }
      
      // Detectar listas numeradas
      if (line.trim().match(/^\d+\.\s/)) {
        console.log(chalk.white(line));
        return;
      }
      
      // Texto normal
      console.log(chalk.white(line));
    });
    
    console.log('');
    console.log(chalk.hex('#00D9FF')('━'.repeat(80)));
    console.log('');
  }

  /**
   * Formata erro de forma limpa
   */
  static formatError(error: string): void {
    console.log('');
    console.log(chalk.red('✗ Erro: ') + chalk.white(error));
    console.log('');
  }

  /**
   * Formata mensagem de sucesso
   */
  static formatSuccess(message: string): void {
    console.log('');
    console.log(chalk.green('✓ ') + chalk.white(message));
    console.log('');
  }

  /**
   * Formata aviso
   */
  static formatWarning(message: string): void {
    console.log('');
    console.log(chalk.yellow('⚠ ') + chalk.white(message));
    console.log('');
  }

  /**
   * Formata informação
   */
  static formatInfo(message: string): void {
    console.log('');
    console.log(chalk.cyan('ℹ ') + chalk.white(message));
    console.log('');
  }

  /**
   * Formata código inline
   */
  static formatCode(code: string, language?: string): void {
    console.log('');
    if (language) {
      console.log(chalk.gray(`\`\`\`${language}`));
    }
    console.log(chalk.hex('#FFD700')(code));
    if (language) {
      console.log(chalk.gray('```'));
    }
    console.log('');
  }

  /**
   * Formata lista de arquivos
   */
  static formatFileList(files: Array<{ path: string; type: 'file' | 'dir' }>): void {
    console.log('');
    files.forEach(file => {
      const icon = file.type === 'dir' ? '📁' : '📄';
      const color = file.type === 'dir' ? chalk.hex('#00D9FF') : chalk.gray;
      console.log(color(`  ${icon} ${file.path}`));
    });
    console.log('');
  }
}

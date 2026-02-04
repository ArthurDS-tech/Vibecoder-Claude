import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as readline from 'readline';

export interface AutocompleteOptions {
  commands: string[];
  currentDir: string;
}

export class AutocompleteManager {
  private commands: string[];
  private currentDir: string;
  private currentSuggestions: string[] = [];
  private selectedIndex: number = 0;

  constructor(options: AutocompleteOptions) {
    this.commands = options.commands;
    this.currentDir = options.currentDir;
  }

  /**
   * Obtém sugestões baseadas no input atual
   */
  getSuggestions(input: string): string[] {
    const parts = input.split(' ');
    const lastPart = parts[parts.length - 1];
    
    // Se está digitando o comando
    if (parts.length === 1) {
      return this.getCommandSuggestions(lastPart);
    }
    
    // Se está digitando argumentos (arquivos/diretórios)
    const command = parts[0];
    
    // cd precisa apenas de diretórios
    if (command.toLowerCase() === 'cd') {
      return this.getDirectorySuggestions(lastPart);
    }
    
    // Outros comandos que precisam de arquivos
    if (this.needsFileSuggestions(command)) {
      return this.getFileSuggestions(lastPart);
    }
    
    return [];
  }

  /**
   * Sugestões de comandos
   */
  private getCommandSuggestions(partial: string): string[] {
    if (!partial) return [];
    
    return this.commands
      .filter(cmd => cmd.startsWith(partial.toLowerCase()))
      .slice(0, 10);
  }

  /**
   * Sugestões de arquivos/diretórios
   */
  private getFileSuggestions(partial: string): string[] {
    try {
      let dirPath = '.';
      let baseName = partial;
      
      // Se tem barra, separar diretório e nome
      if (partial.includes('/') || partial.includes('\\')) {
        dirPath = path.dirname(partial);
        baseName = path.basename(partial);
      }
      
      const fullPath = path.resolve(this.currentDir, dirPath);
      
      if (!fs.existsSync(fullPath)) {
        return [];
      }
      
      const items = fs.readdirSync(fullPath);
      
      const suggestions = items
        .filter(item => {
          // Ignorar arquivos ocultos se não começou com .
          if (!baseName.startsWith('.') && item.startsWith('.')) {
            return false;
          }
          
          // Ignorar node_modules, .git, etc
          if (this.shouldIgnore(item)) {
            return false;
          }
          
          return item.toLowerCase().startsWith(baseName.toLowerCase());
        })
        .map(item => {
          const itemPath = path.join(fullPath, item);
          const stats = fs.statSync(itemPath);
          
          // Retornar apenas o nome do item
          if (stats.isDirectory()) {
            return item + '/';
          }
          return item;
        })
        .slice(0, 10);
      
      return suggestions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Sugestões apenas de diretórios (para cd)
   */
  private getDirectorySuggestions(partial: string): string[] {
    try {
      let dirPath = '.';
      let baseName = partial;
      
      // Se tem barra, separar diretório e nome
      if (partial.includes('/') || partial.includes('\\')) {
        dirPath = path.dirname(partial);
        baseName = path.basename(partial);
      }
      
      const fullPath = path.resolve(this.currentDir, dirPath);
      
      if (!fs.existsSync(fullPath)) {
        return [];
      }
      
      const items = fs.readdirSync(fullPath);
      
      const suggestions = items
        .filter(item => {
          // Ignorar arquivos ocultos se não começou com .
          if (!baseName.startsWith('.') && item.startsWith('.')) {
            return false;
          }
          
          // Ignorar node_modules, .git, etc
          if (this.shouldIgnore(item)) {
            return false;
          }
          
          const itemPath = path.join(fullPath, item);
          const stats = fs.statSync(itemPath);
          
          // Apenas diretórios
          if (!stats.isDirectory()) {
            return false;
          }
          
          return item.toLowerCase().startsWith(baseName.toLowerCase());
        })
        .map(item => item + '/')
        .slice(0, 10);
      
      return suggestions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Verifica se deve ignorar arquivo/diretório
   */
  private shouldIgnore(name: string): boolean {
    const ignoreList = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'out',
      '.next',
      'coverage',
      '.cache',
    ];
    
    return ignoreList.includes(name);
  }

  /**
   * Verifica se comando precisa de sugestões de arquivo
   */
  private needsFileSuggestions(command: string): boolean {
    const fileCommands = [
      'read', 'write', 'edit', 'rm', 'delete', 'cat', 'touch',
      'review', 'explain', 'debug', 'refactor', 'optimize',
      'security', 'test', 'docs', 'convert', 'compare',
      // Aliases em português
      'ler', 'escrever', 'editar', 'deletar', 'remover',
      'revisar', 'explicar', 'debugar', 'refatorar', 'otimizar',
      'testar', 'documentar'
    ];
    
    return fileCommands.includes(command.toLowerCase());
  }

  /**
   * Completa o input com a sugestão selecionada
   */
  complete(input: string, suggestions: string[]): string {
    if (suggestions.length === 0) return input;
    
    const parts = input.split(' ');
    
    // Se está completando comando (primeira palavra)
    if (parts.length === 1) {
      return suggestions[this.selectedIndex];
    }
    
    // Se está completando arquivo/diretório
    const lastPart = parts[parts.length - 1];
    const suggestion = suggestions[this.selectedIndex];
    
    // Construir o caminho completo
    if (lastPart.includes('/') || lastPart.includes('\\')) {
      const dirPath = path.dirname(lastPart);
      const suggestionName = path.basename(suggestion);
      parts[parts.length - 1] = path.join(dirPath, suggestionName).replace(/\\/g, '/');
    } else {
      parts[parts.length - 1] = suggestion;
    }
    
    return parts.join(' ');
  }

  /**
   * Formata sugestão para exibição inline (transparente)
   */
  formatInlineSuggestion(input: string, suggestion: string): string {
    if (!suggestion || !suggestion.startsWith(input)) {
      return '';
    }
    
    const completion = suggestion.substring(input.length);
    return chalk.gray(completion);
  }

  /**
   * Formata lista de sugestões para exibição
   */
  formatSuggestionList(suggestions: string[], selectedIndex: number): string {
    if (suggestions.length === 0) return '';
    
    const lines: string[] = [];
    
    suggestions.forEach((suggestion, index) => {
      const isSelected = index === selectedIndex;
      const icon = this.getIcon(suggestion);
      
      if (isSelected) {
        lines.push(chalk.hex('#00D9FF')(`  ▶ ${icon} ${suggestion}`));
      } else {
        lines.push(chalk.gray(`    ${icon} ${suggestion}`));
      }
    });
    
    return '\n' + lines.join('\n');
  }

  /**
   * Obtém ícone para sugestão
   */
  private getIcon(suggestion: string): string {
    if (suggestion.endsWith('/')) {
      return '📁';
    }
    
    const ext = path.extname(suggestion);
    const iconMap: Record<string, string> = {
      '.ts': '📘',
      '.js': '📙',
      '.tsx': '⚛️',
      '.jsx': '⚛️',
      '.json': '📋',
      '.md': '📝',
      '.txt': '📄',
      '.css': '🎨',
      '.html': '🌐',
      '.py': '🐍',
      '.java': '☕',
      '.go': '🔷',
      '.rs': '🦀',
    };
    
    return iconMap[ext] || '📄';
  }

  /**
   * Navega para próxima sugestão
   */
  nextSuggestion(suggestions: string[]): void {
    if (suggestions.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % suggestions.length;
  }

  /**
   * Navega para sugestão anterior
   */
  previousSuggestion(suggestions: string[]): void {
    if (suggestions.length === 0) return;
    this.selectedIndex = this.selectedIndex === 0 
      ? suggestions.length - 1 
      : this.selectedIndex - 1;
  }

  /**
   * Reseta índice de seleção
   */
  resetSelection(): void {
    this.selectedIndex = 0;
  }

  /**
   * Atualiza diretório atual
   */
  updateCurrentDir(dir: string): void {
    this.currentDir = dir;
  }
}

/**
 * Configuração de readline com autocomplete customizado
 */
export function setupAutocomplete(
  rl: readline.Interface,
  autocomplete: AutocompleteManager
): void {
  let currentInput = '';
  let showingSuggestions = false;
  
  // Interceptar input
  const originalWrite = (rl as any)._writeToOutput;
  (rl as any)._writeToOutput = function(stringToWrite: string) {
    // Capturar input atual
    const line = (rl as any).line || '';
    
    if (line !== currentInput) {
      currentInput = line;
      
      // Obter sugestões
      const suggestions = autocomplete.getSuggestions(line);
      
      if (suggestions.length > 0 && line.length > 0) {
        // Mostrar primeira sugestão inline (transparente)
        const parts = line.split(' ');
        const lastPart = parts[parts.length - 1];
        const firstSuggestion = suggestions[0];
        
        if (firstSuggestion.startsWith(lastPart)) {
          const completion = firstSuggestion.substring(lastPart.length);
          stringToWrite += chalk.gray(completion);
        }
      }
    }
    
    originalWrite.call(this, stringToWrite);
  };
}

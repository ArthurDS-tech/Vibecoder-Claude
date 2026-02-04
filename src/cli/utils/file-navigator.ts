import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

export class FileNavigator {
  
  /**
   * Lista arquivos e diretórios de forma organizada
   */
  static listDirectory(dirPath: string, options: { detailed?: boolean; hidden?: boolean } = {}): FileNode[] {
    const items = fs.readdirSync(dirPath);
    const nodes: FileNode[] = [];
    
    items.forEach(item => {
      // Ignorar arquivos ocultos se não solicitado
      if (!options.hidden && item.startsWith('.')) {
        return;
      }
      
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);
      
      const node: FileNode = {
        name: item,
        path: fullPath,
        type: stats.isDirectory() ? 'directory' : 'file',
      };
      
      if (options.detailed && stats.isFile()) {
        node.size = stats.size;
      }
      
      nodes.push(node);
    });
    
    // Ordenar: diretórios primeiro, depois arquivos
    return nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  }

  /**
   * Cria árvore de arquivos recursiva
   */
  static buildTree(dirPath: string, maxDepth: number = 3, currentDepth: number = 0): FileNode {
    const stats = fs.statSync(dirPath);
    const name = path.basename(dirPath);
    
    const node: FileNode = {
      name,
      path: dirPath,
      type: stats.isDirectory() ? 'directory' : 'file',
    };
    
    if (stats.isDirectory() && currentDepth < maxDepth) {
      try {
        const items = fs.readdirSync(dirPath);
        node.children = [];
        
        items.forEach(item => {
          // Ignorar node_modules, .git, etc
          if (this.shouldIgnore(item)) {
            return;
          }
          
          const fullPath = path.join(dirPath, item);
          try {
            const childNode = this.buildTree(fullPath, maxDepth, currentDepth + 1);
            node.children!.push(childNode);
          } catch (error) {
            // Ignorar erros de permissão
          }
        });
        
        // Ordenar filhos
        node.children.sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          }
          return a.type === 'directory' ? -1 : 1;
        });
      } catch (error) {
        // Ignorar erros de permissão
      }
    }
    
    return node;
  }

  /**
   * Renderiza árvore de arquivos
   */
  static renderTree(node: FileNode, prefix: string = '', isLast: boolean = true): void {
    const connector = isLast ? '└── ' : '├── ';
    const color = node.type === 'directory' ? chalk.hex('#00D9FF') : chalk.gray;
    const name = node.type === 'directory' ? `${node.name}/` : node.name;
    
    console.log(prefix + connector + color(name));
    
    if (node.children && node.children.length > 0) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      
      node.children.forEach((child, index) => {
        const childIsLast = index === node.children!.length - 1;
        this.renderTree(child, newPrefix, childIsLast);
      });
    }
  }

  /**
   * Busca arquivos por padrão
   */
  static searchFiles(dirPath: string, pattern: string, maxResults: number = 50): FileNode[] {
    const results: FileNode[] = [];
    const regex = new RegExp(pattern, 'i');
    
    const search = (currentPath: string, depth: number = 0) => {
      if (depth > 5 || results.length >= maxResults) {
        return;
      }
      
      try {
        const items = fs.readdirSync(currentPath);
        
        items.forEach(item => {
          if (this.shouldIgnore(item)) {
            return;
          }
          
          const fullPath = path.join(currentPath, item);
          const stats = fs.statSync(fullPath);
          
          // Verificar se nome corresponde ao padrão
          if (regex.test(item)) {
            results.push({
              name: item,
              path: fullPath,
              type: stats.isDirectory() ? 'directory' : 'file',
              size: stats.isFile() ? stats.size : undefined,
            });
          }
          
          // Buscar recursivamente em diretórios
          if (stats.isDirectory() && results.length < maxResults) {
            search(fullPath, depth + 1);
          }
        });
      } catch (error) {
        // Ignorar erros de permissão
      }
    };
    
    search(dirPath);
    return results;
  }

  /**
   * Busca conteúdo dentro de arquivos
   */
  static searchInFiles(dirPath: string, searchTerm: string, extensions: string[] = []): Array<{ file: string; line: number; content: string }> {
    const results: Array<{ file: string; line: number; content: string }> = [];
    const regex = new RegExp(searchTerm, 'gi');
    
    const search = (currentPath: string, depth: number = 0) => {
      if (depth > 5 || results.length >= 100) {
        return;
      }
      
      try {
        const items = fs.readdirSync(currentPath);
        
        items.forEach(item => {
          if (this.shouldIgnore(item)) {
            return;
          }
          
          const fullPath = path.join(currentPath, item);
          const stats = fs.statSync(fullPath);
          
          if (stats.isFile()) {
            // Verificar extensão se especificada
            if (extensions.length > 0) {
              const ext = path.extname(item);
              if (!extensions.includes(ext)) {
                return;
              }
            }
            
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');
              
              lines.forEach((line, index) => {
                if (regex.test(line) && results.length < 100) {
                  results.push({
                    file: fullPath,
                    line: index + 1,
                    content: line.trim(),
                  });
                }
              });
            } catch (error) {
              // Ignorar arquivos binários ou com erro de leitura
            }
          } else if (stats.isDirectory()) {
            search(fullPath, depth + 1);
          }
        });
      } catch (error) {
        // Ignorar erros de permissão
      }
    };
    
    search(dirPath);
    return results;
  }

  /**
   * Obtém informações detalhadas de um arquivo
   */
  static getFileInfo(filePath: string): { size: number; lines: number; extension: string; modified: Date } | null {
    try {
      const stats = fs.statSync(filePath);
      
      if (!stats.isFile()) {
        return null;
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;
      const extension = path.extname(filePath);
      
      return {
        size: stats.size,
        lines,
        extension,
        modified: stats.mtime,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica se deve ignorar arquivo/diretório
   */
  private static shouldIgnore(name: string): boolean {
    const ignoreList = [
      'node_modules',
      '.git',
      '.vscode',
      'dist',
      'build',
      'out',
      '.next',
      'coverage',
      '.cache',
      'vscode',
    ];
    
    return ignoreList.includes(name);
  }

  /**
   * Formata tamanho de arquivo
   */
  static formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

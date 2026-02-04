/**
 * FilePathExtractor - Extrai caminhos de arquivo do intent do usuário
 * Garante que a IA edite o arquivo correto especificado pelo usuário
 */

import * as path from 'path';
import * as fs from 'fs';

export interface ExtractedFile {
  originalPath: string;
  normalizedPath: string;
  exists: boolean;
  extension: string;
  fileName: string;
}

export class FilePathExtractor {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Extrai todos os caminhos de arquivo mencionados no intent
   */
  extractFilePaths(intent: string): ExtractedFile[] {
    const paths: string[] = [];

    // Padrão 1: Caminhos Windows absolutos (C:\Users\...)
    const windowsPattern = /[A-Z]:\\(?:[^\\/:*?"<>|\r\n\s]+\\)*[^\\/:*?"<>|\r\n\s]+\.\w+/gi;
    const windowsMatches = intent.match(windowsPattern);
    if (windowsMatches) {
      paths.push(...windowsMatches);
    }

    // Padrão 2: Caminhos Unix absolutos (/home/user/...)
    const unixPattern = /\/(?:[^\/\0\s]+\/)*[^\/\0\s]+\.\w+/g;
    const unixMatches = intent.match(unixPattern);
    if (unixMatches) {
      paths.push(...unixMatches);
    }

    // Padrão 3: Caminhos em backticks (`arquivo.ts`) - EXTRAIR SEM BACKTICKS
    const backtickPattern = /`([^`]+\.\w+)`/g;
    let match;
    while ((match = backtickPattern.exec(intent)) !== null) {
      // match[1] já extrai sem os backticks
      paths.push(match[1]);
    }

    // Padrão 4: Caminhos relativos simples (src/file.ts)
    // Apenas se não tiver backticks ao redor
    const relativePattern = /(?:^|\s)(?!`)([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.[a-zA-Z0-9]+)(?!`)(?:\s|$)/g;
    while ((match = relativePattern.exec(intent)) !== null) {
      if (!paths.includes(match[1])) {
        paths.push(match[1]);
      }
    }

    // Padrão 5: Nomes de arquivo simples mencionados (arquivo.cs, test.ts)
    // Apenas se não tiver backticks ao redor e não for duplicata
    const simpleFilePattern = /(?:^|\s)(?!`)([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)(?!`)(?:\s|$)/g;
    while ((match = simpleFilePattern.exec(intent)) !== null) {
      // Evitar duplicatas
      if (!paths.includes(match[1])) {
        paths.push(match[1]);
      }
    }

    // Remover duplicatas e processar
    const uniquePaths = [...new Set(paths)];
    return uniquePaths.map(p => this.processPath(p)).filter(p => p !== null) as ExtractedFile[];
  }

  /**
   * Processa e normaliza um caminho de arquivo
   */
  private processPath(filePath: string): ExtractedFile | null {
    try {
      // Remover backticks se houver (segurança extra)
      const cleanPath = filePath.replace(/`/g, '').trim();
      
      let normalizedPath: string;

      // Se é caminho absoluto, usar diretamente
      if (path.isAbsolute(cleanPath)) {
        normalizedPath = path.normalize(cleanPath);
      } else {
        // Se é relativo, resolver a partir do projectRoot
        normalizedPath = path.resolve(this.projectRoot, cleanPath);
      }

      // Verificar se arquivo existe
      const exists = fs.existsSync(normalizedPath);

      // Se não existe, tentar encontrar no projeto
      if (!exists) {
        const found = this.findFileInProject(path.basename(cleanPath));
        if (found) {
          normalizedPath = found;
        }
      }

      return {
        originalPath: cleanPath,
        normalizedPath,
        exists: fs.existsSync(normalizedPath),
        extension: path.extname(normalizedPath).slice(1),
        fileName: path.basename(normalizedPath),
      };
    } catch (error) {
      console.warn(`Erro ao processar caminho: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Procura arquivo no projeto por nome
   */
  private findFileInProject(fileName: string): string | null {
    const searchPaths = [
      this.projectRoot,
      path.join(this.projectRoot, 'src'),
      path.join(this.projectRoot, 'lib'),
      path.join(this.projectRoot, 'app'),
    ];

    for (const searchPath of searchPaths) {
      const fullPath = path.join(searchPath, fileName);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }

      // Busca recursiva (limitada a 2 níveis)
      const found = this.searchRecursive(searchPath, fileName, 0, 2);
      if (found) {
        return found;
      }
    }

    return null;
  }

  /**
   * Busca recursiva por arquivo
   */
  private searchRecursive(
    dir: string,
    fileName: string,
    depth: number,
    maxDepth: number
  ): string | null {
    if (depth > maxDepth) return null;

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        if (item === 'node_modules' || item === '.git') continue;

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isFile() && item === fileName) {
          return fullPath;
        }

        if (stat.isDirectory()) {
          const found = this.searchRecursive(fullPath, fileName, depth + 1, maxDepth);
          if (found) return found;
        }
      }
    } catch (error) {
      // Ignorar erros de permissão
    }

    return null;
  }

  /**
   * Detecta se o intent menciona edição de arquivo existente
   */
  isEditingExistingFile(intent: string): boolean {
    const editKeywords = [
      'editar',
      'modificar',
      'alterar',
      'mudar',
      'atualizar',
      'melhorar',
      'corrigir',
      'desenvolva',
      'desenvolver',
      'edit',
      'modify',
      'update',
      'improve',
      'fix',
    ];

    const lowerIntent = intent.toLowerCase();
    return editKeywords.some(keyword => lowerIntent.includes(keyword));
  }

  /**
   * Extrai o arquivo principal que o usuário quer editar
   */
  extractPrimaryFile(intent: string): ExtractedFile | null {
    const files = this.extractFilePaths(intent);

    if (files.length === 0) return null;

    // Se há apenas um arquivo, é o principal
    if (files.length === 1) return files[0];

    // Se há múltiplos, priorizar:
    // 1. Arquivos que existem
    // 2. Arquivos mencionados primeiro
    // 3. Arquivos com caminho completo

    const existingFiles = files.filter(f => f.exists);
    if (existingFiles.length > 0) {
      return existingFiles[0];
    }

    // Priorizar caminhos absolutos
    const absoluteFiles = files.filter(f => path.isAbsolute(f.originalPath));
    if (absoluteFiles.length > 0) {
      return absoluteFiles[0];
    }

    // Retornar primeiro arquivo
    return files[0];
  }

  /**
   * Gera mensagem de erro se arquivo não existe
   */
  generateFileNotFoundMessage(file: ExtractedFile): string {
    return `
⚠️  ARQUIVO NÃO ENCONTRADO

Arquivo especificado: ${file.originalPath}
Caminho normalizado: ${file.normalizedPath}

Sugestões:
1. Verifique se o caminho está correto
2. Use caminho absoluto: C:\\Users\\...\\arquivo.ext
3. Use caminho relativo ao projeto: src/arquivo.ext
4. Verifique se o arquivo existe no projeto

Para criar um novo arquivo, use:
vibe "criar arquivo ${file.fileName}"
    `.trim();
  }
}

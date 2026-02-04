/**
 * CodeContextCollector - Coleta contexto completo do projeto antes de gerar código
 * Garante que a IA tenha acesso a TUDO que precisa para gerar código inteligente
 */

import * as fs from 'fs';
import * as path from 'path';
// import { FileContext } from './Coder';
import { ParserFactory } from '../parsers/ParserFactory';
import { ParsedFile } from '../parsers/types';

// Temporary type definition for FileContext
export interface FileContext {
  path: string;
  content: string;
  language?: string;
  exports?: string[];
  imports?: string[];
}

export interface ProjectContext {
  // Arquivos relacionados
  relatedFiles: FileContext[];
  
  // Estrutura do projeto
  projectStructure: {
    folders: string[];
    filesByType: Record<string, string[]>;
    totalFiles: number;
  };
  
  // Padrões de código detectados
  codePatterns: {
    namingConvention: 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case' | 'mixed';
    indentation: 'spaces' | 'tabs';
    indentSize: number;
    quotes: 'single' | 'double' | 'mixed';
    semicolons: boolean;
    asyncStyle: 'async/await' | 'promises' | 'callbacks' | 'mixed';
  };
  
  // Dependências e imports comuns
  commonImports: string[];
  commonPatterns: string[];
  
  // Arquivos similares (para referência)
  similarFiles: FileContext[];
  
  // Configurações do projeto
  projectConfig: {
    hasTypeScript: boolean;
    hasESLint: boolean;
    hasPrettier: boolean;
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'none';
    frameworks: string[];
  };
}

export class CodeContextCollector {
  private parserFactory: ParserFactory;

  constructor(private projectRoot: string) {
    this.parserFactory = new ParserFactory({
      includeDocumentation: true,
      includePrivateMembers: false
    });
  }

  /**
   * Coleta TODO o contexto necessário para gerar código inteligente
   */
  async collectContext(
    intent: string, 
    targetFiles: string[],
    explicitFiles?: any[]
  ): Promise<ProjectContext> {
    console.log('🔍 Coletando contexto completo do projeto...');

    const context: ProjectContext = {
      relatedFiles: [],
      projectStructure: {
        folders: [],
        filesByType: {},
        totalFiles: 0,
      },
      codePatterns: {
        namingConvention: 'camelCase',
        indentation: 'spaces',
        indentSize: 2,
        quotes: 'single',
        semicolons: true,
        asyncStyle: 'async/await',
      },
      commonImports: [],
      commonPatterns: [],
      similarFiles: [],
      projectConfig: {
        hasTypeScript: false,
        hasESLint: false,
        hasPrettier: false,
        packageManager: 'none',
        frameworks: [],
      },
    };

    // 1. Se há arquivos explícitos, PRIORIZAR eles
    if (explicitFiles && explicitFiles.length > 0) {
      console.log('📌 Carregando arquivos explícitos especificados pelo usuário...');
      for (const explicitFile of explicitFiles) {
        // Calcular caminho relativo corretamente
        let relativePath = path.relative(this.projectRoot, explicitFile.normalizedPath);
        
        // Se o caminho relativo começa com "..", o arquivo está fora do projeto
        // Nesse caso, usar apenas o nome do arquivo
        if (relativePath.startsWith('..')) {
          relativePath = explicitFile.fileName;
        }
        
        if (explicitFile.exists) {
          // Arquivo existe - ler conteúdo
          try {
            const content = await fs.promises.readFile(explicitFile.normalizedPath, 'utf-8');
            context.relatedFiles.push({
              path: relativePath,
              content,
              language: this.detectLanguage(explicitFile.extension),
              imports: this.extractImports(content, explicitFile.extension),
              exports: this.extractExports(content, explicitFile.extension),
            });
            console.log(`✅ Arquivo lido: ${relativePath}`);
          } catch (error) {
            console.warn(`⚠️  Erro ao ler ${relativePath}:`, error);
          }
        } else {
          // Arquivo não existe - criar contexto vazio para criação
          context.relatedFiles.push({
            path: relativePath,
            content: '',
            language: this.detectLanguage(explicitFile.extension),
            imports: [],
            exports: [],
          });
          console.log(`📝 Arquivo marcado para criação: ${relativePath}`);
        }
      }
    }

    // 2. Ler arquivos alvo adicionais (se houver)
    await this.loadTargetFiles(targetFiles, context);

    // 3. Encontrar arquivos similares
    await this.findSimilarFiles(targetFiles, context);

    // 4. Analisar estrutura do projeto
    await this.analyzeProjectStructure(context);

    // 5. Detectar padrões de código
    await this.detectCodePatterns(context);

    // 6. Analisar configurações
    await this.analyzeProjectConfig(context);

    // 7. Extrair imports e padrões comuns
    await this.extractCommonPatterns(context);

    console.log('✅ Contexto coletado:', {
      arquivos: context.relatedFiles.length,
      similares: context.similarFiles.length,
      padrões: Object.keys(context.codePatterns).length,
    });

    return context;
  }

  /**
   * Carrega arquivos alvo
   */
  private async loadTargetFiles(targetFiles: string[], context: ProjectContext): Promise<void> {
    for (const file of targetFiles) {
      const fullPath = path.join(this.projectRoot, file);
      
      try {
        if (fs.existsSync(fullPath)) {
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          const ext = path.extname(file).slice(1);
          
          context.relatedFiles.push({
            path: file,
            content,
            language: this.detectLanguage(ext),
            imports: this.extractImports(content, ext),
            exports: this.extractExports(content, ext),
          });
        } else {
          // Arquivo novo - criar contexto vazio
          context.relatedFiles.push({
            path: file,
            content: '',
            language: this.detectLanguage(path.extname(file).slice(1)),
            imports: [],
            exports: [],
          });
        }
      } catch (error) {
        console.warn(`⚠️  Não foi possível ler ${file}`);
      }
    }
  }

  /**
   * Encontra arquivos similares para usar como referência
   */
  private async findSimilarFiles(targetFiles: string[], context: ProjectContext): Promise<void> {
    const targetExtensions = new Set(
      targetFiles.map(f => path.extname(f).slice(1))
    );

    const similarFiles = this.findFilesByExtensions(
      Array.from(targetExtensions),
      5 // Máximo 5 arquivos similares
    );

    for (const file of similarFiles) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const ext = path.extname(file).slice(1);
        const relativePath = path.relative(this.projectRoot, file);

        context.similarFiles.push({
          path: relativePath,
          content,
          language: this.detectLanguage(ext),
          imports: this.extractImports(content, ext),
          exports: this.extractExports(content, ext),
        });
      } catch (error) {
        // Ignorar erros
      }
    }
  }

  /**
   * Analisa estrutura do projeto
   */
  private async analyzeProjectStructure(context: ProjectContext): Promise<void> {
    const structure = this.scanDirectory(this.projectRoot, 0, 3);
    
    context.projectStructure.folders = structure.folders;
    context.projectStructure.filesByType = structure.filesByType;
    context.projectStructure.totalFiles = structure.totalFiles;
  }

  /**
   * Detecta padrões de código analisando arquivos existentes
   */
  private async detectCodePatterns(context: ProjectContext): Promise<void> {
    const allFiles = [...context.relatedFiles, ...context.similarFiles];
    
    if (allFiles.length === 0) return;

    let totalSpaces = 0;
    let totalTabs = 0;
    let totalSingle = 0;
    let totalDouble = 0;
    let totalSemicolons = 0;
    let totalNoSemicolons = 0;
    let totalAsync = 0;
    let totalPromises = 0;

    for (const file of allFiles) {
      if (!file.content) continue;

      // Detectar indentação
      const spaceIndent = (file.content.match(/\n  /g) || []).length;
      const tabIndent = (file.content.match(/\n\t/g) || []).length;
      totalSpaces += spaceIndent;
      totalTabs += tabIndent;

      // Detectar aspas
      const singleQuotes = (file.content.match(/'/g) || []).length;
      const doubleQuotes = (file.content.match(/"/g) || []).length;
      totalSingle += singleQuotes;
      totalDouble += doubleQuotes;

      // Detectar ponto e vírgula
      const semicolons = (file.content.match(/;/g) || []).length;
      const lines = file.content.split('\n').length;
      if (semicolons > lines * 0.3) {
        totalSemicolons++;
      } else {
        totalNoSemicolons++;
      }

      // Detectar estilo async
      if (file.content.includes('async ') || file.content.includes('await ')) {
        totalAsync++;
      }
      if (file.content.includes('.then(') || file.content.includes('.catch(')) {
        totalPromises++;
      }
    }

    // Determinar padrões
    context.codePatterns.indentation = totalSpaces > totalTabs ? 'spaces' : 'tabs';
    context.codePatterns.indentSize = 2; // Padrão
    context.codePatterns.quotes = totalSingle > totalDouble ? 'single' : 'double';
    context.codePatterns.semicolons = totalSemicolons > totalNoSemicolons;
    context.codePatterns.asyncStyle = totalAsync > totalPromises ? 'async/await' : 'promises';

    // Detectar naming convention
    const camelCaseCount = allFiles.reduce((count, f) => 
      count + (f.content.match(/[a-z][A-Z]/g) || []).length, 0
    );
    const snake_caseCount = allFiles.reduce((count, f) => 
      count + (f.content.match(/[a-z]_[a-z]/g) || []).length, 0
    );
    
    context.codePatterns.namingConvention = camelCaseCount > snake_caseCount ? 'camelCase' : 'snake_case';
  }

  /**
   * Analisa configurações do projeto
   */
  private async analyzeProjectConfig(context: ProjectContext): Promise<void> {
    // TypeScript
    context.projectConfig.hasTypeScript = fs.existsSync(
      path.join(this.projectRoot, 'tsconfig.json')
    );

    // ESLint
    context.projectConfig.hasESLint = 
      fs.existsSync(path.join(this.projectRoot, '.eslintrc.js')) ||
      fs.existsSync(path.join(this.projectRoot, '.eslintrc.json'));

    // Prettier
    context.projectConfig.hasPrettier = fs.existsSync(
      path.join(this.projectRoot, '.prettierrc')
    );

    // Package manager
    if (fs.existsSync(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
      context.projectConfig.packageManager = 'pnpm';
    } else if (fs.existsSync(path.join(this.projectRoot, 'yarn.lock'))) {
      context.projectConfig.packageManager = 'yarn';
    } else if (fs.existsSync(path.join(this.projectRoot, 'package-lock.json'))) {
      context.projectConfig.packageManager = 'npm';
    }

    // Frameworks
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (deps['react']) context.projectConfig.frameworks.push('React');
        if (deps['vue']) context.projectConfig.frameworks.push('Vue');
        if (deps['angular']) context.projectConfig.frameworks.push('Angular');
        if (deps['express']) context.projectConfig.frameworks.push('Express');
        if (deps['nestjs']) context.projectConfig.frameworks.push('NestJS');
        if (deps['next']) context.projectConfig.frameworks.push('Next.js');
      }
    } catch (error) {
      // Ignorar erros
    }
  }

  /**
   * Extrai imports e padrões comuns
   */
  private async extractCommonPatterns(context: ProjectContext): Promise<void> {
    const importCounts = new Map<string, number>();
    const patternCounts = new Map<string, number>();

    const allFiles = [...context.relatedFiles, ...context.similarFiles];

    for (const file of allFiles) {
      // Contar imports
      if (file.imports) {
        for (const imp of file.imports) {
          importCounts.set(imp, (importCounts.get(imp) || 0) + 1);
        }
      }

      // Detectar padrões comuns
      if (file.content.includes('export default')) {
        patternCounts.set('export default', (patternCounts.get('export default') || 0) + 1);
      }
      if (file.content.includes('export class')) {
        patternCounts.set('export class', (patternCounts.get('export class') || 0) + 1);
      }
      if (file.content.includes('export interface')) {
        patternCounts.set('export interface', (patternCounts.get('export interface') || 0) + 1);
      }
    }

    // Top 10 imports mais comuns
    context.commonImports = Array.from(importCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([imp]) => imp);

    // Padrões mais comuns
    context.commonPatterns = Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([pattern]) => pattern);
  }

  /**
   * Escaneia diretório
   */
  private scanDirectory(dir: string, depth: number, maxDepth: number): {
    folders: string[];
    filesByType: Record<string, string[]>;
    totalFiles: number;
  } {
    const result = {
      folders: [] as string[],
      filesByType: {} as Record<string, string[]>,
      totalFiles: 0,
    };

    if (depth > maxDepth) return result;

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === 'out' || item === 'dist') {
          continue;
        }

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          result.folders.push(path.relative(this.projectRoot, fullPath));
          const subResult = this.scanDirectory(fullPath, depth + 1, maxDepth);
          result.folders.push(...subResult.folders);
          Object.assign(result.filesByType, subResult.filesByType);
          result.totalFiles += subResult.totalFiles;
        } else {
          const ext = path.extname(item).slice(1);
          if (!result.filesByType[ext]) {
            result.filesByType[ext] = [];
          }
          result.filesByType[ext].push(path.relative(this.projectRoot, fullPath));
          result.totalFiles++;
        }
      }
    } catch (error) {
      // Ignorar erros
    }

    return result;
  }

  /**
   * Encontra arquivos por extensões
   */
  private findFilesByExtensions(extensions: string[], maxFiles: number): string[] {
    const files: string[] = [];

    const search = (dir: string, depth: number = 0) => {
      if (depth > 3 || files.length >= maxFiles) return;

      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          if (files.length >= maxFiles) break;
          if (item === 'node_modules' || item === '.git' || item === 'out') continue;

          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            search(fullPath, depth + 1);
          } else {
            const ext = path.extname(item).slice(1);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignorar erros
      }
    };

    search(this.projectRoot);
    return files;
  }

  /**
   * Detecta linguagem por extensão
   */
  private detectLanguage(ext: string): string {
    const map: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
    };
    return map[ext] || ext;
  }

  /**
   * Extrai imports (usa AST Parser quando possível)
   */
  private extractImports(content: string, ext: string, filePath?: string): string[] {
    const imports: string[] = [];

    // Try AST Parser first for TypeScript/JavaScript
    if (ext === 'ts' || ext === 'js' || ext === 'tsx' || ext === 'jsx') {
      try {
        const parsed = this.parserFactory.parseCode(content, `temp.${ext}`);
        if (parsed) {
          return parsed.imports.map(imp => imp.moduleName);
        }
      } catch (error) {
        // Fall back to regex if parsing fails
      }

      // Fallback: Regex-based extraction
      const importRegex = /import\s+(?:{[^}]+}|[\w]+|\*\s+as\s+[\w]+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }

    return imports;
  }

  /**
   * Extrai exports
   */
  private extractExports(content: string, ext: string): string[] {
    const exports: string[] = [];

    if (ext === 'ts' || ext === 'js' || ext === 'tsx' || ext === 'jsx') {
      const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+([\w]+)/g;
      let match;

      while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
    }

    return exports;
  }
}

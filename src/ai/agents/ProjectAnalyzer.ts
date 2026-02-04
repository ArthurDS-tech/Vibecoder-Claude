/**
 * ProjectAnalyzer - Analisa o contexto do projeto antes de gerar código
 * Previne erros como criar arquivos C# em projetos Node.js
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ProjectAnalysis {
  primaryLanguages: string[];
  frameworks: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'none';
  hasTypeScript: boolean;
  hasCSharp: boolean;
  hasJava: boolean;
  hasPython: boolean;
  projectType: 'node' | 'dotnet' | 'java' | 'python' | 'mixed' | 'unknown';
  warnings: string[];
  recommendations: string[];
}

export interface LanguageCompatibility {
  requestedLanguage: string;
  isCompatible: boolean;
  reason: string;
  alternatives: string[];
}

export class ProjectAnalyzer {
  constructor(private projectRoot: string) {}

  /**
   * Analisa o projeto completo
   */
  async analyzeProject(): Promise<ProjectAnalysis> {
    const analysis: ProjectAnalysis = {
      primaryLanguages: [],
      frameworks: [],
      packageManager: 'none',
      hasTypeScript: false,
      hasCSharp: false,
      hasJava: false,
      hasPython: false,
      projectType: 'unknown',
      warnings: [],
      recommendations: [],
    };

    // Detectar package.json (Node.js)
    const hasPackageJson = fs.existsSync(path.join(this.projectRoot, 'package.json'));
    if (hasPackageJson) {
      analysis.packageManager = this.detectPackageManager();
      analysis.projectType = 'node';
      analysis.primaryLanguages.push('JavaScript');

      const packageJson = this.readPackageJson();
      if (packageJson) {
        this.analyzePackageJson(packageJson, analysis);
      }
    }

    // Detectar .csproj (C#/.NET)
    const csprojFiles = this.findFiles('*.csproj');
    if (csprojFiles.length > 0) {
      analysis.hasCSharp = true;
      analysis.primaryLanguages.push('C#');
      if (analysis.projectType === 'node') {
        analysis.projectType = 'mixed';
      } else {
        analysis.projectType = 'dotnet';
      }
    }

    // Detectar pom.xml ou build.gradle (Java)
    const hasPomXml = fs.existsSync(path.join(this.projectRoot, 'pom.xml'));
    const hasBuildGradle = fs.existsSync(path.join(this.projectRoot, 'build.gradle'));
    if (hasPomXml || hasBuildGradle) {
      analysis.hasJava = true;
      analysis.primaryLanguages.push('Java');
      if (analysis.projectType === 'node') {
        analysis.projectType = 'mixed';
      } else {
        analysis.projectType = 'java';
      }
    }

    // Detectar requirements.txt ou setup.py (Python)
    const hasRequirements = fs.existsSync(path.join(this.projectRoot, 'requirements.txt'));
    const hasSetupPy = fs.existsSync(path.join(this.projectRoot, 'setup.py'));
    if (hasRequirements || hasSetupPy) {
      analysis.hasPython = true;
      analysis.primaryLanguages.push('Python');
      if (analysis.projectType === 'node') {
        analysis.projectType = 'mixed';
      } else {
        analysis.projectType = 'python';
      }
    }

    // Detectar TypeScript
    const hasTsConfig = fs.existsSync(path.join(this.projectRoot, 'tsconfig.json'));
    if (hasTsConfig) {
      analysis.hasTypeScript = true;
      if (!analysis.primaryLanguages.includes('TypeScript')) {
        analysis.primaryLanguages.push('TypeScript');
      }
    }

    // Analisar arquivos existentes
    this.analyzeExistingFiles(analysis);

    // Gerar recomendações
    this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Verifica compatibilidade de linguagem com o projeto
   */
  checkLanguageCompatibility(
    requestedLanguage: string,
    analysis: ProjectAnalysis
  ): LanguageCompatibility {
    const normalizedLang = this.normalizeLanguage(requestedLanguage);

    // Projeto Node.js/TypeScript
    if (analysis.projectType === 'node') {
      if (normalizedLang === 'csharp') {
        return {
          requestedLanguage,
          isCompatible: false,
          reason: 'Este é um projeto Node.js/TypeScript. C# não é compatível com a stack atual.',
          alternatives: ['TypeScript', 'JavaScript'],
        };
      }
      if (normalizedLang === 'java') {
        return {
          requestedLanguage,
          isCompatible: false,
          reason: 'Este é um projeto Node.js/TypeScript. Java não é compatível com a stack atual.',
          alternatives: ['TypeScript', 'JavaScript'],
        };
      }
      if (normalizedLang === 'python') {
        return {
          requestedLanguage,
          isCompatible: false,
          reason: 'Este é um projeto Node.js/TypeScript. Python não é compatível com a stack atual.',
          alternatives: ['TypeScript', 'JavaScript'],
        };
      }
    }

    // Projeto .NET
    if (analysis.projectType === 'dotnet') {
      if (normalizedLang === 'javascript' || normalizedLang === 'typescript') {
        return {
          requestedLanguage,
          isCompatible: false,
          reason: 'Este é um projeto .NET/C#. JavaScript/TypeScript não é compatível com a stack atual.',
          alternatives: ['C#'],
        };
      }
    }

    // Projeto Java
    if (analysis.projectType === 'java') {
      if (normalizedLang === 'javascript' || normalizedLang === 'typescript') {
        return {
          requestedLanguage,
          isCompatible: false,
          reason: 'Este é um projeto Java. JavaScript/TypeScript não é compatível com a stack atual.',
          alternatives: ['Java'],
        };
      }
    }

    // Compatível
    return {
      requestedLanguage,
      isCompatible: true,
      reason: `${requestedLanguage} é compatível com este projeto ${analysis.projectType}`,
      alternatives: [],
    };
  }

  /**
   * Detecta gerenciador de pacotes
   */
  private detectPackageManager(): 'npm' | 'yarn' | 'pnpm' | 'none' {
    if (fs.existsSync(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.join(this.projectRoot, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fs.existsSync(path.join(this.projectRoot, 'package-lock.json'))) {
      return 'npm';
    }
    return 'none';
  }

  /**
   * Lê package.json
   */
  private readPackageJson(): any {
    try {
      const content = fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Analisa package.json
   */
  private analyzePackageJson(packageJson: any, analysis: ProjectAnalysis): void {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Detectar frameworks
    if (allDeps['react']) analysis.frameworks.push('React');
    if (allDeps['vue']) analysis.frameworks.push('Vue');
    if (allDeps['angular']) analysis.frameworks.push('Angular');
    if (allDeps['express']) analysis.frameworks.push('Express');
    if (allDeps['next']) analysis.frameworks.push('Next.js');
    if (allDeps['nest']) analysis.frameworks.push('NestJS');

    // Detectar TypeScript
    if (allDeps['typescript']) {
      analysis.hasTypeScript = true;
      if (!analysis.primaryLanguages.includes('TypeScript')) {
        analysis.primaryLanguages.push('TypeScript');
      }
    }
  }

  /**
   * Analisa arquivos existentes
   */
  private analyzeExistingFiles(analysis: ProjectAnalysis): void {
    const files = this.getAllFiles(this.projectRoot, 0, 2); // Max depth 2

    const extensions = new Map<string, number>();
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      extensions.set(ext, (extensions.get(ext) || 0) + 1);
    }

    // Contar arquivos por tipo
    const tsFiles = (extensions.get('.ts') || 0) + (extensions.get('.tsx') || 0);
    const jsFiles = (extensions.get('.js') || 0) + (extensions.get('.jsx') || 0);
    const csFiles = extensions.get('.cs') || 0;
    const javaFiles = extensions.get('.java') || 0;
    const pyFiles = extensions.get('.py') || 0;

    // Adicionar avisos se houver mistura estranha
    if (analysis.projectType === 'node' && csFiles > 0) {
      analysis.warnings.push(
        `Encontrados ${csFiles} arquivos C# em um projeto Node.js. Isso pode indicar incompatibilidade.`
      );
    }

    if (analysis.projectType === 'dotnet' && (tsFiles > 0 || jsFiles > 0)) {
      analysis.warnings.push(
        `Encontrados ${tsFiles + jsFiles} arquivos JS/TS em um projeto .NET. Verifique se isso é intencional.`
      );
    }
  }

  /**
   * Gera recomendações
   */
  private generateRecommendations(analysis: ProjectAnalysis): void {
    if (analysis.projectType === 'node' && !analysis.hasTypeScript) {
      analysis.recommendations.push(
        'Considere adicionar TypeScript ao projeto para melhor type safety e developer experience.'
      );
    }

    if (analysis.projectType === 'node' && analysis.frameworks.length === 0) {
      analysis.recommendations.push(
        'Nenhum framework detectado. Considere usar Express, NestJS ou outro framework para estruturar melhor o projeto.'
      );
    }

    if (analysis.projectType === 'mixed') {
      analysis.recommendations.push(
        'Projeto com múltiplas linguagens detectado. Certifique-se de que a arquitetura suporta essa complexidade.'
      );
    }
  }

  /**
   * Normaliza nome da linguagem
   */
  private normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase().trim();
    
    if (normalized.includes('c#') || normalized.includes('csharp')) return 'csharp';
    if (normalized.includes('typescript') || normalized.includes('ts')) return 'typescript';
    if (normalized.includes('javascript') || normalized.includes('js')) return 'javascript';
    if (normalized.includes('java')) return 'java';
    if (normalized.includes('python') || normalized.includes('py')) return 'python';
    
    return normalized;
  }

  /**
   * Encontra arquivos por padrão
   */
  private findFiles(pattern: string): string[] {
    const files: string[] = [];
    const regex = new RegExp(pattern.replace('*', '.*'));

    const search = (dir: string, depth: number = 0) => {
      if (depth > 3) return; // Limitar profundidade

      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (item === 'node_modules' || item === '.git') continue;

          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            search(fullPath, depth + 1);
          } else if (regex.test(item)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Ignorar erros de permissão
      }
    };

    search(this.projectRoot);
    return files;
  }

  /**
   * Obtém todos os arquivos
   */
  private getAllFiles(dir: string, depth: number, maxDepth: number): string[] {
    if (depth > maxDepth) return [];

    const files: string[] = [];

    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === 'out' || item === 'dist') {
          continue;
        }

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath, depth + 1, maxDepth));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorar erros
    }

    return files;
  }
}

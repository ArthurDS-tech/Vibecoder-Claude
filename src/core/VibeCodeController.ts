import { AIEngine, AIConfig } from '../ai/engine/AIEngine';
import { Planner, Plan } from '../ai/agents/Planner';
import { Coder, CodeGenerationResult } from '../ai/agents/Coder';
import { Reviewer, ReviewResult } from '../ai/agents/Reviewer';
import { ProjectMemory } from '../ai/memory/ProjectMemory';
import { CodeContextCollector, ProjectContext } from '../ai/agents/CodeContextCollector';
import { FilePathExtractor } from '../ai/utils/FilePathExtractor';
import * as path from 'path';

export interface VibeCodeConfig {
  ai: AIConfig;
  projectRoot: string;
}

export class VibeCodeController {
  private ai: AIEngine;
  private planner: Planner;
  private coder: Coder;
  private reviewer: Reviewer;
  private memory: ProjectMemory;
  private contextCollector: CodeContextCollector;
  private fileExtractor: FilePathExtractor;
  private projectRoot: string;

  constructor(config: VibeCodeConfig) {
    this.ai = new AIEngine(config.ai);
    this.planner = new Planner(this.ai, config.projectRoot);
    this.coder = new Coder(this.ai);
    this.reviewer = new Reviewer(this.ai);
    this.memory = new ProjectMemory(config.projectRoot);
    this.contextCollector = new CodeContextCollector(config.projectRoot);
    this.fileExtractor = new FilePathExtractor(config.projectRoot);
    this.projectRoot = config.projectRoot;
  }

  async processIntent(intent: string): Promise<{
    plan: Plan;
    result: CodeGenerationResult;
    review: ReviewResult;
    context: ProjectContext;
  }> {
    console.log('🧠 Processando intenção...');
    
    // 1. Criar plano (agora com detecção de arquivos explícitos)
    const memoryContext = this.memory.getContext();
    const plan = await this.planner.createPlan(intent, memoryContext);
    console.log('📋 Plano criado:', plan.goal);

    // 2. Determinar arquivos alvo (priorizar explícitos)
    let targetFiles = plan.steps.flatMap(step => step.files);
    
    // Se usuário especificou arquivos explicitamente, USAR ESSES
    if (plan.explicitFiles && plan.explicitFiles.length > 0) {
      targetFiles = plan.explicitFiles.map(f => {
        // Se o caminho já está dentro do projeto, usar relativo
        // Se está fora, usar o normalizado
        const relativePath = path.relative(this.projectRoot, f.normalizedPath);
        
        // Se o caminho relativo começa com "..", está fora do projeto
        // Nesse caso, usar o normalizedPath diretamente
        if (relativePath.startsWith('..')) {
          return f.normalizedPath;
        }
        
        return relativePath;
      });
      console.log('📌 Arquivos explícitos detectados:', targetFiles);
    }

    // 3. Coletar CONTEXTO COMPLETO do projeto
    const projectContext = await this.contextCollector.collectContext(
      intent, 
      targetFiles,
      plan.explicitFiles // Passar arquivos explícitos
    );

    // 4. Construir contexto enriquecido para a IA
    const enrichedContext = this.buildEnrichedContext(
      memoryContext, 
      projectContext,
      plan.explicitFiles // Adicionar info sobre arquivos explícitos
    );

    // 5. Gerar código com CONTEXTO COMPLETO
    const result = await this.coder.generateCode(
      intent,
      projectContext.relatedFiles,
      enrichedContext
    );
    
    console.log('💻 Código gerado:', result.changes.length, 'mudanças');
    console.log('📝 Explicação:', result.explanation.substring(0, 100) + '...');

    // 6. Revisar
    const review = await this.reviewer.review(result.changes, enrichedContext);
    console.log('🔍 Revisão completa:', review.approved ? '✅' : '❌');

    return { plan, result, review, context: projectContext };
  }

  /**
   * Constrói contexto enriquecido com TODAS as informações do projeto
   */
  private buildEnrichedContext(
    memoryContext: string, 
    projectContext: ProjectContext,
    explicitFiles?: any[]
  ): string {
    let context = `${memoryContext}\n\n`;

    context += `=== CONTEXTO COMPLETO DO PROJETO ===\n\n`;

    // IMPORTANTE: Informar sobre arquivos explícitos
    if (explicitFiles && explicitFiles.length > 0) {
      context += `🎯 ARQUIVOS ESPECIFICADOS PELO USUÁRIO (EDITE ESTES!):\n`;
      explicitFiles.forEach(f => {
        context += `- ${f.originalPath} → ${f.normalizedPath}\n`;
        context += `  Status: ${f.exists ? '✅ Existe' : '❌ Não existe (criar)'}\n`;
      });
      context += `\n⚠️  IMPORTANTE: Você DEVE editar/criar ESTES arquivos específicos!\n`;
      context += `NÃO crie arquivos diferentes ou ignore os especificados!\n\n`;
    }

    // Configurações do projeto
    context += `📦 CONFIGURAÇÕES:\n`;
    context += `- TypeScript: ${projectContext.projectConfig.hasTypeScript ? 'Sim' : 'Não'}\n`;
    context += `- ESLint: ${projectContext.projectConfig.hasESLint ? 'Sim' : 'Não'}\n`;
    context += `- Prettier: ${projectContext.projectConfig.hasPrettier ? 'Sim' : 'Não'}\n`;
    context += `- Package Manager: ${projectContext.projectConfig.packageManager}\n`;
    
    if (projectContext.projectConfig.frameworks.length > 0) {
      context += `- Frameworks: ${projectContext.projectConfig.frameworks.join(', ')}\n`;
    }

    // Padrões de código
    context += `\n🎨 PADRÕES DE CÓDIGO (SIGA RIGOROSAMENTE):\n`;
    context += `- Naming: ${projectContext.codePatterns.namingConvention}\n`;
    context += `- Indentação: ${projectContext.codePatterns.indentation} (${projectContext.codePatterns.indentSize} espaços)\n`;
    context += `- Aspas: ${projectContext.codePatterns.quotes}\n`;
    context += `- Ponto e vírgula: ${projectContext.codePatterns.semicolons ? 'Sim' : 'Não'}\n`;
    context += `- Async: ${projectContext.codePatterns.asyncStyle}\n`;

    // Imports comuns
    if (projectContext.commonImports.length > 0) {
      context += `\n📚 IMPORTS COMUNS (use estes quando apropriado):\n`;
      projectContext.commonImports.forEach(imp => {
        context += `- ${imp}\n`;
      });
    }

    // Padrões comuns
    if (projectContext.commonPatterns.length > 0) {
      context += `\n🔧 PADRÕES COMUNS (siga estes):\n`;
      projectContext.commonPatterns.forEach(pattern => {
        context += `- ${pattern}\n`;
      });
    }

    // Estrutura do projeto
    context += `\n📁 ESTRUTURA DO PROJETO:\n`;
    context += `- Total de arquivos: ${projectContext.projectStructure.totalFiles}\n`;
    context += `- Tipos de arquivo: ${Object.keys(projectContext.projectStructure.filesByType).join(', ')}\n`;

    // Arquivos similares para referência
    if (projectContext.similarFiles.length > 0) {
      context += `\n📄 ARQUIVOS SIMILARES (use como referência):\n`;
      projectContext.similarFiles.forEach(file => {
        context += `\nArquivo: ${file.path}\n`;
        context += `Imports: ${file.imports?.join(', ') || 'nenhum'}\n`;
        context += `Exports: ${file.exports?.join(', ') || 'nenhum'}\n`;
        context += `\`\`\`${file.language}\n${file.content.substring(0, 500)}...\n\`\`\`\n`;
      });
    }

    context += `\n=== FIM DO CONTEXTO ===\n`;

    return context;
  }

  getMemory(): ProjectMemory {
    return this.memory;
  }

  getProjectRoot(): string {
    return this.projectRoot;
  }
}

import { AIEngine, AIMessage } from '../engine/AIEngine';
import { ProjectAnalyzer, ProjectAnalysis } from './ProjectAnalyzer';
import { FilePathExtractor, ExtractedFile } from '../utils/FilePathExtractor';

export interface PlanStep {
  description: string;
  files: string[];
  risks: string[];
}

export interface Plan {
  goal: string;
  steps: PlanStep[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  warnings: string[];
  languageCompatibility?: {
    isCompatible: boolean;
    reason?: string;
    alternatives?: string[];
  };
  explicitFiles?: ExtractedFile[];
}

export class Planner {
  private analyzer?: ProjectAnalyzer;
  private fileExtractor?: FilePathExtractor;

  constructor(private ai: AIEngine, projectRoot?: string) {
    if (projectRoot) {
      this.analyzer = new ProjectAnalyzer(projectRoot);
      this.fileExtractor = new FilePathExtractor(projectRoot);
    }
  }

  async createPlan(intent: string, context: string): Promise<Plan> {
    // PRIMEIRO: Extrair arquivos explicitamente mencionados pelo usuário
    let explicitFiles: ExtractedFile[] = [];
    if (this.fileExtractor) {
      explicitFiles = this.fileExtractor.extractFilePaths(intent);
      
      // Verificar se arquivos existem
      for (const file of explicitFiles) {
        if (!file.exists) {
          console.warn(`⚠️  Arquivo especificado não encontrado: ${file.originalPath}`);
        }
      }
    }
    // Analisar projeto primeiro
    let projectAnalysis: ProjectAnalysis | null = null;
    if (this.analyzer) {
      projectAnalysis = await this.analyzer.analyzeProject();
    }

    // Detectar linguagem solicitada no intent
    const requestedLanguage = this.detectRequestedLanguage(intent);

    // Verificar compatibilidade
    let compatibilityWarning: string | null = null;
    if (projectAnalysis && requestedLanguage) {
      const compatibility = this.analyzer!.checkLanguageCompatibility(
        requestedLanguage,
        projectAnalysis
      );

      if (!compatibility.isCompatible) {
        compatibilityWarning = `⚠️ AVISO DE INCOMPATIBILIDADE: ${compatibility.reason}\n\nAlternativas recomendadas: ${compatibility.alternatives.join(', ')}`;
      }
    }

    // Construir contexto enriquecido
    const enrichedContext = this.buildEnrichedContext(context, projectAnalysis, compatibilityWarning);

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Você é o Planner do VibeCode. Sua função é analisar a intenção do usuário e criar um plano detalhado ANTES de gerar código.

IMPORTANTE: Você DEVE respeitar a stack tecnológica do projeto!

Você deve:
1. Entender o objetivo
2. VERIFICAR se a linguagem solicitada é compatível com o projeto
3. Listar arquivos que serão afetados
4. Identificar riscos (incluindo incompatibilidades de linguagem)
5. Propor arquitetura
6. Estimar complexidade
7. AVISAR sobre incompatibilidades

Responda SEMPRE em JSON no formato:
{
  "goal": "descrição clara do objetivo",
  "steps": [
    {
      "description": "o que será feito",
      "files": ["arquivo1.ts", "arquivo2.ts"],
      "risks": ["risco potencial"]
    }
  ],
  "estimatedComplexity": "low|medium|high",
  "warnings": ["avisos importantes", "incompatibilidades detectadas"]
}

Se houver incompatibilidade de linguagem, ADICIONE aos warnings e sugira alternativas.`,
      },
      {
        role: 'user',
        content: `Intenção: ${intent}\n\n${enrichedContext}`,
      },
    ];

    const response = await this.ai.chat(messages);
    
    try {
      const plan: Plan = JSON.parse(response.content);

      // FORÇAR arquivos explícitos se o usuário especificou
      if (explicitFiles.length > 0) {
        plan.explicitFiles = explicitFiles;
        
        // Substituir arquivos do plano pelos explícitos
        // Usar apenas o nome do arquivo para evitar problemas de caminho
        const explicitPaths = explicitFiles.map(f => f.fileName);
        plan.steps.forEach(step => {
          if (step.files.length === 0 || !step.files.some(f => explicitPaths.includes(f))) {
            step.files = explicitPaths;
          }
        });

        // Adicionar aviso se arquivo não existe
        const nonExistent = explicitFiles.filter(f => !f.exists);
        if (nonExistent.length > 0) {
          plan.warnings = plan.warnings || [];
          nonExistent.forEach(f => {
            plan.warnings.push(`⚠️  Arquivo especificado não encontrado: ${f.originalPath}`);
          });
        }
      }

      // Adicionar aviso de compatibilidade se necessário
      if (compatibilityWarning) {
        plan.warnings = plan.warnings || [];
        if (!plan.warnings.some(w => w.includes('INCOMPATIBILIDADE'))) {
          plan.warnings.unshift(compatibilityWarning);
        }

        plan.languageCompatibility = {
          isCompatible: false,
          reason: compatibilityWarning,
          alternatives: projectAnalysis?.primaryLanguages || [],
        };
      }

      return plan;
    } catch (error) {
      throw new Error('Failed to parse plan from AI response');
    }
  }

  /**
   * Detecta linguagem solicitada no intent
   */
  private detectRequestedLanguage(intent: string): string | null {
    const intentLower = intent.toLowerCase();

    if (intentLower.includes('c#') || intentLower.includes('csharp')) return 'C#';
    if (intentLower.includes('java') && !intentLower.includes('javascript')) return 'Java';
    if (intentLower.includes('python') || intentLower.includes('.py')) return 'Python';
    if (intentLower.includes('typescript') || intentLower.includes('.ts')) return 'TypeScript';
    if (intentLower.includes('javascript') || intentLower.includes('.js')) return 'JavaScript';
    if (intentLower.includes('go') || intentLower.includes('golang')) return 'Go';
    if (intentLower.includes('rust') || intentLower.includes('.rs')) return 'Rust';

    return null;
  }

  /**
   * Constrói contexto enriquecido com análise do projeto
   */
  private buildEnrichedContext(
    originalContext: string,
    analysis: ProjectAnalysis | null,
    compatibilityWarning: string | null
  ): string {
    let enriched = `Contexto do projeto:\n${originalContext}\n\n`;

    if (analysis) {
      enriched += `=== ANÁLISE DO PROJETO ===\n`;
      enriched += `Tipo de projeto: ${analysis.projectType}\n`;
      enriched += `Linguagens principais: ${analysis.primaryLanguages.join(', ')}\n`;
      
      if (analysis.frameworks.length > 0) {
        enriched += `Frameworks: ${analysis.frameworks.join(', ')}\n`;
      }

      if (analysis.hasTypeScript) {
        enriched += `TypeScript: Sim\n`;
      }

      enriched += `Gerenciador de pacotes: ${analysis.packageManager}\n`;

      if (analysis.warnings.length > 0) {
        enriched += `\nAvisos do projeto:\n`;
        analysis.warnings.forEach(w => enriched += `- ${w}\n`);
      }

      if (analysis.recommendations.length > 0) {
        enriched += `\nRecomendações:\n`;
        analysis.recommendations.forEach(r => enriched += `- ${r}\n`);
      }

      enriched += `\n`;
    }

    if (compatibilityWarning) {
      enriched += `\n${compatibilityWarning}\n\n`;
    }

    return enriched;
  }
}

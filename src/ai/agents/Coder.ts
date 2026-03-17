import { AIEngine, AIMessage } from '../engine/AIEngine';
import { FileContext } from './CodeContextCollector';

export interface CodeChange {
  file: string;
  content: string;
  description: string;
  type: 'create' | 'modify' | 'delete';
  originalContent?: string;
}

export interface CodeGenerationResult {
  changes: CodeChange[];
  explanation: string;
  warnings: string[];
  suggestions: string[];
}

export class Coder {
  constructor(private readonly ai: AIEngine) {}

  async generateCode(
    intent: string,
    files: FileContext[],
    projectContext: string
  ): Promise<CodeGenerationResult> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Você é o Coder do VibeCode. Gere mudanças de código precisas e aplicáveis.

Responda SEMPRE em JSON no formato:
{
  "changes": [
    {
      "file": "src/example.ts",
      "content": "conteúdo completo do arquivo",
      "description": "motivo da mudança",
      "type": "create|modify|delete",
      "originalContent": "opcional para diffs"
    }
  ],
  "explanation": "resumo técnico",
  "warnings": ["aviso opcional"],
  "suggestions": ["próximo passo opcional"]
}`,
      },
      {
        role: 'user',
        content: `Intenção: ${intent}

Arquivos relacionados:
${JSON.stringify(files, null, 2)}

Contexto do projeto:
${projectContext}`,
      },
    ];

    const response = await this.ai.chat(messages);

    try {
      const parsed = JSON.parse(response.content) as Partial<CodeGenerationResult>;

      return {
        changes: parsed.changes || [],
        explanation: parsed.explanation || '',
        warnings: parsed.warnings || [],
        suggestions: parsed.suggestions || [],
      };
    } catch {
      throw new Error('Failed to parse code generation result from AI response');
    }
  }
}

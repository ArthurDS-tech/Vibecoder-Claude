import { AIEngine, AIMessage } from '../engine/AIEngine';
// import { CodeChange } from './Coder';

// Temporary type definition for CodeChange
export interface CodeChange {
  file: string;
  changes: string;
  explanation: string;
  type: 'create' | 'modify' | 'delete';
}

export interface ReviewResult {
  approved: boolean;
  issues: ReviewIssue[];
  suggestions: string[];
}

export interface ReviewIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
}

export class Reviewer {
  constructor(private ai: AIEngine) {}

  async review(changes: CodeChange[], projectContext: string): Promise<ReviewResult> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Você é o Reviewer do VibeCode. Sua função é revisar código gerado antes de aplicá-lo.

Você deve verificar:
1. Qualidade do código
2. Padrões do projeto
3. Possíveis bugs
4. Performance
5. Segurança

Responda SEMPRE em JSON no formato:
{
  "approved": true|false,
  "issues": [
    {
      "severity": "error|warning|info",
      "message": "descrição do problema",
      "file": "arquivo.ts",
      "line": 42
    }
  ],
  "suggestions": ["sugestão de melhoria"]
}`,
      },
      {
        role: 'user',
        content: `Mudanças propostas:\n${JSON.stringify(changes, null, 2)}\n\nContexto do projeto:\n${projectContext}\n\nRevise o código.`,
      },
    ];

    const response = await this.ai.chat(messages);
    
    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error('Failed to parse review from AI response');
    }
  }
}

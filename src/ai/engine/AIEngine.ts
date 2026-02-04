import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface AIConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export class AIEngine {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    
    if (config.provider === 'openai') {
      this.openai = new OpenAI({ apiKey: config.apiKey });
    } else {
      this.anthropic = new Anthropic({ apiKey: config.apiKey });
    }
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    if (this.config.provider === 'openai') {
      return this.chatOpenAI(messages);
    } else {
      return this.chatAnthropic(messages);
    }
  }

  private async chatOpenAI(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.openai) throw new Error('OpenAI not initialized');

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: messages as any,
    });

    return {
      content: response.choices[0].message.content || '',
      tokens: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  }

  private async chatAnthropic(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');

    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    // Use maxTokens from config, default to 4096 for Haiku compatibility
    const maxTokens = this.config.maxTokens || 4096;

    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: maxTokens,
      system: systemMessage?.content,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return {
      content: text,
      tokens: {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
}

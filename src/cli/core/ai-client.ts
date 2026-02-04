import { AIEngine, AIMessage } from '../../ai/engine/AIEngine';
import { ConfigManager } from './config';
import { AIError } from '../utils/errors';
import { AIConfig } from '../../ai/engine/AIEngine';

export class AIClient {
  private engine: AIEngine | null = null;
  private lastModel?: string;

  constructor(private configManager: ConfigManager) {}

  private async getEngine(): Promise<AIEngine> {
    // SEMPRE recarregar config e recriar engine
    const config = await this.configManager.load();

    if (!config.apiKey) {
      throw new AIError('API key not configured');
    }

    // SEMPRE recriar engine para garantir modelo atualizado
    this.engine = new AIEngine({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      maxTokens: config.maxTokens || 4096,
    });
    this.lastModel = config.model;

    return this.engine;
  }

  async chat(messages: AIMessage[]): Promise<string> {
    try {
      const engine = await this.getEngine();
      const response = await engine.chat(messages);
      
      // Estimar tokens usados (aproximação)
      const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0) + response.content.length;
      const estimatedTokens = Math.ceil(totalChars / 4); // Aproximação: 1 token ≈ 4 caracteres
      
      // Rastrear uso
      await this.configManager.trackTokenUsage(estimatedTokens, 'chat');
      
      return response.content;
    } catch (error) {
      if (error instanceof Error) {
        throw new AIError(`AI request failed: ${error.message}`);
      }
      throw new AIError('AI request failed with unknown error');
    }
  }

  async ask(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: AIMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.chat(messages);
    
    // Rastrear com comando específico
    const totalChars = prompt.length + (systemPrompt?.length || 0) + response.length;
    const estimatedTokens = Math.ceil(totalChars / 4);
    await this.configManager.trackTokenUsage(estimatedTokens, 'ask');
    
    return response;
  }
}

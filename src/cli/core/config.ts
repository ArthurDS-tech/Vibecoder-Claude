import { cosmiconfig } from 'cosmiconfig';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigError } from '../utils/errors';

export interface VibeCodeConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
  excludePatterns?: string[];
  tokenUsage?: {
    totalTokens: number;
    totalCost: number;
    lastReset: string;
    history: Array<{
      timestamp: string;
      tokens: number;
      cost: number;
      command: string;
    }>;
  };
}

const DEFAULT_CONFIG: Partial<VibeCodeConfig> = {
  provider: 'openai',
  model: 'gpt-4',
  maxTokens: 4096,
  temperature: 0.7,
  excludePatterns: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'out/**',
    '*.log',
    '.env*',
  ],
  tokenUsage: {
    totalTokens: 0,
    totalCost: 0,
    lastReset: new Date().toISOString(),
    history: [],
  },
};

export class ConfigManager {
  private config: VibeCodeConfig | null = null;
  private configPath: string | null = null;

  async load(): Promise<VibeCodeConfig> {
    // Always reload from file to avoid cache issues
    const explorer = cosmiconfig('vibecode', {
      cache: false, // Disable cache completely
      searchPlaces: [
        '.vibecoderc.json',
        '.vibecoderc',
        'vibecode.config.js',
        // Buscar também no home do usuário
        path.join(os.homedir(), '.vibecoderc.json'),
        path.join(os.homedir(), '.vibecoderc'),
      ],
    });
    
    // Tentar buscar a partir do diretório atual
    let result = await explorer.search(process.cwd());
    
    // Se não encontrou, tentar buscar no diretório do projeto VibeCode
    if (!result) {
      const vibecodePath = path.resolve(__dirname, '../../..');
      result = await explorer.search(vibecodePath);
    }
    
    // Se ainda não encontrou, tentar no home do usuário
    if (!result) {
      const homeConfig = path.join(os.homedir(), '.vibecoderc.json');
      if (fs.existsSync(homeConfig)) {
        const configContent = JSON.parse(fs.readFileSync(homeConfig, 'utf-8'));
        result = { config: configContent, filepath: homeConfig };
      }
    }
    
    if (result) {
      this.config = { ...DEFAULT_CONFIG, ...result.config } as VibeCodeConfig;
      this.configPath = result.filepath;
    } else {
      this.config = DEFAULT_CONFIG as VibeCodeConfig;
    }

    // Override with environment variables
    if (process.env.OPENAI_API_KEY) {
      this.config.apiKey = process.env.OPENAI_API_KEY;
      this.config.provider = 'openai';
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.config.apiKey = process.env.ANTHROPIC_API_KEY;
      this.config.provider = 'anthropic';
    }

    if (!this.config.apiKey) {
      throw new ConfigError(
        'No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable, or run: vibecode config set apiKey YOUR_KEY'
      );
    }

    return this.config;
  }

  async save(updates: Partial<VibeCodeConfig>): Promise<void> {
    const configPath = path.join(process.cwd(), '.vibecoderc.json');
    
    let existing: Partial<VibeCodeConfig> = {};
    if (fs.existsSync(configPath)) {
      existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    const newConfig = { ...existing, ...updates };
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    
    // Force reload on next access
    this.config = null;
  }

  async reload(): Promise<VibeCodeConfig> {
    this.config = null;
    return this.load();
  }

  async get(key: keyof VibeCodeConfig): Promise<any> {
    const config = await this.load();
    return config[key];
  }

  async set(key: keyof VibeCodeConfig, value: any): Promise<void> {
    await this.save({ [key]: value });
  }

  async trackTokenUsage(tokens: number, command: string): Promise<void> {
    const config = await this.load();
    
    if (!config.tokenUsage) {
      config.tokenUsage = {
        totalTokens: 0,
        totalCost: 0,
        lastReset: new Date().toISOString(),
        history: [],
      };
    }
    
    // Calcular custo baseado no provider e modelo
    let cost = 0;
    if (config.provider === 'anthropic') {
      // Claude 3.5 Sonnet: $3 per million input tokens, $15 per million output tokens
      // Estimativa: 70% input, 30% output
      const inputTokens = tokens * 0.7;
      const outputTokens = tokens * 0.3;
      cost = (inputTokens / 1000000 * 3) + (outputTokens / 1000000 * 15);
    } else if (config.provider === 'openai') {
      // GPT-4: $30 per million input tokens, $60 per million output tokens
      const inputTokens = tokens * 0.7;
      const outputTokens = tokens * 0.3;
      cost = (inputTokens / 1000000 * 30) + (outputTokens / 1000000 * 60);
    }
    
    config.tokenUsage.totalTokens += tokens;
    config.tokenUsage.totalCost += cost;
    config.tokenUsage.history.push({
      timestamp: new Date().toISOString(),
      tokens,
      cost,
      command,
    });
    
    // Manter apenas os últimos 100 registros
    if (config.tokenUsage.history.length > 100) {
      config.tokenUsage.history = config.tokenUsage.history.slice(-100);
    }
    
    await this.save(config);
  }
  
  async resetTokenUsage(): Promise<void> {
    const config = await this.load();
    config.tokenUsage = {
      totalTokens: 0,
      totalCost: 0,
      lastReset: new Date().toISOString(),
      history: [],
    };
    await this.save(config);
  }
  
  async getTokenUsage(): Promise<VibeCodeConfig['tokenUsage']> {
    const config = await this.load();
    return config.tokenUsage || {
      totalTokens: 0,
      totalCost: 0,
      lastReset: new Date().toISOString(),
      history: [],
    };
  }
}

/**
 * Helper function to load config quickly
 */
export async function loadConfig(): Promise<VibeCodeConfig> {
  const manager = new ConfigManager();
  return await manager.load();
}

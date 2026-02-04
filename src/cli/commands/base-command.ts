import { AIClient } from '../core/ai-client';
import { ConfigManager } from '../core/config';
import { ContextBuilder } from '../core/context';
import { ProjectMemory } from '../../ai/memory/ProjectMemory';
import { OutputFormatter } from '../utils/formatters';
import ora, { Ora } from 'ora';

/**
 * Base class for all commands
 * Provides common functionality and enforces structure
 */
export abstract class BaseCommand {
  protected spinner: Ora | null = null;

  constructor(
    protected aiClient: AIClient,
    protected configManager: ConfigManager,
    protected contextBuilder: ContextBuilder,
    protected memory: ProjectMemory,
    protected currentDir: string
  ) {}

  /**
   * Execute the command
   */
  abstract execute(...args: any[]): Promise<void>;

  /**
   * Get command description
   */
  abstract getDescription(): string;

  /**
   * Get command usage
   */
  abstract getUsage(): string;

  /**
   * Start spinner with message
   */
  protected startSpinner(message: string): void {
    this.spinner = ora(message).start();
  }

  /**
   * Stop spinner
   */
  protected stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: unknown): void {
    this.stopSpinner();
    
    if (error instanceof Error) {
      console.log(OutputFormatter.error(error.message));
    } else {
      console.log(OutputFormatter.error('Erro desconhecido'));
    }
  }

  /**
   * Log success message
   */
  protected logSuccess(message: string): void {
    console.log(OutputFormatter.success(message));
  }

  /**
   * Log error message
   */
  protected logError(message: string): void {
    console.log(OutputFormatter.error(message));
  }

  /**
   * Log warning message
   */
  protected logWarning(message: string): void {
    console.log(OutputFormatter.warning(message));
  }

  /**
   * Log info message
   */
  protected logInfo(message: string): void {
    console.log(OutputFormatter.info(message));
  }
}

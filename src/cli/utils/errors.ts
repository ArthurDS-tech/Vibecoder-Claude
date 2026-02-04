import { Logger } from './logger';

export class CLIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'CLIError';
  }
}

export class ConfigError extends CLIError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class AIError extends CLIError {
  constructor(message: string) {
    super(message, 'AI_ERROR');
    this.name = 'AIError';
  }
}

export function handleError(error: unknown): never {
  if (error instanceof CLIError) {
    Logger.error(error.message);
    if (error.code) {
      Logger.warn(`Error code: ${error.code}`);
    }
  } else if (error instanceof Error) {
    Logger.error(`Unexpected error: ${error.message}`);
  } else {
    Logger.error('An unknown error occurred');
  }
  
  process.exit(1);
}

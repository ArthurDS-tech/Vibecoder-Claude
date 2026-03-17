export type ValidationTool = 'tsc' | 'test' | 'eslint' | 'smoke';

export type ParsedErrorType =
  | 'typescript'
  | 'test'
  | 'lint'
  | 'runtime'
  | 'unknown';

export type LoopFixStrategy =
  | 'targeted_edit'
  | 'type_adjustment'
  | 'import_repair'
  | 'guard_clause'
  | 'fallback';

export interface FileDiff {
  file: string;
  patch: string;
  summary?: string;
}

export interface ParsedError {
  file?: string;
  line?: number;
  column?: number;
  message: string;
  type: ParsedErrorType;
  code?: string;
  source: ValidationTool;
  raw: string;
}

export interface ValidationCommand {
  name: ValidationTool;
  command: string;
  required: boolean;
}

export interface ValidationResult {
  name: ValidationTool;
  passed: boolean;
  output: string;
  exitCode: number;
  durationMs?: number;
  errors: ParsedError[];
}

export interface LoopAttempt {
  attemptNumber: number;
  startedAt: string;
  finishedAt?: string;
  action: string;
  status: 'running' | 'fixed' | 'passed' | 'failed';
  strategy?: LoopFixStrategy;
  validationResults: ValidationResult[];
  errors: ParsedError[];
  diffsApplied: FileDiff[];
}

export interface LoopConfig {
  maxAttempts: number;
  validatorCommands: ValidationCommand[];
  allowedFiles: string[];
  workingDirectory: string;
  taskId?: string;
  stopOnRepeatedError?: boolean;
}

export interface LoopErrorSummary {
  totalErrors: number;
  repeatedErrors: ParsedError[];
  lastError?: ParsedError;
}

export interface LoopResult {
  success: boolean;
  attempts: LoopAttempt[];
  finalValidation: ValidationResult[];
  errorSummary: LoopErrorSummary;
  filesModified: string[];
  maxAttemptsReached: boolean;
}

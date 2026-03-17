import { exec } from 'child_process';
import { promisify } from 'util';
import { ErrorAnalyzer } from './error-analyzer';
import { FixGenerator, FixProposal } from './fix-generator';
import {
  FileDiff,
  LoopAttempt,
  LoopConfig,
  LoopResult,
  ParsedError,
  ValidationResult,
} from '../../shared/types/loop.types';

const execAsync = promisify(exec);

export interface LoopTaskContext {
  taskId: string;
  description: string;
  targetFiles: string[];
}

export interface LoopEngineHooks {
  execute(task: LoopTaskContext, attempt: number): Promise<void>;
  applyFix?(proposal: FixProposal, attempt: number): Promise<FileDiff[]>;
  logger?(message: string): void;
}

export class LoopEngine {
  private readonly errorAnalyzer = new ErrorAnalyzer();
  private readonly fixGenerator = new FixGenerator();

  constructor(
    private readonly config: LoopConfig,
    private readonly hooks: LoopEngineHooks
  ) {}

  async run(task: LoopTaskContext): Promise<LoopResult> {
    const attempts: LoopAttempt[] = [];
    const filesModified = new Set<string>();
    const repeatedErrors: ParsedError[] = [];

    for (let attemptNumber = 1; attemptNumber <= this.config.maxAttempts; attemptNumber += 1) {
      const attempt: LoopAttempt = {
        attemptNumber,
        startedAt: new Date().toISOString(),
        action: task.description,
        status: 'running',
        validationResults: [],
        errors: [],
        diffsApplied: [],
      };

      attempts.push(attempt);

      await this.hooks.execute(task, attemptNumber);
      const validationResults = await this.runValidators();
      attempt.validationResults = validationResults;

      const errors = validationResults.flatMap((result) => result.errors);
      attempt.errors = errors;

      if (errors.length === 0 && validationResults.every((result) => result.passed)) {
        attempt.status = 'passed';
        attempt.finishedAt = new Date().toISOString();

        return {
          success: true,
          attempts,
          finalValidation: validationResults,
          errorSummary: {
            totalErrors: 0,
            repeatedErrors,
          },
          filesModified: Array.from(filesModified),
          maxAttemptsReached: false,
        };
      }

      const repeated = this.findRepeatedErrors(attempts, errors);
      repeatedErrors.push(...repeated);

      const primaryError = errors[0];
      const proposal = primaryError
        ? this.fixGenerator.generate(primaryError)
        : {
            strategy: 'fallback' as const,
            diffs: [],
            rationale: 'Validation failed without a parsed error. Inspect validator output before retrying.',
          };

      attempt.strategy = proposal.strategy;
      this.logAttempt(attemptNumber, proposal, primaryError);

      const filteredDiffs = proposal.diffs.filter((diff) =>
        this.isAllowedFile(diff.file, task.targetFiles)
      );

      if (this.hooks.applyFix && filteredDiffs.length > 0) {
        attempt.diffsApplied = await this.hooks.applyFix(
          { ...proposal, diffs: filteredDiffs },
          attemptNumber
        );
        attempt.diffsApplied.forEach((diff) => filesModified.add(diff.file));
      } else {
        attempt.diffsApplied = filteredDiffs;
        filteredDiffs.forEach((diff) => filesModified.add(diff.file));
      }

      attempt.status = attemptNumber >= this.config.maxAttempts ? 'failed' : 'fixed';
      attempt.finishedAt = new Date().toISOString();

      if (attemptNumber >= this.config.maxAttempts) {
        return {
          success: false,
          attempts,
          finalValidation: validationResults,
          errorSummary: {
            totalErrors: errors.length,
            repeatedErrors,
            lastError: primaryError,
          },
          filesModified: Array.from(filesModified),
          maxAttemptsReached: true,
        };
      }
    }

    return {
      success: false,
      attempts,
      finalValidation: [],
      errorSummary: {
        totalErrors: 0,
        repeatedErrors,
      },
      filesModified: Array.from(filesModified),
      maxAttemptsReached: true,
    };
  }

  private async runValidators(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const command of this.config.validatorCommands) {
      const startedAt = Date.now();

      try {
        const { stdout, stderr } = await execAsync(command.command, {
          cwd: this.config.workingDirectory,
        });
        const output = [stdout, stderr].filter(Boolean).join('\n');

        results.push({
          name: command.name,
          passed: true,
          output,
          exitCode: 0,
          durationMs: Date.now() - startedAt,
          errors: [],
        });
      } catch (error) {
        const executionError = error as {
          stdout?: string;
          stderr?: string;
          code?: number;
          message?: string;
        };
        const output = [executionError.stdout, executionError.stderr, executionError.message]
          .filter(Boolean)
          .join('\n');

        results.push({
          name: command.name,
          passed: false,
          output,
          exitCode: executionError.code ?? 1,
          durationMs: Date.now() - startedAt,
          errors: this.errorAnalyzer.parse(output, command.name),
        });
      }
    }

    return results;
  }

  private findRepeatedErrors(
    attempts: LoopAttempt[],
    currentErrors: ParsedError[]
  ): ParsedError[] {
    const previousKeys = new Set(
      attempts
        .slice(0, -1)
        .flatMap((attempt) => attempt.errors)
        .map((error) => this.getErrorKey(error))
    );

    return currentErrors.filter((error) => previousKeys.has(this.getErrorKey(error)));
  }

  private getErrorKey(error: ParsedError): string {
    return [
      error.source,
      error.type,
      error.file || '',
      error.line || '',
      error.column || '',
      error.code || '',
      error.message,
    ].join(':');
  }

  private isAllowedFile(file: string, taskFiles: string[]): boolean {
    const allowedFiles = this.config.allowedFiles.length > 0
      ? this.config.allowedFiles
      : taskFiles;

    return allowedFiles.length === 0 || allowedFiles.includes(file);
  }

  private logAttempt(
    attemptNumber: number,
    proposal: FixProposal,
    error?: ParsedError
  ): void {
    if (!this.hooks.logger || !error) {
      return;
    }

    const location = error.file
      ? `${error.file}:${error.line || 1}`
      : 'unknown';

    this.hooks.logger(
      `[Loop ${attemptNumber}/${this.config.maxAttempts}] Fixed: ${location} - ${proposal.rationale}`
    );
  }
}

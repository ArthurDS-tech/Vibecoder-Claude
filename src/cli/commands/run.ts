import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { LoopEngine } from '../../core/loop';
import { FixGenerator } from '../../core/loop/fix-generator';
import {
  LoopConfig,
  ValidationCommand,
} from '../../shared/types/loop.types';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

export function createRunCommand(): Command {
  const command = new Command('doctor');

  command
    .description('Validate the current project and analyze failures with the runtime engine')
    .alias('run')
    .option('--attempts <number>', 'Maximum validation attempts', '1')
    .action(async (options) => {
      try {
        const workingDirectory = process.cwd();
        const validatorCommands = detectValidators(workingDirectory);

        if (validatorCommands.length === 0) {
          Logger.warn('No validators were detected for this project.');
          return;
        }

        const maxAttempts = Math.max(1, Number.parseInt(options.attempts, 10) || 1);
        const loopConfig: LoopConfig = {
          maxAttempts,
          validatorCommands,
          allowedFiles: [],
          workingDirectory,
          taskId: 'cli_run_validation',
          stopOnRepeatedError: true,
        };

        const engine = new LoopEngine(loopConfig, {
          async execute() {
            return;
          },
          logger(message) {
            Logger.info(message);
          },
        });

        const result = await engine.run({
          taskId: 'cli_run_validation',
          description: 'Validate current project',
          targetFiles: [],
        });

        Logger.newline();
        Logger.section('Runtime Validation');

        if (result.success) {
          Logger.success('All detected validators passed.');
          return;
        }

        Logger.error('Validation failed.');
        const fixGenerator = new FixGenerator();
        const latestAttempt = result.attempts[result.attempts.length - 1];

        latestAttempt.validationResults
          .filter((validation) => !validation.passed)
          .forEach((validation) => {
            Logger.warn(`${validation.name} failed`);
            validation.errors.slice(0, 5).forEach((error) => {
              const location = error.file
                ? `${error.file}:${error.line || 1}:${error.column || 1}`
                : 'unknown';
              Logger.info(`${location} - ${error.message}`);

              const proposal = fixGenerator.generate(error);
              if (proposal.rationale) {
                console.log(`  Suggestion: ${proposal.rationale}`);
              }
            });
          });

        process.exitCode = 1;
      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

function detectValidators(cwd: string): ValidationCommand[] {
  const validators: ValidationCommand[] = [];
  const packageJsonPath = path.join(cwd, 'package.json');
  const packageJson = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    : {};
  const scripts = packageJson.scripts || {};

  if (fs.existsSync(path.join(cwd, 'tsconfig.json'))) {
    validators.push({
      name: 'tsc',
      command: scripts.compile ? 'npm run compile' : 'npx tsc --noEmit',
      required: true,
    });
  }

  if (scripts['test:unit']) {
    validators.push({
      name: 'test',
      command: 'npm run test:unit',
      required: true,
    });
  } else if (scripts.test) {
    validators.push({
      name: 'test',
      command: 'npm test',
      required: true,
    });
  }

  if (scripts.lint) {
    validators.push({
      name: 'eslint',
      command: 'npm run lint',
      required: false,
    });
  }

  return validators;
}

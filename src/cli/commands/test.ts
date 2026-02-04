import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const TEST_SYSTEM_PROMPT = `You are an expert at writing tests.
Generate comprehensive test cases that cover:
- Happy path scenarios
- Edge cases
- Error handling
- Boundary conditions

Use the appropriate testing framework (Jest, Mocha, etc.) based on the code.`;

export function createTestCommand(aiClient: AIClient): Command {
  const command = new Command('test');

  command
    .description('Generate tests for code')
    .argument('<file>', 'File to generate tests for')
    .option('-f, --framework <name>', 'Testing framework (jest, mocha, vitest)', 'jest')
    .action(async (file: string, options) => {
      try {
        if (!fs.existsSync(file)) {
          Logger.error(`File not found: ${file}`);
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        
        const prompt = `Generate ${options.framework} tests for this code:\n\nFile: ${file}\n\n${content}`;

        const spinner = ora('Generating tests...').start();
        const response = await aiClient.ask(prompt, TEST_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Generated Tests: ${file}`);
        console.log(response);
        Logger.newline();

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const COMPARE_SYSTEM_PROMPT = `You are an expert at comparing code implementations.
Analyze and compare:
- Functionality differences
- Performance characteristics
- Code quality
- Maintainability
- Best practices adherence

Provide detailed comparison with recommendations.`;

export function createCompareCommand(aiClient: AIClient): Command {
  const command = new Command('compare');

  command
    .description('Compare two code files or implementations')
    .argument('<file1>', 'First file')
    .argument('<file2>', 'Second file')
    .action(async (file1: string, file2: string) => {
      try {
        if (!fs.existsSync(file1)) {
          Logger.error(`File not found: ${file1}`);
          process.exit(1);
        }
        if (!fs.existsSync(file2)) {
          Logger.error(`File not found: ${file2}`);
          process.exit(1);
        }

        const content1 = fs.readFileSync(file1, 'utf-8');
        const content2 = fs.readFileSync(file2, 'utf-8');
        
        const prompt = `Compare these two implementations:\n\nFile 1: ${file1}\n${content1}\n\nFile 2: ${file2}\n${content2}`;

        const spinner = ora('Comparing implementations...').start();
        const response = await aiClient.ask(prompt, COMPARE_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Comparison: ${file1} vs ${file2}`);
        console.log(response);
        Logger.newline();

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

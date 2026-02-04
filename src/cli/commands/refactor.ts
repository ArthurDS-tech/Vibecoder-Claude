import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const REFACTOR_SYSTEM_PROMPT = `You are an expert at code refactoring.
Analyze the code and suggest improvements for:
- Code structure and organization
- Performance optimizations
- Readability and maintainability
- Design patterns
- Best practices

Provide the refactored code with explanations.`;

export function createRefactorCommand(aiClient: AIClient): Command {
  const command = new Command('refactor');

  command
    .description('Refactor code for better quality and performance')
    .argument('<file>', 'File to refactor')
    .option('-t, --target <aspect>', 'Specific aspect to refactor (performance, readability, structure)')
    .action(async (file: string, options) => {
      try {
        if (!fs.existsSync(file)) {
          Logger.error(`File not found: ${file}`);
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        
        let prompt = `Refactor this code:\n\nFile: ${file}\n\n${content}`;
        
        if (options.target) {
          prompt += `\n\nFocus on: ${options.target}`;
        }

        const spinner = ora('Refactoring code...').start();
        const response = await aiClient.ask(prompt, REFACTOR_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Refactored: ${file}`);
        console.log(response);
        Logger.newline();

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

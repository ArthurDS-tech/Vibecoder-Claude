import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const CONVERT_SYSTEM_PROMPT = `You are an expert at converting code between languages and frameworks.
Maintain:
- Original functionality
- Code structure
- Best practices for target language
- Idiomatic patterns

Provide complete, working code in the target language.`;

export function createConvertCommand(aiClient: AIClient): Command {
  const command = new Command('convert');

  command
    .description('Convert code to another language or framework')
    .argument('<file>', 'File to convert')
    .requiredOption('-t, --to <language>', 'Target language/framework')
    .action(async (file: string, options) => {
      try {
        if (!fs.existsSync(file)) {
          Logger.error(`File not found: ${file}`);
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        const prompt = `Convert this code to ${options.to}:\n\nFile: ${file}\n\n${content}`;

        const spinner = ora(`Converting to ${options.to}...`).start();
        const response = await aiClient.ask(prompt, CONVERT_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Converted to ${options.to}`);
        console.log(response);
        Logger.newline();

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

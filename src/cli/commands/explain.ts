import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const EXPLAIN_SYSTEM_PROMPT = `You are an expert at explaining code.
Provide clear, detailed explanations of:
- What the code does
- How it works
- Key concepts and patterns used
- Potential issues or improvements

Use simple language and examples when helpful.`;

export function createExplainCommand(aiClient: AIClient): Command {
  const command = new Command('explain');

  command
    .description('Explain how code works')
    .argument('<file>', 'File to explain')
    .option('-s, --simple', 'Use simple language for beginners')
    .action(async (file: string, options) => {
      try {
        if (!fs.existsSync(file)) {
          Logger.error(`File not found: ${file}`);
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        
        let prompt = `Explain this code:\n\nFile: ${file}\n\n${content}`;
        
        if (options.simple) {
          prompt += '\n\nUse simple language suitable for beginners.';
        }

        const spinner = ora('Analyzing code...').start();
        const response = await aiClient.ask(prompt, EXPLAIN_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Explanation: ${file}`);
        console.log(response);
        Logger.newline();

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

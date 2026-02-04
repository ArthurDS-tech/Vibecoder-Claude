import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const DEBUG_SYSTEM_PROMPT = `You are an expert debugger.
Analyze the code and error to:
- Identify the root cause
- Explain why the error occurs
- Provide step-by-step fix
- Suggest preventive measures

Be specific and actionable.`;

export function createDebugCommand(aiClient: AIClient): Command {
  const command = new Command('debug');

  command
    .description('Debug code and find solutions to errors')
    .argument('<file>', 'File with the bug')
    .option('-e, --error <message>', 'Error message or description')
    .action(async (file: string, options) => {
      try {
        if (!fs.existsSync(file)) {
          Logger.error(`File not found: ${file}`);
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        
        let prompt = `Debug this code:\n\nFile: ${file}\n\n${content}`;
        
        if (options.error) {
          prompt += `\n\nError: ${options.error}`;
        }

        const spinner = ora('Debugging...').start();
        const response = await aiClient.ask(prompt, DEBUG_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Debug Analysis: ${file}`);
        console.log(response);
        Logger.newline();

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

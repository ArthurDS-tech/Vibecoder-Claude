import { Command } from 'commander';
import ora from 'ora';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

export function createAskCommand(aiClient: AIClient): Command {
  const command = new Command('ask');

  command
    .description('Ask a question to the AI')
    .argument('<question>', 'Question to ask')
    .option('-s, --system <prompt>', 'System prompt to set context')
    .action(async (question: string, options) => {
      try {
        const spinner = ora('Thinking...').start();

        const response = await aiClient.ask(question, options.system);

        spinner.stop();
        Logger.newline();
        Logger.section('Response');
        console.log(response);
        Logger.newline();
      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

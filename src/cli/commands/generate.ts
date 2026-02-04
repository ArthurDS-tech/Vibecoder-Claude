import { Command } from 'commander';
import ora from 'ora';
import { AIClient } from '../core/ai-client';
import { ContextBuilder } from '../core/context';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const CODER_SYSTEM_PROMPT = `You are an expert software engineer.
Generate high-quality, production-ready code based on the user's request.

Respond in JSON format:
{
  "changes": [
    {
      "file": "path/to/file",
      "action": "create|modify|delete",
      "content": "full file content",
      "explanation": "why this change is needed"
    }
  ]
}`;

export function createGenerateCommand(
  aiClient: AIClient,
  contextBuilder: ContextBuilder
): Command {
  const command = new Command('generate');

  command
    .description('Generate code based on a description')
    .argument('<description>', 'What code to generate')
    .option('-c, --context', 'Include project context')
    .option('-o, --output', 'Write files to disk (default: just display)')
    .action(async (description: string, options) => {
      try {
        let prompt = `Generate code for: ${description}`;

        if (options.context) {
          const spinner = ora('Reading project context...').start();
          const context = await contextBuilder.buildContext();
          spinner.text = 'Analyzing project...';
          
          prompt += '\n\nProject context:\n' + contextBuilder.formatContext(context);
          spinner.stop();
        }

        const spinner = ora('Generating code...').start();
        const response = await aiClient.ask(prompt, CODER_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section('Generated Code');

        try {
          const result = JSON.parse(response);
          
          result.changes.forEach((change: any) => {
            Logger.newline();
            console.log(`${change.action.toUpperCase()}: ${change.file}`);
            if (change.explanation) {
              Logger.info(change.explanation);
            }
            Logger.newline();
            Logger.code(change.content);
          });

          if (options.output) {
            Logger.warn('File writing not implemented yet. Code displayed above.');
          }
        } catch {
          // If not valid JSON, just print the response
          console.log(response);
        }

        Logger.newline();
      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

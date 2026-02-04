import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const DOCS_SYSTEM_PROMPT = `You are an expert at writing documentation.
Generate clear, comprehensive documentation including:
- Function/class descriptions
- Parameter explanations
- Return value descriptions
- Usage examples
- Edge cases and notes

Use JSDoc, TSDoc, or appropriate format for the language.`;

export function createDocsCommand(aiClient: AIClient): Command {
  const command = new Command('docs');

  command
    .description('Generate documentation for code')
    .argument('<file>', 'File to document')
    .option('-s, --style <format>', 'Documentation style (jsdoc, markdown, inline)', 'jsdoc')
    .action(async (file: string, options) => {
      try {
        if (!fs.existsSync(file)) {
          Logger.error(`File not found: ${file}`);
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        
        const prompt = `Generate ${options.style} documentation for this code:\n\nFile: ${file}\n\n${content}`;

        const spinner = ora('Generating documentation...').start();
        const response = await aiClient.ask(prompt, DOCS_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Generated Documentation: ${file}`);
        console.log(response);
        Logger.newline();

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

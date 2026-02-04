import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const SECURITY_SYSTEM_PROMPT = `You are a security expert.
Analyze code for vulnerabilities:
- SQL injection
- XSS attacks
- CSRF vulnerabilities
- Authentication issues
- Authorization flaws
- Data exposure
- Insecure dependencies

Provide severity ratings and fixes.`;

export function createSecurityCommand(aiClient: AIClient): Command {
  const command = new Command('security');

  command
    .description('Analyze code for security vulnerabilities')
    .argument('<file>', 'File to analyze')
    .action(async (file: string) => {
      try {
        if (!fs.existsSync(file)) {
          Logger.error(`File not found: ${file}`);
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        const prompt = `Perform security analysis on this code:\n\nFile: ${file}\n\n${content}`;

        const spinner = ora('Scanning for vulnerabilities...').start();
        const response = await aiClient.ask(prompt, SECURITY_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Security Analysis: ${file}`);
        console.log(response);
        Logger.newline();

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const REVIEWER_SYSTEM_PROMPT = `You are a senior code reviewer.
Analyze the provided code for:
- Code quality and best practices
- Potential bugs
- Performance issues
- Security concerns
- Maintainability

Respond in JSON format:
{
  "approved": true|false,
  "issues": [
    {
      "severity": "error|warning|info",
      "message": "description of the issue",
      "line": 42
    }
  ],
  "suggestions": ["improvement suggestions"]
}`;

export function createReviewCommand(aiClient: AIClient): Command {
  const command = new Command('review');

  command
    .description('Review code for quality, bugs, and improvements')
    .argument('<file>', 'File to review')
    .action(async (file: string) => {
      try {
        if (!fs.existsSync(file)) {
          Logger.error(`File not found: ${file}`);
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        const prompt = `Review this code:\n\nFile: ${file}\n\n${content}`;

        const spinner = ora('Reviewing code...').start();
        const response = await aiClient.ask(prompt, REVIEWER_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Code Review: ${file}`);

        try {
          const review = JSON.parse(response);
          
          if (review.approved) {
            Logger.success('Code approved');
          } else {
            Logger.warn('Code needs improvements');
          }

          if (review.issues.length > 0) {
            Logger.newline();
            Logger.section('Issues Found');
            
            review.issues.forEach((issue: any) => {
              const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
              console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
              if (issue.line) {
                console.log(`   Line ${issue.line}`);
              }
            });
          }

          if (review.suggestions.length > 0) {
            Logger.newline();
            Logger.section('Suggestions');
            review.suggestions.forEach((s: string) => Logger.info(s));
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

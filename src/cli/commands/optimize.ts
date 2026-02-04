import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import { AIClient } from '../core/ai-client';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const OPTIMIZE_SYSTEM_PROMPT = `You are a performance optimization expert.
Analyze code for:
- Time complexity improvements
- Space complexity optimizations
- Algorithm efficiency
- Resource usage
- Caching opportunities
- Database query optimization

Provide optimized code with performance metrics and explanations.`;

export function createOptimizeCommand(aiClient: AIClient): Command {
  const command = new Command('optimize');

  command
    .description('Optimize code for better performance')
    .argument('<file>', 'File to optimize')
    .option('-m, --metric <type>', 'Optimization target (speed, memory, both)', 'both')
    .action(async (file: string, options) => {
      try {
        if (!fs.existsSync(file)) {
          Logger.error(`File not found: ${file}`);
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        const prompt = `Optimize this code for ${options.metric}:\n\nFile: ${file}\n\n${content}`;

        const spinner = ora('Analyzing performance...').start();
        const response = await aiClient.ask(prompt, OPTIMIZE_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section(`Performance Optimization: ${file}`);
        console.log(response);
        Logger.newline();

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

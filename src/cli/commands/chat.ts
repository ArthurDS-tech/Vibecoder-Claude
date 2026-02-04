import { Command } from 'commander';
import readline from 'readline';
import chalk from 'chalk';
import { AIClient } from '../core/ai-client';
import { ContextBuilder } from '../core/context';
import { ProjectMemory } from '../../ai/memory/ProjectMemory';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function createChatCommand(
  aiClient: AIClient,
  contextBuilder: ContextBuilder
): Command {
  const command = new Command('chat');

  command
    .description('Start interactive chat session with AI')
    .option('-c, --context', 'Include project context in conversation')
    .action(async (options) => {
      try {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          prompt: chalk.cyan('You> '),
        });

        const messages: Message[] = [];
        const memory = new ProjectMemory(process.cwd());

        // Add system context
        let systemPrompt = `You are VibeCode AI, an expert software engineer assistant.
You help developers with code, architecture, debugging, and best practices.
Be concise but thorough. Provide code examples when relevant.`;

        if (options.context) {
          const context = await contextBuilder.buildContext();
          systemPrompt += `\n\nProject context:\n${contextBuilder.formatContext(context)}`;
          systemPrompt += `\n\nProject memory:\n${memory.getContext()}`;
        }

        messages.push({ role: 'system', content: systemPrompt });

        console.clear();
        console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.cyan('║                                                        ║'));
        console.log(chalk.bold.cyan('║              VibeCode Interactive Chat                 ║'));
        console.log(chalk.bold.cyan('║                                                        ║'));
        console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════╝\n'));
        
        console.log(chalk.gray('Commands:'));
        console.log(chalk.gray('  /help     - Show all commands'));
        console.log(chalk.gray('  /clear    - Clear conversation'));
        console.log(chalk.gray('  /context  - Toggle project context'));
        console.log(chalk.gray('  /save     - Save conversation'));
        console.log(chalk.gray('  /exit     - Exit chat\n'));

        rl.prompt();

        rl.on('line', async (input: string) => {
          const trimmed = input.trim();

          if (!trimmed) {
            rl.prompt();
            return;
          }

          // Handle commands
          if (trimmed.startsWith('/')) {
            await handleCommand(trimmed, rl, messages, options);
            rl.prompt();
            return;
          }

          // Add user message
          messages.push({ role: 'user', content: trimmed });

          // Get AI response
          try {
            console.log(chalk.gray('\nThinking...\n'));
            
            const response = await aiClient.chat(messages);
            messages.push({ role: 'assistant', content: response });

            console.log(chalk.green('AI> ') + response + '\n');
          } catch (error) {
            console.log(chalk.red('Error: ') + (error as Error).message + '\n');
          }

          rl.prompt();
        });

        rl.on('close', () => {
          console.log(chalk.cyan('\n\nGoodbye! 👋\n'));
          process.exit(0);
        });

      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

async function handleCommand(
  cmd: string,
  rl: readline.Interface,
  messages: Message[],
  options: any
): Promise<void> {
  const parts = cmd.split(' ');
  const command = parts[0].toLowerCase();

  switch (command) {
    case '/help':
      console.log(chalk.cyan('\nAvailable Commands:\n'));
      console.log(chalk.gray('  /help       - Show this help'));
      console.log(chalk.gray('  /clear      - Clear conversation history'));
      console.log(chalk.gray('  /context    - Toggle project context'));
      console.log(chalk.gray('  /save       - Save conversation to file'));
      console.log(chalk.gray('  /history    - Show conversation history'));
      console.log(chalk.gray('  /model      - Show current model'));
      console.log(chalk.gray('  /exit       - Exit chat\n'));
      break;

    case '/clear':
      messages.length = 1; // Keep only system message
      console.log(chalk.green('\n✓ Conversation cleared\n'));
      break;

    case '/context':
      options.context = !options.context;
      console.log(chalk.green(`\n✓ Project context ${options.context ? 'enabled' : 'disabled'}\n`));
      break;

    case '/save':
      const fs = require('fs');
      const filename = `chat-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(messages, null, 2));
      console.log(chalk.green(`\n✓ Conversation saved to ${filename}\n`));
      break;

    case '/history':
      console.log(chalk.cyan('\nConversation History:\n'));
      messages.slice(1).forEach((msg, i) => {
        const prefix = msg.role === 'user' ? chalk.cyan('You> ') : chalk.green('AI> ');
        console.log(`${i + 1}. ${prefix}${msg.content.substring(0, 100)}...`);
      });
      console.log('');
      break;

    case '/model':
      console.log(chalk.cyan('\nCurrent model: gpt-4\n'));
      break;

    case '/exit':
      rl.close();
      break;

    default:
      console.log(chalk.red(`\nUnknown command: ${command}\n`));
      console.log(chalk.gray('Type /help for available commands\n'));
  }
}

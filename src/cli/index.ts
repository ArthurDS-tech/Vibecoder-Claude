#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './core/config';
import { AIClient } from './core/ai-client';
import { ContextBuilder } from './core/context';

// Import all commands
import { createInitCommand } from './commands/init';
import { createAskCommand } from './commands/ask';
import { createChatCommand } from './commands/chat';
import { createPlanCommand } from './commands/plan';
import { createGenerateCommand } from './commands/generate';
import { createReviewCommand } from './commands/review';
import { createExplainCommand } from './commands/explain';
import { createDebugCommand } from './commands/debug';
import { createRefactorCommand } from './commands/refactor';
import { createTestCommand } from './commands/test';
import { createDocsCommand } from './commands/docs';
import { createOptimizeCommand } from './commands/optimize';
import { createConvertCommand } from './commands/convert';
import { createSecurityCommand } from './commands/security';
import { createCompareCommand } from './commands/compare';
import { createConfigCommand } from './commands/config';
import { registerGitCommand } from './commands/git';

const program = new Command();

// Initialize core services
const configManager = new ConfigManager();
const aiClient = new AIClient(configManager);
const contextBuilder = new ContextBuilder(configManager);

program
  .name('vibecode')
  .description(chalk.cyan('🚀 VibeCode - AI-Powered Development Assistant'))
  .version('1.0.0');

// Core commands
program.addCommand(createInitCommand(configManager));
program.addCommand(createChatCommand(aiClient, contextBuilder));

// Code generation & planning
program.addCommand(createAskCommand(aiClient));
program.addCommand(createPlanCommand(aiClient, contextBuilder));
program.addCommand(createGenerateCommand(aiClient, contextBuilder));

// Code analysis
program.addCommand(createReviewCommand(aiClient));
program.addCommand(createExplainCommand(aiClient));
program.addCommand(createDebugCommand(aiClient));

// Code improvement
program.addCommand(createRefactorCommand(aiClient));
program.addCommand(createOptimizeCommand(aiClient));
program.addCommand(createSecurityCommand(aiClient));

// Code utilities
program.addCommand(createTestCommand(aiClient));
program.addCommand(createDocsCommand(aiClient));
program.addCommand(createConvertCommand(aiClient));
program.addCommand(createCompareCommand(aiClient));

// Configuration
program.addCommand(createConfigCommand(configManager));

// Git operations
registerGitCommand(program);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                                                        ║'));
  console.log(chalk.bold.cyan('║              VibeCode AI Assistant                     ║'));
  console.log(chalk.bold.cyan('║                                                        ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════╝\n'));
  
  program.outputHelp();
  
  console.log(chalk.gray('\n💡 Quick Start:\n'));
  console.log(chalk.gray('  vibecode chat              Start interactive chat'));
  console.log(chalk.gray('  vibecode ask "question"    Ask a quick question'));
  console.log(chalk.gray('  vibecode plan "feature"    Plan a new feature'));
  console.log(chalk.gray('  vibecode review file.ts    Review code quality\n'));
}

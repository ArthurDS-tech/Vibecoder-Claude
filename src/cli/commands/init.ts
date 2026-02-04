import { Command } from 'commander';
import inquirer from 'inquirer';
import * as path from 'path';
import { ConfigManager } from '../core/config';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

export function createInitCommand(configManager: ConfigManager): Command {
  const command = new Command('init');

  command
    .description('Initialize VibeCode configuration in current project')
    .action(async () => {
      try {
        Logger.section('VibeCode Initialization');

        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'provider',
            message: 'Select AI provider:',
            choices: ['openai', 'anthropic'],
            default: 'openai',
          },
          {
            type: 'input',
            name: 'model',
            message: 'Model name:',
            default: (answers: any) =>
              answers.provider === 'openai' ? 'gpt-4' : 'claude-3-5-sonnet-20241022',
          },
          {
            type: 'password',
            name: 'apiKey',
            message: 'API Key (leave empty to use environment variable):',
            mask: '*',
          },
        ]);

        const config: any = {
          provider: answers.provider,
          model: answers.model,
        };

        if (answers.apiKey) {
          config.apiKey = answers.apiKey;
        }

        // Salvar no diretório RAIZ do projeto, não no diretório atual
        const projectRoot = process.cwd();
        const configPath = path.join(projectRoot, '.vibecoderc.json');
        
        await configManager.save(config);

        Logger.success(`Configuration saved to ${configPath}`);
        Logger.info('You can now use: vibecode ask "your question"');
      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

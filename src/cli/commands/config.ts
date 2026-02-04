import { Command } from 'commander';
import { ConfigManager } from '../core/config';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

export function createConfigCommand(configManager: ConfigManager): Command {
  const command = new Command('config');

  command.description('Manage VibeCode configuration');

  command
    .command('get <key>')
    .description('Get a configuration value')
    .action(async (key: string) => {
      try {
        const value = await configManager.get(key as any);
        
        if (value === undefined) {
          Logger.warn(`Configuration key '${key}' not found`);
        } else {
          console.log(value);
        }
      } catch (error) {
        handleError(error);
      }
    });

  command
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key: string, value: string) => {
      try {
        await configManager.set(key as any, value);
        Logger.success(`Configuration updated: ${key} = ${value}`);
      } catch (error) {
        handleError(error);
      }
    });

  command
    .command('list')
    .description('List all configuration')
    .action(async () => {
      try {
        const config = await configManager.load();
        Logger.section('Current Configuration');
        Logger.json(config);
      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

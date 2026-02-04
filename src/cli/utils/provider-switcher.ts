import readline from 'readline';
import chalk from 'chalk';
import { ConfigManager } from '../core/config';

export interface ProviderOption {
  name: string;
  value: 'openai' | 'anthropic';
  model: string;
  description: string;
}

export class ProviderSwitcher {
  private options: ProviderOption[] = [
    {
      name: 'OpenAI GPT-4',
      value: 'openai',
      model: 'gpt-4',
      description: 'Modelo mais avançado da OpenAI'
    },
    {
      name: 'OpenAI GPT-4 Turbo',
      value: 'openai',
      model: 'gpt-4-turbo',
      description: 'Versão mais rápida e econômica'
    },
    {
      name: 'Claude 3.5 Sonnet',
      value: 'anthropic',
      model: 'claude-3-5-sonnet-20240620',
      description: 'Modelo mais recente da Anthropic (Recomendado)'
    },
    {
      name: 'Claude 3 Opus',
      value: 'anthropic',
      model: 'claude-3-opus-20240229',
      description: 'Modelo mais poderoso da Anthropic'
    },
    {
      name: 'Claude 3 Sonnet',
      value: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      description: 'Modelo balanceado da Anthropic'
    },
    {
      name: 'Claude 3 Haiku',
      value: 'anthropic',
      model: 'claude-3-haiku-20240307',
      description: 'Modelo mais rápido da Anthropic'
    }
  ];

  async show(configManager: ConfigManager): Promise<void> {
    return new Promise((resolve) => {
      const currentConfig = configManager['config'];
      let selectedIndex = this.options.findIndex(
        opt => opt.value === currentConfig?.provider && opt.model === currentConfig?.model
      );
      if (selectedIndex === -1) selectedIndex = 0;

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
      });

      // Configurar raw mode para capturar teclas
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }

      const render = () => {
        // Limpar tela
        console.clear();
        
        console.log('');
        console.log(chalk.hex('#00D9FF')('╔' + '═'.repeat(70) + '╗'));
        console.log(chalk.hex('#00D9FF')('║') + chalk.bold.hex('#FFD700')(' 🔄 TROCAR PROVIDER DE IA'.padEnd(70)) + chalk.hex('#00D9FF')('║'));
        console.log(chalk.hex('#00D9FF')('╠' + '═'.repeat(70) + '╣'));
        console.log(chalk.hex('#00D9FF')('║') + chalk.gray(' Use ↑/↓ para navegar, Enter para selecionar, Esc para cancelar'.padEnd(70)) + chalk.hex('#00D9FF')('║'));
        console.log(chalk.hex('#00D9FF')('╠' + '═'.repeat(70) + '╣'));
        
        this.options.forEach((option, index) => {
          const isSelected = index === selectedIndex;
          const isCurrent = option.value === currentConfig?.provider && option.model === currentConfig?.model;
          
          let prefix = '  ';
          if (isSelected) {
            prefix = chalk.hex('#FF00FF')('▶ ');
          } else if (isCurrent) {
            prefix = chalk.green('✓ ');
          }
          
          const nameColor = isSelected ? chalk.bold.hex('#00D9FF') : chalk.white;
          const descColor = isSelected ? chalk.hex('#FFD700') : chalk.gray;
          
          console.log(chalk.hex('#00D9FF')('║') + prefix + nameColor(option.name.padEnd(30)) + descColor(option.description.padEnd(36)) + chalk.hex('#00D9FF')('║'));
        });
        
        console.log(chalk.hex('#00D9FF')('╚' + '═'.repeat(70) + '╝'));
        console.log('');
      };

      render();

      const onKeypress = async (chunk: Buffer) => {
        const key = chunk.toString();
        
        // ESC ou Ctrl+C
        if (key === '\u001b' || key === '\u0003') {
          cleanup();
          console.log(chalk.yellow('\n✗ Cancelado\n'));
          resolve();
          return;
        }
        
        // Enter
        if (key === '\r' || key === '\n') {
          const selected = this.options[selectedIndex];
          cleanup();
          
          // Salvar configuração
          await configManager.set('provider', selected.value);
          await configManager.set('model', selected.model);
          
          console.log('');
          console.log(chalk.green('✓ Provider alterado com sucesso!'));
          console.log(chalk.gray(`  Provider: ${selected.value}`));
          console.log(chalk.gray(`  Model: ${selected.model}`));
          console.log('');
          
          resolve();
          return;
        }
        
        // Seta para cima
        if (key === '\u001b[A') {
          selectedIndex = (selectedIndex - 1 + this.options.length) % this.options.length;
          render();
        }
        
        // Seta para baixo
        if (key === '\u001b[B') {
          selectedIndex = (selectedIndex + 1) % this.options.length;
          render();
        }
      };

      const cleanup = () => {
        process.stdin.removeListener('data', onKeypress);
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        rl.close();
      };

      process.stdin.on('data', onKeypress);
    });
  }
}

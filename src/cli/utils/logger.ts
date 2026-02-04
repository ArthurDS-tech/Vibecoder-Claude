import chalk from 'chalk';

export class Logger {
  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  static error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  static warn(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  static section(title: string): void {
    console.log('\n' + chalk.bold.cyan(title));
    console.log(chalk.gray('─'.repeat(60)));
  }

  static code(content: string): void {
    console.log(chalk.gray(content));
  }

  static json(data: any): void {
    console.log(JSON.stringify(data, null, 2));
  }

  static newline(): void {
    console.log('');
  }
}

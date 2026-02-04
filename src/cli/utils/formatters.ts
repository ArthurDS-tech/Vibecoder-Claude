import chalk from 'chalk';

/**
 * Formatting utilities for terminal output
 */

export class OutputFormatter {
  /**
   * Format success message
   */
  static success(message: string): string {
    return chalk.green(`✓ ${message}`);
  }

  /**
   * Format error message
   */
  static error(message: string): string {
    return chalk.red(`✗ ${message}`);
  }

  /**
   * Format warning message
   */
  static warning(message: string): string {
    return chalk.yellow(`⚠ ${message}`);
  }

  /**
   * Format info message
   */
  static info(message: string): string {
    return chalk.cyan(`ℹ ${message}`);
  }

  /**
   * Format code block
   */
  static code(code: string, language?: string): string {
    return chalk.gray('```') + (language ? chalk.gray(language) : '') + '\n' + code + '\n' + chalk.gray('```');
  }

  /**
   * Format file path
   */
  static filePath(path: string): string {
    return chalk.blue(path);
  }

  /**
   * Format directory path
   */
  static dirPath(path: string): string {
    return chalk.blue(`${path}/`);
  }

  /**
   * Format command
   */
  static command(cmd: string): string {
    return chalk.cyan(cmd);
  }

  /**
   * Format section header
   */
  static header(title: string): string {
    const line = '═'.repeat(60);
    return chalk.cyan(`\n${line}\n  ${title.toUpperCase()}\n${line}\n`);
  }

  /**
   * Format subsection
   */
  static subsection(title: string): string {
    return chalk.bold(`\n${title}:`);
  }

  /**
   * Mask sensitive data (API keys, tokens)
   */
  static maskSensitive(value: string, visibleChars: number = 4): string {
    if (!value || value.length <= visibleChars) {
      return '***';
    }
    const visible = value.slice(-visibleChars);
    return `${'*'.repeat(value.length - visibleChars)}${visible}`;
  }

  /**
   * Format file size
   */
  static fileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format timestamp
   */
  static timestamp(date: Date = new Date()): string {
    return chalk.gray(date.toLocaleString('pt-BR'));
  }

  /**
   * Format list item
   */
  static listItem(text: string, level: number = 0): string {
    const indent = '  '.repeat(level);
    return chalk.gray(`${indent}• ${text}`);
  }

  /**
   * Format key-value pair
   */
  static keyValue(key: string, value: string, indent: number = 2): string {
    const spaces = ' '.repeat(indent);
    return `${spaces}${chalk.gray(key + ':')} ${value}`;
  }

  /**
   * Extract code from markdown code blocks
   */
  static extractCode(text: string): string {
    const codeMatch = text.match(/```[\w]*\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1] : text;
  }

  /**
   * Truncate long text
   */
  static truncate(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - 3) + '...';
  }

  /**
   * Format progress indicator
   */
  static progress(current: number, total: number): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round(percentage / 5);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return chalk.cyan(`[${bar}] ${percentage}%`);
  }
}

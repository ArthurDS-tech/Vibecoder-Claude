import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { BaseCommand } from './base-command';
import { sanitizePath, validateFileAccess, validateFileSize } from '../utils/validators';
import { OutputFormatter } from '../utils/formatters';

/**
 * File operation commands
 */
export class FileCommands extends BaseCommand {
  getDescription(): string {
    return 'File operations';
  }

  getUsage(): string {
    return 'read|write|edit|delete|mkdir|touch <file>';
  }

  async execute(): Promise<void> {
    throw new Error('Use specific file command methods');
  }

  /**
   * Read file content
   */
  async readFile(file: string): Promise<void> {
    if (!file) {
      this.logError('Forneça o nome do arquivo');
      return;
    }

    try {
      // Sanitize and validate path
      const pathResult = sanitizePath(file, this.currentDir);
      if (!pathResult.valid) {
        this.logError(pathResult.reason!);
        return;
      }

      const fullPath = pathResult.sanitized!;

      // Validate file access
      const accessResult = validateFileAccess(fullPath);
      if (!accessResult.valid) {
        this.logError(accessResult.reason!);
        return;
      }

      // Validate file size
      const sizeResult = validateFileSize(fullPath);
      if (!sizeResult.valid) {
        this.logWarning(sizeResult.reason!);
        console.log(chalk.gray('Use um editor externo para arquivos grandes\n'));
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      
      console.log(chalk.cyan(`\n📄 ${file}:\n`));
      console.log(content);
      console.log('');
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Write content to file
   */
  async writeFile(file: string, content: string): Promise<void> {
    if (!file) {
      this.logError('Forneça o nome do arquivo');
      return;
    }

    try {
      // Sanitize path
      const pathResult = sanitizePath(file, this.currentDir);
      if (!pathResult.valid) {
        this.logError(pathResult.reason!);
        return;
      }

      const fullPath = pathResult.sanitized!;
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
      this.logSuccess(`Arquivo criado: ${file}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(file: string): Promise<void> {
    if (!file) {
      this.logError('Forneça o nome do arquivo');
      return;
    }

    try {
      // Sanitize path
      const pathResult = sanitizePath(file, this.currentDir);
      if (!pathResult.valid) {
        this.logError(pathResult.reason!);
        return;
      }

      const fullPath = pathResult.sanitized!;
      
      if (!fs.existsSync(fullPath)) {
        this.logError(`Arquivo não encontrado: ${file}`);
        return;
      }

      fs.unlinkSync(fullPath);
      this.logSuccess(`Arquivo deletado: ${file}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create directory
   */
  async makeDirectory(dir: string): Promise<void> {
    if (!dir) {
      this.logError('Forneça o nome do diretório');
      return;
    }

    try {
      // Sanitize path
      const pathResult = sanitizePath(dir, this.currentDir);
      if (!pathResult.valid) {
        this.logError(pathResult.reason!);
        return;
      }

      const fullPath = pathResult.sanitized!;
      fs.mkdirSync(fullPath, { recursive: true });
      this.logSuccess(`Diretório criado: ${dir}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Touch file (create or update timestamp)
   */
  async touchFile(file: string): Promise<void> {
    if (!file) {
      this.logError('Forneça o nome do arquivo');
      return;
    }

    try {
      // Sanitize path
      const pathResult = sanitizePath(file, this.currentDir);
      if (!pathResult.valid) {
        this.logError(pathResult.reason!);
        return;
      }

      const fullPath = pathResult.sanitized!;
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, '');
        this.logSuccess(`Arquivo criado: ${file}`);
      } else {
        const now = new Date();
        fs.utimesSync(fullPath, now, now);
        this.logSuccess(`Timestamp atualizado: ${file}`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Show directory tree
   */
  async showTree(dir: string = '.', prefix: string = '', isLast: boolean = true): Promise<void> {
    try {
      // Sanitize path
      const pathResult = sanitizePath(dir, this.currentDir);
      if (!pathResult.valid) {
        this.logError(pathResult.reason!);
        return;
      }

      const fullPath = pathResult.sanitized!;
      
      if (!fs.existsSync(fullPath)) {
        this.logError(`Diretório não encontrado: ${dir}`);
        return;
      }

      const files = fs.readdirSync(fullPath);
      const filtered = files.filter(f => !f.startsWith('.') && f !== 'node_modules');

      if (dir === '.') {
        console.log(chalk.cyan(`\n📁 ${path.basename(this.currentDir)}/\n`));
      }

      filtered.forEach((file, index) => {
        const isLastItem = index === filtered.length - 1;
        const connector = isLastItem ? '└── ' : '├── ';
        const fullFilePath = path.join(fullPath, file);
        const stats = fs.statSync(fullFilePath);

        if (stats.isDirectory()) {
          console.log(chalk.gray(prefix + connector) + chalk.blue(file + '/'));
        } else {
          console.log(chalk.gray(prefix + connector) + file);
        }
      });

      console.log('');
    } catch (error) {
      this.handleError(error);
    }
  }
}

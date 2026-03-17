import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';

export interface FileSelectionOptions {
  cwd: string;
  taskDescription: string;
  targetFiles?: string[];
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFiles?: number;
}

export interface SelectedFile {
  path: string;
  size: number;
  reason: 'target' | 'keyword' | 'config';
}

export class FileSelector {
  async select(options: FileSelectionOptions): Promise<SelectedFile[]> {
    const {
      cwd,
      taskDescription,
      targetFiles = [],
      includePatterns = ['src/**/*.{ts,tsx,js,jsx}', 'package.json', 'tsconfig.json'],
      excludePatterns = ['node_modules/**', 'dist/**', '.git/**'],
      maxFiles = 20,
    } = options;

    const selected = new Map<string, SelectedFile>();
    const keywords = this.extractKeywords(taskDescription);

    for (const targetFile of targetFiles) {
      const absolutePath = path.join(cwd, targetFile);
      if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
        selected.set(targetFile, {
          path: targetFile,
          size: fs.statSync(absolutePath).size,
          reason: 'target',
        });
      }
    }

    const files = await fg(includePatterns, {
      cwd,
      ignore: excludePatterns,
      onlyFiles: true,
    });

    for (const file of files) {
      if (selected.size >= maxFiles) {
        break;
      }

      if (selected.has(file)) {
        continue;
      }

      const reason = this.getReason(file, keywords);
      if (!reason) {
        continue;
      }

      const absolutePath = path.join(cwd, file);
      selected.set(file, {
        path: file,
        size: fs.statSync(absolutePath).size,
        reason,
      });
    }

    return Array.from(selected.values()).sort((left, right) => left.path.localeCompare(right.path));
  }

  private extractKeywords(taskDescription: string): string[] {
    return taskDescription
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((part) => part.length >= 4);
  }

  private getReason(
    filePath: string,
    keywords: string[]
  ): SelectedFile['reason'] | null {
    if (filePath === 'package.json' || filePath === 'tsconfig.json') {
      return 'config';
    }

    const normalizedPath = filePath.toLowerCase();
    if (keywords.some((keyword) => normalizedPath.includes(keyword))) {
      return 'keyword';
    }

    return null;
  }
}

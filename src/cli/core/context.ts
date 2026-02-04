import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { ConfigManager } from './config';

export interface ProjectContext {
  files: FileInfo[];
  totalSize: number;
  fileCount: number;
}

export interface FileInfo {
  path: string;
  content: string;
  size: number;
}

export class ContextBuilder {
  private maxTotalSize = 100 * 1024; // 100KB limit
  private maxFileSize = 50 * 1024; // 50KB per file

  constructor(private configManager: ConfigManager) {}

  async buildContext(patterns?: string[]): Promise<ProjectContext> {
    const config = await this.configManager.load();
    const excludePatterns = config.excludePatterns || [];

    const searchPatterns = patterns || ['**/*.{ts,js,tsx,jsx,json,md}'];
    
    const files = await fg(searchPatterns, {
      cwd: process.cwd(),
      ignore: excludePatterns,
      absolute: false,
    });

    const fileInfos: FileInfo[] = [];
    let totalSize = 0;

    for (const file of files) {
      const fullPath = path.join(process.cwd(), file);
      const stats = fs.statSync(fullPath);

      if (stats.size > this.maxFileSize) {
        continue; // Skip large files
      }

      if (totalSize + stats.size > this.maxTotalSize) {
        break; // Stop if we exceed total size limit
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      
      fileInfos.push({
        path: file,
        content,
        size: stats.size,
      });

      totalSize += stats.size;
    }

    return {
      files: fileInfos,
      totalSize,
      fileCount: fileInfos.length,
    };
  }

  formatContext(context: ProjectContext): string {
    let formatted = `Project Context (${context.fileCount} files, ${(context.totalSize / 1024).toFixed(2)}KB):\n\n`;

    for (const file of context.files) {
      formatted += `=== ${file.path} ===\n`;
      formatted += file.content;
      formatted += '\n\n';
    }

    return formatted;
  }
}

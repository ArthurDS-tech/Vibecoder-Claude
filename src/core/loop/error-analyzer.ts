import * as path from 'path';
import { ParsedError, ValidationTool } from '../../shared/types/loop.types';

export class ErrorAnalyzer {
  parse(output: string, source: ValidationTool): ParsedError[] {
    switch (source) {
      case 'tsc':
        return this.parseTypeScriptErrors(output);
      case 'test':
        return this.parseTestErrors(output);
      case 'eslint':
        return this.parseEslintErrors(output);
      default:
        return this.createFallbackError(output, source);
    }
  }

  summarize(errors: ParsedError[]): string {
    if (errors.length === 0) {
      return 'No parsed errors';
    }

    return errors
      .map((error) => {
        const location = error.file
          ? `${error.file}${error.line ? `:${error.line}` : ''}${error.column ? `:${error.column}` : ''}`
          : 'unknown';
        return `${error.type}:${location} - ${error.message}`;
      })
      .join('\n');
  }

  private parseTypeScriptErrors(output: string): ParsedError[] {
    const errors: ParsedError[] = [];
    const pattern =
      /^(.*)\((\d+),(\d+)\): error (TS\d+): (.*)$/gm;

    for (const match of output.matchAll(pattern)) {
      errors.push({
        file: this.normalizeFilePath(match[1]),
        line: Number(match[2]),
        column: Number(match[3]),
        message: match[5].trim(),
        type: 'typescript',
        code: match[4],
        source: 'tsc',
        raw: match[0],
      });
    }

    return errors.length > 0 ? errors : this.createFallbackError(output, 'tsc');
  }

  private parseTestErrors(output: string): ParsedError[] {
    const errors: ParsedError[] = [];
    const stackPattern =
      /at\s+(?:.*\()?(.*?):(\d+):(\d+)\)?/g;
    const headerPattern =
      /(?:FAIL|Error|Expected|Received|AssertionError)(.*)/g;

    const stackMatches = Array.from(output.matchAll(stackPattern));
    const headerMatches = Array.from(output.matchAll(headerPattern));

    if (stackMatches.length === 0 && headerMatches.length === 0) {
      return this.createFallbackError(output, 'test');
    }

    if (stackMatches.length === 0) {
      return headerMatches.map((match) => ({
        message: match[0].trim(),
        type: 'test',
        source: 'test',
        raw: match[0],
      }));
    }

    for (const [index, match] of stackMatches.entries()) {
      const header = headerMatches[index]?.[0]?.trim();

      errors.push({
        file: this.normalizeFilePath(match[1]),
        line: Number(match[2]),
        column: Number(match[3]),
        message: header || 'Test execution failed',
        type: 'test',
        source: 'test',
        raw: match[0],
      });
    }

    return errors;
  }

  private parseEslintErrors(output: string): ParsedError[] {
    const errors: ParsedError[] = [];
    const pattern =
      /^(.*?):(\d+):(\d+):\s+(error|warning)\s+(.*?)\s{2,}([^\s]+)$/gm;

    for (const match of output.matchAll(pattern)) {
      errors.push({
        file: this.normalizeFilePath(match[1]),
        line: Number(match[2]),
        column: Number(match[3]),
        message: `${match[5].trim()} (${match[4]})`,
        type: 'lint',
        code: match[6],
        source: 'eslint',
        raw: match[0],
      });
    }

    return errors.length > 0 ? errors : this.createFallbackError(output, 'eslint');
  }

  private createFallbackError(output: string, source: ValidationTool): ParsedError[] {
    const trimmed = output.trim();

    if (!trimmed) {
      return [];
    }

    return [
      {
        message: trimmed.split('\n')[0],
        type: source === 'eslint' ? 'lint' : source === 'test' ? 'test' : 'unknown',
        source,
        raw: trimmed,
      },
    ];
  }

  private normalizeFilePath(filePath: string): string {
    return filePath.replace(/^\.+[\\/]/, '').split(path.sep).join('/');
  }
}

export function parseValidationOutput(
  output: string,
  source: ValidationTool
): ParsedError[] {
  return new ErrorAnalyzer().parse(output, source);
}

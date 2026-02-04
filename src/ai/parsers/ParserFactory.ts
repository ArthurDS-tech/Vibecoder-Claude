/**
 * Parser Factory - Select appropriate parser based on file type
 */

import * as path from 'path';
import { ASTParser } from './ASTParser';
import { ParsedFile, ParserOptions } from './types';

export class ParserFactory {
  private astParser: ASTParser;

  constructor(options: ParserOptions = {}) {
    this.astParser = new ASTParser(options);
  }

  /**
   * Parse file with appropriate parser
   */
  parseFile(filePath: string): ParsedFile | null {
    const ext = path.extname(filePath).toLowerCase();

    // TypeScript/JavaScript files
    if (this.isTypeScriptOrJavaScript(ext)) {
      return this.astParser.parseFile(filePath);
    }

    // Unsupported file type
    return null;
  }

  /**
   * Parse code string with appropriate parser
   */
  parseCode(sourceCode: string, fileName: string): ParsedFile | null {
    const ext = path.extname(fileName).toLowerCase();

    // TypeScript/JavaScript files
    if (this.isTypeScriptOrJavaScript(ext)) {
      return this.astParser.parseCode(sourceCode, fileName);
    }

    // Unsupported file type
    return null;
  }

  /**
   * Check if file can be parsed
   */
  canParse(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.isTypeScriptOrJavaScript(ext);
  }

  /**
   * Get supported extensions
   */
  getSupportedExtensions(): string[] {
    return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
  }

  /**
   * Check if file is TypeScript or JavaScript
   */
  private isTypeScriptOrJavaScript(ext: string): boolean {
    return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext);
  }

  /**
   * Batch parse multiple files
   */
  async parseFiles(filePaths: string[]): Promise<Map<string, ParsedFile>> {
    const results = new Map<string, ParsedFile>();

    for (const filePath of filePaths) {
      try {
        const parsed = this.parseFile(filePath);
        if (parsed) {
          results.set(filePath, parsed);
        }
      } catch (error) {
        console.error(`Failed to parse ${filePath}:`, error);
      }
    }

    return results;
  }

  /**
   * Get parser statistics for a file
   */
  getStatistics(parsed: ParsedFile): {
    totalFunctions: number;
    totalClasses: number;
    totalInterfaces: number;
    totalTypes: number;
    totalEnums: number;
    totalImports: number;
    totalExports: number;
    totalVariables: number;
    totalSymbols: number;
    exportedSymbols: number;
  } {
    const exportedSymbols = [
      ...parsed.functions.filter(f => f.isExported),
      ...parsed.classes.filter(c => c.isExported),
      ...parsed.interfaces.filter(i => i.isExported),
      ...parsed.types.filter(t => t.isExported),
      ...parsed.enums.filter(e => e.isExported),
      ...parsed.variables.filter(v => v.isExported)
    ].length;

    return {
      totalFunctions: parsed.functions.length,
      totalClasses: parsed.classes.length,
      totalInterfaces: parsed.interfaces.length,
      totalTypes: parsed.types.length,
      totalEnums: parsed.enums.length,
      totalImports: parsed.imports.length,
      totalExports: parsed.exports.length,
      totalVariables: parsed.variables.length,
      totalSymbols: this.astParser.getAllSymbols(parsed).length,
      exportedSymbols
    };
  }
}

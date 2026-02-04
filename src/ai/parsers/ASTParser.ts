/**
 * AST Parser - TypeScript/JavaScript code structure analyzer
 * Uses TypeScript Compiler API for deep code analysis
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import {
  ParsedFile,
  FunctionInfo,
  ClassInfo,
  InterfaceInfo,
  ImportInfo,
  ExportInfo,
  TypeInfo,
  EnumInfo,
  PropertyInfo,
  ParamInfo,
  VariableInfo,
  ParserOptions
} from './types';

export class ASTParser {
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = {
      includeDocumentation: true,
      includePrivateMembers: false,
      maxDepth: 10,
      ...options
    };
  }

  /**
   * Parse a TypeScript/JavaScript file and extract structure
   */
  parseFile(filePath: string): ParsedFile {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const language = this.detectLanguage(filePath);

    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const result: ParsedFile = {
      filePath,
      language,
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
      enums: [],
      imports: [],
      exports: [],
      variables: []
    };

    this.visitNode(sourceFile, result);

    return result;
  }

  /**
   * Parse source code string directly
   */
  parseCode(sourceCode: string, fileName: string = 'temp.ts'): ParsedFile {
    const language = this.detectLanguage(fileName);

    const sourceFile = ts.createSourceFile(
      fileName,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const result: ParsedFile = {
      filePath: fileName,
      language,
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
      enums: [],
      imports: [],
      exports: [],
      variables: []
    };

    this.visitNode(sourceFile, result);

    return result;
  }

  /**
   * Visit AST node and extract information
   */
  private visitNode(node: ts.Node, result: ParsedFile): void {
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
        this.processFunctionDeclaration(node as ts.FunctionDeclaration, result);
        break;

      case ts.SyntaxKind.ClassDeclaration:
        this.processClassDeclaration(node as ts.ClassDeclaration, result);
        break;

      case ts.SyntaxKind.InterfaceDeclaration:
        this.processInterfaceDeclaration(node as ts.InterfaceDeclaration, result);
        break;

      case ts.SyntaxKind.TypeAliasDeclaration:
        this.processTypeAlias(node as ts.TypeAliasDeclaration, result);
        break;

      case ts.SyntaxKind.EnumDeclaration:
        this.processEnumDeclaration(node as ts.EnumDeclaration, result);
        break;

      case ts.SyntaxKind.ImportDeclaration:
        this.processImportDeclaration(node as ts.ImportDeclaration, result);
        break;

      case ts.SyntaxKind.ExportDeclaration:
      case ts.SyntaxKind.ExportAssignment:
        this.processExportDeclaration(node, result);
        break;

      case ts.SyntaxKind.VariableStatement:
        this.processVariableStatement(node as ts.VariableStatement, result);
        break;
    }

    // Recursively visit children
    ts.forEachChild(node, (child) => this.visitNode(child, result));
  }

  /**
   * Process function declaration
   */
  private processFunctionDeclaration(node: ts.FunctionDeclaration, result: ParsedFile): void {
    const name = node.name?.getText() || 'anonymous';
    const isExported = this.hasModifier(node, ts.SyntaxKind.ExportKeyword);
    const isAsync = this.hasModifier(node, ts.SyntaxKind.AsyncKeyword);

    const functionInfo: FunctionInfo = {
      name,
      type: 'function',
      params: this.extractParams(node.parameters),
      returnType: node.type ? node.type.getText() : undefined,
      isAsync,
      isExported,
      startLine: this.getLineNumber(node),
      endLine: this.getEndLineNumber(node),
      documentation: this.getDocumentation(node),
      modifiers: this.getModifiers(node)
    };

    result.functions.push(functionInfo);

    if (isExported) {
      result.exports.push({
        name,
        type: 'function',
        isDefault: this.hasModifier(node, ts.SyntaxKind.DefaultKeyword),
        startLine: this.getLineNumber(node)
      });
    }
  }

  /**
   * Process class declaration
   */
  private processClassDeclaration(node: ts.ClassDeclaration, result: ParsedFile): void {
    const name = node.name?.getText() || 'anonymous';
    const isExported = this.hasModifier(node, ts.SyntaxKind.ExportKeyword);
    const isAbstract = this.hasModifier(node, ts.SyntaxKind.AbstractKeyword);

    const classInfo: ClassInfo = {
      name,
      isExported,
      isAbstract,
      extends: this.getExtends(node),
      implements: this.getImplements(node),
      properties: [],
      methods: [],
      startLine: this.getLineNumber(node),
      endLine: this.getEndLineNumber(node),
      documentation: this.getDocumentation(node)
    };

    // Process class members
    node.members.forEach(member => {
      if (ts.isPropertyDeclaration(member)) {
        const property = this.processProperty(member);
        if (property && (this.options.includePrivateMembers || !property.modifiers.includes('private'))) {
          classInfo.properties.push(property);
        }
      } else if (ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member)) {
        const method = this.processMethod(member);
        if (method && (this.options.includePrivateMembers || !method.modifiers?.includes('private'))) {
          classInfo.methods.push(method);
        }
      }
    });

    result.classes.push(classInfo);

    if (isExported) {
      result.exports.push({
        name,
        type: 'class',
        isDefault: this.hasModifier(node, ts.SyntaxKind.DefaultKeyword),
        startLine: this.getLineNumber(node)
      });
    }
  }

  /**
   * Process interface declaration
   */
  private processInterfaceDeclaration(node: ts.InterfaceDeclaration, result: ParsedFile): void {
    const name = node.name.getText();
    const isExported = this.hasModifier(node, ts.SyntaxKind.ExportKeyword);

    const interfaceInfo: InterfaceInfo = {
      name,
      isExported,
      extends: this.getInterfaceExtends(node),
      properties: [],
      methods: [],
      startLine: this.getLineNumber(node),
      endLine: this.getEndLineNumber(node),
      documentation: this.getDocumentation(node)
    };

    // Process interface members
    node.members.forEach(member => {
      if (ts.isPropertySignature(member)) {
        const property = this.processPropertySignature(member);
        if (property) {
          interfaceInfo.properties.push(property);
        }
      } else if (ts.isMethodSignature(member)) {
        const method = this.processMethodSignature(member);
        if (method) {
          interfaceInfo.methods.push(method);
        }
      }
    });

    result.interfaces.push(interfaceInfo);

    if (isExported) {
      result.exports.push({
        name,
        type: 'interface',
        isDefault: false,
        startLine: this.getLineNumber(node)
      });
    }
  }

  /**
   * Process type alias
   */
  private processTypeAlias(node: ts.TypeAliasDeclaration, result: ParsedFile): void {
    const name = node.name.getText();
    const isExported = this.hasModifier(node, ts.SyntaxKind.ExportKeyword);

    const typeInfo: TypeInfo = {
      name,
      isExported,
      definition: node.type.getText(),
      startLine: this.getLineNumber(node),
      documentation: this.getDocumentation(node)
    };

    result.types.push(typeInfo);

    if (isExported) {
      result.exports.push({
        name,
        type: 'type',
        isDefault: false,
        startLine: this.getLineNumber(node)
      });
    }
  }

  /**
   * Process enum declaration
   */
  private processEnumDeclaration(node: ts.EnumDeclaration, result: ParsedFile): void {
    const name = node.name.getText();
    const isExported = this.hasModifier(node, ts.SyntaxKind.ExportKeyword);

    const enumInfo: EnumInfo = {
      name,
      isExported,
      members: node.members.map(member => ({
        name: member.name.getText(),
        value: member.initializer ? this.getEnumValue(member.initializer) : undefined
      })),
      startLine: this.getLineNumber(node),
      endLine: this.getEndLineNumber(node),
      documentation: this.getDocumentation(node)
    };

    result.enums.push(enumInfo);
  }

  /**
   * Process import declaration
   */
  private processImportDeclaration(node: ts.ImportDeclaration, result: ParsedFile): void {
    const moduleName = (node.moduleSpecifier as ts.StringLiteral).text;
    const imports: ImportInfo['imports'] = [];

    if (node.importClause) {
      // Default import
      if (node.importClause.name) {
        imports.push({
          name: node.importClause.name.getText(),
          isDefault: true,
          isNamespace: false
        });
      }

      // Named imports
      if (node.importClause.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // import * as name from 'module'
          imports.push({
            name: node.importClause.namedBindings.name.getText(),
            isDefault: false,
            isNamespace: true
          });
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          // import { a, b as c } from 'module'
          node.importClause.namedBindings.elements.forEach(element => {
            imports.push({
              name: element.name.getText(),
              alias: element.propertyName ? element.propertyName.getText() : undefined,
              isDefault: false,
              isNamespace: false
            });
          });
        }
      }
    }

    result.imports.push({
      moduleName,
      imports,
      startLine: this.getLineNumber(node)
    });
  }

  /**
   * Process export declaration
   */
  private processExportDeclaration(node: ts.Node, result: ParsedFile): void {
    // Export declarations are handled by individual declaration processors
    // This is a placeholder for re-exports like: export { foo } from './bar'
  }

  /**
   * Process variable statement
   */
  private processVariableStatement(node: ts.VariableStatement, result: ParsedFile): void {
    const isExported = this.hasModifier(node, ts.SyntaxKind.ExportKeyword);

    node.declarationList.declarations.forEach(declaration => {
      if (ts.isIdentifier(declaration.name)) {
        const name = declaration.name.getText();
        const kind = node.declarationList.flags & ts.NodeFlags.Const ? 'const' :
                     node.declarationList.flags & ts.NodeFlags.Let ? 'let' : 'var';

        const variableInfo: VariableInfo = {
          name,
          type: declaration.type ? declaration.type.getText() : undefined,
          kind,
          isExported,
          startLine: this.getLineNumber(declaration),
          initializer: declaration.initializer ? declaration.initializer.getText() : undefined
        };

        result.variables.push(variableInfo);

        if (isExported) {
          result.exports.push({
            name,
            type: 'variable',
            isDefault: false,
            startLine: this.getLineNumber(declaration)
          });
        }
      }
    });
  }

  /**
   * Process property declaration
   */
  private processProperty(node: ts.PropertyDeclaration): PropertyInfo | null {
    if (!node.name || !ts.isIdentifier(node.name)) return null;

    return {
      name: node.name.getText(),
      type: node.type ? node.type.getText() : undefined,
      modifiers: this.getModifiers(node),
      initializer: node.initializer ? node.initializer.getText() : undefined,
      documentation: this.getDocumentation(node)
    };
  }

  /**
   * Process property signature (interface)
   */
  private processPropertySignature(node: ts.PropertySignature): PropertyInfo | null {
    if (!node.name || !ts.isIdentifier(node.name)) return null;

    return {
      name: node.name.getText(),
      type: node.type ? node.type.getText() : undefined,
      modifiers: this.getModifiers(node),
      documentation: this.getDocumentation(node)
    };
  }

  /**
   * Process method declaration
   */
  private processMethod(node: ts.MethodDeclaration | ts.ConstructorDeclaration): FunctionInfo | null {
    const name = ts.isConstructorDeclaration(node) ? 'constructor' :
                 (node.name && ts.isIdentifier(node.name)) ? node.name.getText() : 'anonymous';

    const isAsync = this.hasModifier(node, ts.SyntaxKind.AsyncKeyword);

    return {
      name,
      type: ts.isConstructorDeclaration(node) ? 'constructor' : 'method',
      params: this.extractParams(node.parameters),
      returnType: node.type ? node.type.getText() : undefined,
      isAsync,
      isExported: false,
      startLine: this.getLineNumber(node),
      endLine: this.getEndLineNumber(node),
      documentation: this.getDocumentation(node),
      modifiers: this.getModifiers(node)
    };
  }

  /**
   * Process method signature (interface)
   */
  private processMethodSignature(node: ts.MethodSignature): FunctionInfo | null {
    if (!node.name || !ts.isIdentifier(node.name)) return null;

    return {
      name: node.name.getText(),
      type: 'method',
      params: this.extractParams(node.parameters),
      returnType: node.type ? node.type.getText() : undefined,
      isAsync: false,
      isExported: false,
      startLine: this.getLineNumber(node),
      endLine: this.getEndLineNumber(node),
      documentation: this.getDocumentation(node)
    };
  }

  /**
   * Extract function parameters
   */
  private extractParams(parameters: ts.NodeArray<ts.ParameterDeclaration>): ParamInfo[] {
    return parameters.map(param => ({
      name: param.name.getText(),
      type: param.type ? param.type.getText() : undefined,
      optional: !!param.questionToken,
      defaultValue: param.initializer ? param.initializer.getText() : undefined
    }));
  }

  /**
   * Get class extends
   */
  private getExtends(node: ts.ClassDeclaration): string | undefined {
    if (!node.heritageClauses) return undefined;

    for (const clause of node.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        return clause.types[0]?.expression.getText();
      }
    }

    return undefined;
  }

  /**
   * Get class implements
   */
  private getImplements(node: ts.ClassDeclaration): string[] | undefined {
    if (!node.heritageClauses) return undefined;

    for (const clause of node.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
        return clause.types.map(type => type.expression.getText());
      }
    }

    return undefined;
  }

  /**
   * Get interface extends
   */
  private getInterfaceExtends(node: ts.InterfaceDeclaration): string[] | undefined {
    if (!node.heritageClauses) return undefined;

    for (const clause of node.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        return clause.types.map(type => type.expression.getText());
      }
    }

    return undefined;
  }

  /**
   * Get enum value
   */
  private getEnumValue(initializer: ts.Expression): string | number {
    if (ts.isNumericLiteral(initializer)) {
      return parseInt(initializer.text);
    } else if (ts.isStringLiteral(initializer)) {
      return initializer.text;
    }
    return initializer.getText();
  }

  /**
   * Get JSDoc documentation
   */
  private getDocumentation(node: ts.Node): string | undefined {
    if (!this.options.includeDocumentation) return undefined;

    const jsDoc = (node as any).jsDoc;
    if (jsDoc && jsDoc.length > 0) {
      return jsDoc[0].comment || undefined;
    }

    return undefined;
  }

  /**
   * Get modifiers as string array
   */
  private getModifiers(node: ts.Node): string[] {
    const modifiers: string[] = [];

    if ((node as any).modifiers) {
      (node as any).modifiers.forEach((modifier: ts.Modifier) => {
        modifiers.push(ts.tokenToString(modifier.kind) || '');
      });
    }

    return modifiers;
  }

  /**
   * Check if node has specific modifier
   */
  private hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
    if (!(node as any).modifiers) return false;

    return (node as any).modifiers.some((modifier: ts.Modifier) => modifier.kind === kind);
  }

  /**
   * Get line number of node
   */
  private getLineNumber(node: ts.Node): number {
    const sourceFile = node.getSourceFile();
    if (!sourceFile) return 0;

    return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  }

  /**
   * Get end line number of node
   */
  private getEndLineNumber(node: ts.Node): number {
    const sourceFile = node.getSourceFile();
    if (!sourceFile) return 0;

    return sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.ts':
        return 'typescript';
      case '.tsx':
        return 'tsx';
      case '.js':
        return 'javascript';
      case '.jsx':
        return 'jsx';
      case '.mjs':
        return 'javascript-module';
      default:
        return 'javascript';
    }
  }

  /**
   * Get all symbol names in file (for quick reference)
   */
  getAllSymbols(parsedFile: ParsedFile): string[] {
    const symbols: string[] = [];

    parsedFile.functions.forEach(f => symbols.push(f.name));
    parsedFile.classes.forEach(c => symbols.push(c.name));
    parsedFile.interfaces.forEach(i => symbols.push(i.name));
    parsedFile.types.forEach(t => symbols.push(t.name));
    parsedFile.enums.forEach(e => symbols.push(e.name));
    parsedFile.variables.forEach(v => symbols.push(v.name));

    return symbols;
  }

  /**
   * Find symbol by name
   */
  findSymbol(parsedFile: ParsedFile, symbolName: string): any {
    const found =
      parsedFile.functions.find(f => f.name === symbolName) ||
      parsedFile.classes.find(c => c.name === symbolName) ||
      parsedFile.interfaces.find(i => i.name === symbolName) ||
      parsedFile.types.find(t => t.name === symbolName) ||
      parsedFile.enums.find(e => e.name === symbolName) ||
      parsedFile.variables.find(v => v.name === symbolName);

    return found;
  }
}

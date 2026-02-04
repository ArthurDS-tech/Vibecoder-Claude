/**
 * Type definitions for AST Parser
 */

export interface FunctionInfo {
  name: string;
  type: 'function' | 'method' | 'arrow' | 'constructor';
  params: ParamInfo[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  startLine: number;
  endLine: number;
  documentation?: string;
  modifiers?: string[]; // public, private, static, etc
}

export interface ParamInfo {
  name: string;
  type?: string;
  optional: boolean;
  defaultValue?: string;
}

export interface ClassInfo {
  name: string;
  isExported: boolean;
  isAbstract: boolean;
  extends?: string;
  implements?: string[];
  properties: PropertyInfo[];
  methods: FunctionInfo[];
  startLine: number;
  endLine: number;
  documentation?: string;
}

export interface PropertyInfo {
  name: string;
  type?: string;
  modifiers: string[]; // public, private, readonly, static, etc
  initializer?: string;
  documentation?: string;
}

export interface InterfaceInfo {
  name: string;
  isExported: boolean;
  extends?: string[];
  properties: PropertyInfo[];
  methods: FunctionInfo[];
  startLine: number;
  endLine: number;
  documentation?: string;
}

export interface ImportInfo {
  moduleName: string;
  imports: {
    name: string;
    alias?: string;
    isDefault: boolean;
    isNamespace: boolean;
  }[];
  startLine: number;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'variable' | 'type';
  isDefault: boolean;
  startLine: number;
}

export interface TypeInfo {
  name: string;
  isExported: boolean;
  definition: string;
  startLine: number;
  documentation?: string;
}

export interface EnumInfo {
  name: string;
  isExported: boolean;
  members: {
    name: string;
    value?: string | number;
  }[];
  startLine: number;
  endLine: number;
  documentation?: string;
}

export interface ParsedFile {
  filePath: string;
  language: string;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  types: TypeInfo[];
  enums: EnumInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  variables: VariableInfo[];
}

export interface VariableInfo {
  name: string;
  type?: string;
  kind: 'const' | 'let' | 'var';
  isExported: boolean;
  startLine: number;
  initializer?: string;
}

export interface ParserOptions {
  includeDocumentation?: boolean;
  includePrivateMembers?: boolean;
  maxDepth?: number;
}

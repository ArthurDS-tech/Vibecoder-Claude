/**
 * Type definitions for Git Integration
 */

export interface GitStatus {
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  created: string[];
  deleted: string[];
  modified: string[];
  renamed: { from: string; to: string }[];
  staged: string[];
  conflicted: string[];
  untracked: string[];
  clean: boolean;
}

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  files: string[];
}

export interface GitDiff {
  file: string;
  insertions: number;
  deletions: number;
  changes: number;
  diff: string;
  hunks: GitDiffHunk[];
}

export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
}

export interface GitDiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface GitBranch {
  name: string;
  current: boolean;
  commit: string;
  label: string;
}

export interface CommitMessageSuggestion {
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore';
  scope?: string;
  subject: string;
  body?: string;
  breaking?: string;
  fullMessage: string;
}

export interface GitFileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string;
  insertions: number;
  deletions: number;
}

export interface GitAnalysis {
  totalFiles: number;
  totalInsertions: number;
  totalDeletions: number;
  languages: Map<string, number>;
  mainChanges: string[];
  affectedAreas: string[];
}

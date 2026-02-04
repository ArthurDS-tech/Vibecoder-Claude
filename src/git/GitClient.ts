/**
 * Git Client - Git operations wrapper using simple-git
 */

import simpleGit, { SimpleGit, StatusResult, DiffResult, LogResult } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';
import {
  GitStatus,
  GitCommit,
  GitDiff,
  GitBranch,
  GitFileChange,
  GitAnalysis,
  CommitMessageSuggestion,
  GitDiffHunk,
  GitDiffLine
} from './types';

export class GitClient {
  private git: SimpleGit;
  private repoRoot: string;

  constructor(repoPath: string = process.cwd()) {
    this.repoRoot = repoPath;
    this.git = simpleGit(repoPath);
  }

  /**
   * Check if current directory is a git repository
   */
  async isRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get repository root path
   */
  async getRepositoryRoot(): Promise<string> {
    try {
      const root = await this.git.revparse(['--show-toplevel']);
      return root.trim();
    } catch {
      return this.repoRoot;
    }
  }

  /**
   * Get git status
   */
  async getStatus(): Promise<GitStatus> {
    const status: StatusResult = await this.git.status();

    return {
      current: status.current,
      tracking: status.tracking,
      ahead: status.ahead,
      behind: status.behind,
      created: status.created,
      deleted: status.deleted,
      modified: status.modified,
      renamed: status.renamed.map(r => ({ from: r.from, to: r.to })),
      staged: status.staged,
      conflicted: status.conflicted,
      untracked: status.not_added,
      clean: status.isClean()
    };
  }

  /**
   * Get modified files (including staged and unstaged)
   */
  async getModifiedFiles(): Promise<string[]> {
    const status = await this.getStatus();
    return [
      ...status.modified,
      ...status.created,
      ...status.deleted,
      ...status.staged
    ].filter((value, index, self) => self.indexOf(value) === index);
  }

  /**
   * Get staged files only
   */
  async getStagedFiles(): Promise<string[]> {
    const status = await this.getStatus();
    return status.staged;
  }

  /**
   * Get unstaged files
   */
  async getUnstagedFiles(): Promise<string[]> {
    const status = await this.getStatus();
    return [
      ...status.modified,
      ...status.created,
      ...status.deleted
    ].filter(file => !status.staged.includes(file));
  }

  /**
   * Get file diff
   */
  async getFileDiff(filePath: string, staged: boolean = false): Promise<string> {
    try {
      if (staged) {
        return await this.git.diff(['--cached', filePath]);
      } else {
        return await this.git.diff([filePath]);
      }
    } catch (error) {
      return '';
    }
  }

  /**
   * Get all diffs for modified files
   */
  async getAllDiffs(staged: boolean = false): Promise<GitDiff[]> {
    const files = staged ? await this.getStagedFiles() : await this.getModifiedFiles();
    const diffs: GitDiff[] = [];

    for (const file of files) {
      const diffContent = await this.getFileDiff(file, staged);
      if (diffContent) {
        const diff = this.parseDiff(file, diffContent);
        diffs.push(diff);
      }
    }

    return diffs;
  }

  /**
   * Parse git diff output
   */
  private parseDiff(file: string, diffContent: string): GitDiff {
    const lines = diffContent.split('\n');
    const hunks: GitDiffHunk[] = [];
    let insertions = 0;
    let deletions = 0;

    let currentHunk: GitDiffHunk | null = null;

    for (const line of lines) {
      // Parse hunk header: @@ -1,3 +1,4 @@
      if (line.startsWith('@@')) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
        if (match) {
          currentHunk = {
            oldStart: parseInt(match[1]),
            oldLines: parseInt(match[2] || '1'),
            newStart: parseInt(match[3]),
            newLines: parseInt(match[4] || '1'),
            lines: []
          };
        }
        continue;
      }

      if (currentHunk) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          insertions++;
          currentHunk.lines.push({
            type: 'add',
            content: line.substring(1)
          });
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletions++;
          currentHunk.lines.push({
            type: 'remove',
            content: line.substring(1)
          });
        } else if (line.startsWith(' ')) {
          currentHunk.lines.push({
            type: 'context',
            content: line.substring(1)
          });
        }
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return {
      file,
      insertions,
      deletions,
      changes: insertions + deletions,
      diff: diffContent,
      hunks
    };
  }

  /**
   * Get commit history
   */
  async getCommitHistory(limit: number = 10): Promise<GitCommit[]> {
    const log: LogResult = await this.git.log({ maxCount: limit });

    return log.all.map(commit => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: {
        name: commit.author_name,
        email: commit.author_email
      },
      files: []
    }));
  }

  /**
   * Get branches
   */
  async getBranches(): Promise<GitBranch[]> {
    const branches = await this.git.branch();

    return branches.all.map(name => ({
      name,
      current: name === branches.current,
      commit: branches.branches[name]?.commit || '',
      label: branches.branches[name]?.label || ''
    }));
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const branches = await this.git.branch();
    return branches.current;
  }

  /**
   * Stage files
   */
  async stageFiles(files: string[]): Promise<void> {
    await this.git.add(files);
  }

  /**
   * Stage all changes
   */
  async stageAll(): Promise<void> {
    await this.git.add('.');
  }

  /**
   * Unstage files
   */
  async unstageFiles(files: string[]): Promise<void> {
    await this.git.reset(['HEAD', ...files]);
  }

  /**
   * Commit changes
   */
  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return result.commit;
  }

  /**
   * Analyze changes for commit message suggestion
   */
  async analyzeChanges(): Promise<GitAnalysis> {
    const diffs = await this.getAllDiffs(true); // Analyze staged changes

    let totalInsertions = 0;
    let totalDeletions = 0;
    const languages = new Map<string, number>();
    const mainChanges: string[] = [];

    for (const diff of diffs) {
      totalInsertions += diff.insertions;
      totalDeletions += diff.deletions;

      // Count by file extension
      const ext = path.extname(diff.file);
      languages.set(ext, (languages.get(ext) || 0) + 1);

      // Track main changes
      if (diff.changes > 10) {
        mainChanges.push(diff.file);
      }
    }

    // Detect affected areas (directories)
    const affectedAreas = [
      ...new Set(diffs.map(d => path.dirname(d.file)))
    ];

    return {
      totalFiles: diffs.length,
      totalInsertions,
      totalDeletions,
      languages,
      mainChanges,
      affectedAreas
    };
  }

  /**
   * Generate conventional commit message suggestion
   */
  async suggestCommitMessage(useAI: boolean = false, aiContext?: string): Promise<CommitMessageSuggestion> {
    const analysis = await this.analyzeChanges();
    const diffs = await this.getAllDiffs(true);

    // Determine commit type based on changes
    let type: CommitMessageSuggestion['type'] = 'chore';
    let scope: string | undefined;

    // Simple heuristics
    if (diffs.some(d => d.file.includes('test'))) {
      type = 'test';
    } else if (diffs.some(d => d.file.endsWith('.md') || d.file.includes('doc'))) {
      type = 'docs';
    } else if (analysis.totalInsertions > analysis.totalDeletions * 2) {
      type = 'feat';
    } else if (diffs.some(d => d.file.includes('fix') || d.file.includes('bug'))) {
      type = 'fix';
    } else if (diffs.every(d => d.file.endsWith('.css') || d.file.endsWith('.scss'))) {
      type = 'style';
    } else if (analysis.totalDeletions > analysis.totalInsertions) {
      type = 'refactor';
    }

    // Determine scope from affected areas
    if (analysis.affectedAreas.length === 1) {
      scope = path.basename(analysis.affectedAreas[0]);
    }

    // Generate subject
    let subject = '';
    if (analysis.mainChanges.length > 0) {
      const mainFile = path.basename(analysis.mainChanges[0], path.extname(analysis.mainChanges[0]));
      subject = `update ${mainFile}`;
    } else {
      subject = `update ${analysis.totalFiles} file${analysis.totalFiles > 1 ? 's' : ''}`;
    }

    const fullMessage = scope
      ? `${type}(${scope}): ${subject}`
      : `${type}: ${subject}`;

    return {
      type,
      scope,
      subject,
      fullMessage
    };
  }

  /**
   * Get file changes with detailed statistics
   */
  async getFileChanges(): Promise<GitFileChange[]> {
    const diffs = await this.getAllDiffs(true);
    const status = await this.getStatus();

    return diffs.map(diff => {
      let fileStatus: GitFileChange['status'] = 'modified';

      if (status.created.includes(diff.file)) {
        fileStatus = 'added';
      } else if (status.deleted.includes(diff.file)) {
        fileStatus = 'deleted';
      } else if (status.renamed.some(r => r.to === diff.file)) {
        fileStatus = 'renamed';
      }

      return {
        path: diff.file,
        status: fileStatus,
        insertions: diff.insertions,
        deletions: diff.deletions
      };
    });
  }

  /**
   * Get summary statistics
   */
  async getSummary(): Promise<string> {
    const status = await this.getStatus();
    const analysis = await this.analyzeChanges();

    const parts: string[] = [];

    if (status.created.length > 0) {
      parts.push(`${status.created.length} file(s) created`);
    }
    if (status.modified.length > 0) {
      parts.push(`${status.modified.length} file(s) modified`);
    }
    if (status.deleted.length > 0) {
      parts.push(`${status.deleted.length} file(s) deleted`);
    }

    const summary = parts.join(', ') || 'No changes';
    return `${summary} (+${analysis.totalInsertions}/-${analysis.totalDeletions})`;
  }

  /**
   * Check if repository has uncommitted changes
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.getStatus();
    return !status.clean;
  }

  /**
   * Check if repository is ahead of remote
   */
  async isAheadOfRemote(): Promise<boolean> {
    const status = await this.getStatus();
    return status.ahead > 0;
  }

  /**
   * Get repository info
   */
  async getRepositoryInfo(): Promise<{
    isRepo: boolean;
    root?: string;
    branch?: string;
    hasChanges: boolean;
    ahead: number;
    behind: number;
  }> {
    const isRepo = await this.isRepository();

    if (!isRepo) {
      return {
        isRepo: false,
        hasChanges: false,
        ahead: 0,
        behind: 0
      };
    }

    const root = await this.getRepositoryRoot();
    const branch = await this.getCurrentBranch();
    const status = await this.getStatus();

    return {
      isRepo: true,
      root,
      branch,
      hasChanges: !status.clean,
      ahead: status.ahead,
      behind: status.behind
    };
  }
}

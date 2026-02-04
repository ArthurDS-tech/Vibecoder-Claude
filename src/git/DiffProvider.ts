/**
 * Diff Provider - AI-powered git diff analysis and commit message generation
 */

import { GitClient } from './GitClient';
import { AIEngine } from '../ai/engine/AIEngine';
import { CommitMessageSuggestion, GitDiff, GitAnalysis } from './types';

export class DiffProvider {
  constructor(
    private gitClient: GitClient,
    private ai?: AIEngine
  ) {}

  /**
   * Generate AI-powered commit message
   */
  async generateCommitMessage(): Promise<CommitMessageSuggestion> {
    const diffs = await this.gitClient.getAllDiffs(true);
    const analysis = await this.gitClient.analyzeChanges();

    // If no AI engine, use simple heuristic
    if (!this.ai) {
      return await this.gitClient.suggestCommitMessage(false);
    }

    // Use AI to analyze diffs and generate message
    const diffSummary = this.createDiffSummary(diffs, analysis);

    const prompt = `Analyze the following git changes and generate a conventional commit message.

${diffSummary}

Generate a commit message following the Conventional Commits specification:
- Type: feat, fix, docs, style, refactor, test, chore
- Scope (optional): affected module/component
- Subject: brief description in imperative mood
- Body (optional): detailed explanation if needed

Respond in JSON format:
{
  "type": "feat|fix|docs|style|refactor|test|chore",
  "scope": "optional scope",
  "subject": "brief description",
  "body": "optional detailed explanation",
  "breaking": "optional breaking change description"
}`;

    try {
      const response = await this.ai.chat([
        {
          role: 'system',
          content: 'You are a git commit message expert. Generate clear, concise conventional commit messages.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]);

      const result = this.parseAIResponse(response.content);
      return result;
    } catch (error) {
      // Fallback to heuristic-based generation
      return await this.gitClient.suggestCommitMessage(false);
    }
  }

  /**
   * Generate detailed commit body
   */
  async generateCommitBody(): Promise<string> {
    const diffs = await this.gitClient.getAllDiffs(true);
    const analysis = await this.gitClient.analyzeChanges();

    if (!this.ai) {
      return this.generateSimpleBody(diffs, analysis);
    }

    const diffSummary = this.createDiffSummary(diffs, analysis);

    const prompt = `Analyze these code changes and generate a detailed commit message body.

${diffSummary}

Write a clear, informative commit body that:
1. Explains what changed and why
2. Lists key modifications
3. Mentions any side effects or considerations
4. Keep it concise but informative

Format as plain text, suitable for a git commit message body.`;

    try {
      const response = await this.ai.chat([
        {
          role: 'system',
          content: 'You are a technical writer specializing in git commit messages.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]);

      return response.content.trim();
    } catch (error) {
      return this.generateSimpleBody(diffs, analysis);
    }
  }

  /**
   * Analyze changes and suggest improvements
   */
  async analyzeChangesForReview(): Promise<{
    summary: string;
    concerns: string[];
    suggestions: string[];
  }> {
    const diffs = await this.gitClient.getAllDiffs(true);
    const analysis = await this.gitClient.analyzeChanges();

    if (!this.ai) {
      return {
        summary: await this.gitClient.getSummary(),
        concerns: [],
        suggestions: []
      };
    }

    const diffSummary = this.createDetailedDiffSummary(diffs);

    const prompt = `Review these code changes and provide analysis.

${diffSummary}

Provide:
1. A brief summary of what changed
2. Any concerns or potential issues
3. Suggestions for improvement

Respond in JSON format:
{
  "summary": "brief summary of changes",
  "concerns": ["concern 1", "concern 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    try {
      const response = await this.ai.chat([
        {
          role: 'system',
          content: 'You are a senior code reviewer analyzing git changes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]);

      const result = JSON.parse(response.content);
      return {
        summary: result.summary || await this.gitClient.getSummary(),
        concerns: result.concerns || [],
        suggestions: result.suggestions || []
      };
    } catch (error) {
      return {
        summary: await this.gitClient.getSummary(),
        concerns: [],
        suggestions: []
      };
    }
  }

  /**
   * Create concise diff summary for AI
   */
  private createDiffSummary(diffs: GitDiff[], analysis: GitAnalysis): string {
    const parts: string[] = [];

    parts.push(`Files changed: ${analysis.totalFiles}`);
    parts.push(`Insertions: +${analysis.totalInsertions}`);
    parts.push(`Deletions: -${analysis.totalDeletions}`);
    parts.push('');

    parts.push('Modified files:');
    diffs.slice(0, 10).forEach(diff => {
      parts.push(`  ${diff.file} (+${diff.insertions}/-${diff.deletions})`);
    });

    if (diffs.length > 10) {
      parts.push(`  ... and ${diffs.length - 10} more files`);
    }

    parts.push('');
    parts.push('Affected areas:');
    analysis.affectedAreas.slice(0, 5).forEach(area => {
      parts.push(`  ${area}`);
    });

    return parts.join('\n');
  }

  /**
   * Create detailed diff summary with code snippets
   */
  private createDetailedDiffSummary(diffs: GitDiff[]): string {
    const parts: string[] = [];

    diffs.slice(0, 5).forEach(diff => {
      parts.push(`\nFile: ${diff.file}`);
      parts.push(`Changes: +${diff.insertions}/-${diff.deletions}`);
      parts.push('');

      // Include first few hunks
      diff.hunks.slice(0, 2).forEach(hunk => {
        parts.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);

        hunk.lines.slice(0, 10).forEach(line => {
          const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
          parts.push(`${prefix}${line.content}`);
        });

        if (hunk.lines.length > 10) {
          parts.push(`... ${hunk.lines.length - 10} more lines`);
        }
      });

      if (diff.hunks.length > 2) {
        parts.push(`... ${diff.hunks.length - 2} more hunks`);
      }
    });

    if (diffs.length > 5) {
      parts.push(`\n... and ${diffs.length - 5} more files`);
    }

    return parts.join('\n');
  }

  /**
   * Parse AI response for commit message
   */
  private parseAIResponse(content: string): CommitMessageSuggestion {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        const type = parsed.type || 'chore';
        const scope = parsed.scope;
        const subject = parsed.subject || 'update code';
        const body = parsed.body;
        const breaking = parsed.breaking;

        const fullMessage = scope
          ? `${type}(${scope}): ${subject}`
          : `${type}: ${subject}`;

        return {
          type,
          scope,
          subject,
          body,
          breaking,
          fullMessage
        };
      }
    } catch (error) {
      // Parsing failed, extract from text
    }

    // Fallback: try to parse from text
    const lines = content.split('\n').filter(l => l.trim());
    const firstLine = lines[0] || 'chore: update code';

    const match = firstLine.match(/^(feat|fix|docs|style|refactor|test|chore)(?:\(([^)]+)\))?: (.+)$/);
    if (match) {
      return {
        type: match[1] as any,
        scope: match[2],
        subject: match[3],
        fullMessage: firstLine
      };
    }

    // Final fallback
    return {
      type: 'chore',
      subject: 'update code',
      fullMessage: 'chore: update code'
    };
  }

  /**
   * Generate simple commit body without AI
   */
  private generateSimpleBody(diffs: GitDiff[], analysis: GitAnalysis): string {
    const parts: string[] = [];

    parts.push('Changes:');
    diffs.slice(0, 5).forEach(diff => {
      parts.push(`- ${diff.file}: +${diff.insertions}/-${diff.deletions}`);
    });

    if (diffs.length > 5) {
      parts.push(`- ... and ${diffs.length - 5} more files`);
    }

    parts.push('');
    parts.push(`Total: ${analysis.totalFiles} files changed, ${analysis.totalInsertions} insertions(+), ${analysis.totalDeletions} deletions(-)`);

    return parts.join('\n');
  }

  /**
   * Get diff statistics
   */
  async getDiffStatistics(): Promise<{
    files: number;
    insertions: number;
    deletions: number;
    largest: string;
    languageBreakdown: Map<string, number>;
  }> {
    const analysis = await this.gitClient.analyzeChanges();
    const diffs = await this.gitClient.getAllDiffs(true);

    let largest = '';
    let largestChanges = 0;

    diffs.forEach(diff => {
      if (diff.changes > largestChanges) {
        largestChanges = diff.changes;
        largest = diff.file;
      }
    });

    return {
      files: analysis.totalFiles,
      insertions: analysis.totalInsertions,
      deletions: analysis.totalDeletions,
      largest,
      languageBreakdown: analysis.languages
    };
  }
}

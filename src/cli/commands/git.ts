/**
 * Git Command - Git operations with AI assistance
 */

import { Command } from 'commander';
import * as chalk from 'chalk';
import { GitClient } from '../../git/GitClient';
import { DiffProvider } from '../../git/DiffProvider';
import { AIEngine } from '../../ai/engine/AIEngine';
import { loadConfig } from '../core/config';

export function registerGitCommand(program: Command) {
  const git = program
    .command('git')
    .description('Git operations with AI assistance')
    .action(() => {
      git.help();
    });

  // git status - Enhanced git status
  git
    .command('status')
    .description('Show git status with enhanced information')
    .option('-v, --verbose', 'Show verbose output')
    .action(async (options) => {
      try {
        const gitClient = new GitClient();

        // Check if repository
        if (!(await gitClient.isRepository())) {
          console.error(chalk.red('❌ Not a git repository'));
          process.exit(1);
        }

        const info = await gitClient.getRepositoryInfo();
        const status = await gitClient.getStatus();

        console.log(chalk.bold('\n📊 Git Status\n'));
        console.log(chalk.cyan('Branch:'), info.branch);

        if (info.ahead > 0) {
          console.log(chalk.yellow(`Ahead: ${info.ahead} commits`));
        }
        if (info.behind > 0) {
          console.log(chalk.yellow(`Behind: ${info.behind} commits`));
        }

        console.log('');

        if (status.created.length > 0) {
          console.log(chalk.green.bold('Created files:'));
          status.created.forEach(f => console.log(chalk.green(`  + ${f}`)));
        }

        if (status.modified.length > 0) {
          console.log(chalk.yellow.bold('Modified files:'));
          status.modified.forEach(f => console.log(chalk.yellow(`  M ${f}`)));
        }

        if (status.deleted.length > 0) {
          console.log(chalk.red.bold('Deleted files:'));
          status.deleted.forEach(f => console.log(chalk.red(`  - ${f}`)));
        }

        if (status.staged.length > 0) {
          console.log(chalk.blue.bold('Staged files:'));
          status.staged.forEach(f => console.log(chalk.blue(`  S ${f}`)));
        }

        if (status.untracked.length > 0 && options.verbose) {
          console.log(chalk.gray.bold('Untracked files:'));
          status.untracked.forEach(f => console.log(chalk.gray(`  ? ${f}`)));
        }

        if (status.clean) {
          console.log(chalk.green('\n✅ Working tree clean'));
        } else {
          console.log(chalk.yellow(`\n⚠️  ${await gitClient.getSummary()}`));
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // git commit-msg - Generate AI-powered commit message
  git
    .command('commit-msg')
    .description('Generate AI-powered commit message for staged changes')
    .option('--no-ai', 'Generate without AI (heuristic-based)')
    .action(async (options) => {
      try {
        const gitClient = new GitClient();

        if (!(await gitClient.isRepository())) {
          console.error(chalk.red('❌ Not a git repository'));
          process.exit(1);
        }

        const stagedFiles = await gitClient.getStagedFiles();
        if (stagedFiles.length === 0) {
          console.error(chalk.red('❌ No staged files. Use git add first.'));
          process.exit(1);
        }

        console.log(chalk.bold('\n🤖 Generating commit message...\n'));

        let diffProvider: DiffProvider;

        if (options.ai !== false) {
          // Load AI config
          const config = await loadConfig();

          if (!config.apiKey) {
            console.error(chalk.red('❌ No API key found. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.'));
            process.exit(1);
          }

          const ai = new AIEngine({
            provider: config.provider,
            model: config.model,
            apiKey: config.apiKey,
            maxTokens: config.maxTokens,
            temperature: config.temperature
          });

          diffProvider = new DiffProvider(gitClient, ai);
        } else {
          diffProvider = new DiffProvider(gitClient);
        }

        const suggestion = await diffProvider.generateCommitMessage();

        console.log(chalk.cyan('Type:'), chalk.bold(suggestion.type));
        if (suggestion.scope) {
          console.log(chalk.cyan('Scope:'), suggestion.scope);
        }
        console.log(chalk.cyan('Subject:'), suggestion.subject);

        console.log(chalk.bold('\n📝 Suggested commit message:\n'));
        console.log(chalk.green(suggestion.fullMessage));

        if (suggestion.body) {
          console.log('\n' + chalk.gray(suggestion.body));
        }

        if (suggestion.breaking) {
          console.log(chalk.red.bold('\n⚠️  BREAKING CHANGE:'));
          console.log(chalk.red(suggestion.breaking));
        }

        console.log(chalk.gray('\nTo use this message, copy it or run:'));
        console.log(chalk.gray(`git commit -m "${suggestion.fullMessage}"`));

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // git analyze - Analyze staged changes
  git
    .command('analyze')
    .description('Analyze staged changes with AI')
    .action(async () => {
      try {
        const gitClient = new GitClient();

        if (!(await gitClient.isRepository())) {
          console.error(chalk.red('❌ Not a git repository'));
          process.exit(1);
        }

        const stagedFiles = await gitClient.getStagedFiles();
        if (stagedFiles.length === 0) {
          console.error(chalk.red('❌ No staged files. Use git add first.'));
          process.exit(1);
        }

        console.log(chalk.bold('\n🔍 Analyzing changes...\n'));

        const analysis = await gitClient.analyzeChanges();

        console.log(chalk.cyan('Total files:'), analysis.totalFiles);
        console.log(chalk.green(`Insertions: +${analysis.totalInsertions}`));
        console.log(chalk.red(`Deletions: -${analysis.totalDeletions}`));
        console.log('');

        if (analysis.mainChanges.length > 0) {
          console.log(chalk.yellow.bold('Main changes:'));
          analysis.mainChanges.forEach(f => console.log(chalk.yellow(`  • ${f}`)));
          console.log('');
        }

        if (analysis.affectedAreas.length > 0) {
          console.log(chalk.blue.bold('Affected areas:'));
          analysis.affectedAreas.forEach(a => console.log(chalk.blue(`  • ${a}`)));
          console.log('');
        }

        if (analysis.languages.size > 0) {
          console.log(chalk.magenta.bold('Languages:'));
          analysis.languages.forEach((count, lang) => {
            console.log(chalk.magenta(`  • ${lang}: ${count} file(s)`));
          });
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // git review - AI review of staged changes
  git
    .command('review')
    .description('AI-powered review of staged changes')
    .action(async () => {
      try {
        const gitClient = new GitClient();

        if (!(await gitClient.isRepository())) {
          console.error(chalk.red('❌ Not a git repository'));
          process.exit(1);
        }

        const stagedFiles = await gitClient.getStagedFiles();
        if (stagedFiles.length === 0) {
          console.error(chalk.red('❌ No staged files. Use git add first.'));
          process.exit(1);
        }

        console.log(chalk.bold('\n🔎 Reviewing changes with AI...\n'));

        // Load AI config
        const config = await loadConfig();

        if (!config.apiKey) {
          console.error(chalk.red('❌ No API key found. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.'));
          process.exit(1);
        }

        const ai = new AIEngine({
          provider: config.provider,
          model: config.model,
          apiKey: config.apiKey,
          maxTokens: config.maxTokens,
          temperature: config.temperature
        });

        const diffProvider = new DiffProvider(gitClient, ai);
        const review = await diffProvider.analyzeChangesForReview();

        console.log(chalk.bold('📊 Summary:\n'));
        console.log(review.summary);
        console.log('');

        if (review.concerns.length > 0) {
          console.log(chalk.red.bold('⚠️  Concerns:\n'));
          review.concerns.forEach(c => console.log(chalk.red(`  • ${c}`)));
          console.log('');
        }

        if (review.suggestions.length > 0) {
          console.log(chalk.green.bold('💡 Suggestions:\n'));
          review.suggestions.forEach(s => console.log(chalk.green(`  • ${s}`)));
          console.log('');
        }

        if (review.concerns.length === 0 && review.suggestions.length === 0) {
          console.log(chalk.green('✅ Changes look good!'));
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // git diff - Show diffs with statistics
  git
    .command('diff')
    .description('Show diffs with enhanced statistics')
    .option('-s, --staged', 'Show staged changes only')
    .option('--stats', 'Show statistics only')
    .action(async (options) => {
      try {
        const gitClient = new GitClient();

        if (!(await gitClient.isRepository())) {
          console.error(chalk.red('❌ Not a git repository'));
          process.exit(1);
        }

        const diffs = await gitClient.getAllDiffs(options.staged);

        if (diffs.length === 0) {
          console.log(chalk.yellow('No changes to show'));
          return;
        }

        console.log(chalk.bold(`\n📄 Showing ${diffs.length} changed file(s)\n`));

        for (const diff of diffs) {
          console.log(chalk.cyan.bold(`\n${diff.file}`));
          console.log(chalk.gray(`  +${diff.insertions} -${diff.deletions} (${diff.changes} changes)`));

          if (!options.stats) {
            // Show first hunk preview
            if (diff.hunks.length > 0) {
              const hunk = diff.hunks[0];
              console.log(chalk.gray(`  @@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`));

              hunk.lines.slice(0, 5).forEach(line => {
                const prefix = line.type === 'add' ? chalk.green('+') :
                              line.type === 'remove' ? chalk.red('-') :
                              chalk.gray(' ');
                console.log(`  ${prefix} ${line.content.substring(0, 80)}`);
              });

              if (hunk.lines.length > 5) {
                console.log(chalk.gray(`  ... ${hunk.lines.length - 5} more lines`));
              }
            }
          }
        }

        // Total statistics
        const totalInsertions = diffs.reduce((sum, d) => sum + d.insertions, 0);
        const totalDeletions = diffs.reduce((sum, d) => sum + d.deletions, 0);

        console.log(chalk.bold(`\n📊 Total: ${diffs.length} files, +${totalInsertions}/-${totalDeletions}\n`));

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // git info - Show repository information
  git
    .command('info')
    .description('Show repository information')
    .action(async () => {
      try {
        const gitClient = new GitClient();

        if (!(await gitClient.isRepository())) {
          console.error(chalk.red('❌ Not a git repository'));
          process.exit(1);
        }

        const info = await gitClient.getRepositoryInfo();
        const branches = await gitClient.getBranches();
        const history = await gitClient.getCommitHistory(5);

        console.log(chalk.bold('\n📁 Repository Information\n'));
        console.log(chalk.cyan('Root:'), info.root);
        console.log(chalk.cyan('Current branch:'), chalk.bold(info.branch));
        console.log(chalk.cyan('Has changes:'), info.hasChanges ? chalk.yellow('Yes') : chalk.green('No'));

        if (info.ahead > 0) {
          console.log(chalk.cyan('Ahead:'), chalk.yellow(`${info.ahead} commits`));
        }
        if (info.behind > 0) {
          console.log(chalk.cyan('Behind:'), chalk.yellow(`${info.behind} commits`));
        }

        console.log(chalk.bold('\n🌿 Branches:\n'));
        branches.slice(0, 5).forEach(branch => {
          const marker = branch.current ? chalk.green('*') : ' ';
          console.log(`${marker} ${branch.name}`);
        });

        if (branches.length > 5) {
          console.log(chalk.gray(`... and ${branches.length - 5} more branches`));
        }

        console.log(chalk.bold('\n📜 Recent commits:\n'));
        history.forEach(commit => {
          console.log(chalk.yellow(commit.hash.substring(0, 7)), chalk.gray('-'), commit.message);
          console.log(chalk.gray(`   ${commit.author.name} - ${new Date(commit.date).toLocaleString()}`));
        });

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });
}

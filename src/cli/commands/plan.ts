import { Command } from 'commander';
import ora from 'ora';
import { AIClient } from '../core/ai-client';
import { ContextBuilder } from '../core/context';
import { Logger } from '../utils/logger';
import { handleError } from '../utils/errors';

const PLANNER_SYSTEM_PROMPT = `You are a technical planner for software development.
Your job is to analyze the user's request and create a detailed implementation plan.

Respond in JSON format:
{
  "goal": "clear description of what will be built",
  "steps": [
    {
      "description": "what needs to be done",
      "files": ["list of files to create/modify"],
      "risks": ["potential issues to watch for"]
    }
  ],
  "estimatedComplexity": "low|medium|high",
  "warnings": ["important considerations"]
}`;

export function createPlanCommand(
  aiClient: AIClient,
  contextBuilder: ContextBuilder
): Command {
  const command = new Command('plan');

  command
    .description('Generate a technical plan for implementing a feature')
    .argument('<intent>', 'What you want to build')
    .option('-c, --context', 'Include project context in the plan')
    .action(async (intent: string, options) => {
      try {
        let prompt = `Create a technical plan for: ${intent}`;

        if (options.context) {
          const spinner = ora('Reading project context...').start();
          const context = await contextBuilder.buildContext();
          spinner.text = 'Analyzing project...';
          
          prompt += '\n\nProject context:\n' + contextBuilder.formatContext(context);
          spinner.stop();
        }

        const spinner = ora('Creating plan...').start();
        const response = await aiClient.ask(prompt, PLANNER_SYSTEM_PROMPT);
        spinner.stop();

        Logger.newline();
        Logger.section('Implementation Plan');

        try {
          const plan = JSON.parse(response);
          
          Logger.info(`Goal: ${plan.goal}`);
          Logger.info(`Complexity: ${plan.estimatedComplexity}`);
          Logger.newline();

          Logger.section('Steps');
          plan.steps.forEach((step: any, i: number) => {
            console.log(`\n${i + 1}. ${step.description}`);
            console.log(`   Files: ${step.files.join(', ')}`);
            if (step.risks.length > 0) {
              console.log(`   Risks: ${step.risks.join(', ')}`);
            }
          });

          if (plan.warnings.length > 0) {
            Logger.newline();
            Logger.section('Warnings');
            plan.warnings.forEach((w: string) => Logger.warn(w));
          }
        } catch {
          // If not valid JSON, just print the response
          console.log(response);
        }

        Logger.newline();
      } catch (error) {
        handleError(error);
      }
    });

  return command;
}

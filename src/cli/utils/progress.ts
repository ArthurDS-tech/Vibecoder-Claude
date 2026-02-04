import chalk from 'chalk';

export interface ProgressStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}

export class ProgressTracker {
  private steps: ProgressStep[] = [];
  private currentStepIndex: number = -1;

  constructor(steps: string[]) {
    this.steps = steps.map(name => ({
      name,
      status: 'pending' as const
    }));
  }

  start(stepIndex: number, message?: string): void {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.steps[stepIndex].status = 'running';
      this.steps[stepIndex].message = message;
      this.currentStepIndex = stepIndex;
      this.render();
    }
  }

  complete(stepIndex: number, message?: string): void {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.steps[stepIndex].status = 'completed';
      this.steps[stepIndex].message = message;
      this.render();
    }
  }

  error(stepIndex: number, message: string): void {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.steps[stepIndex].status = 'error';
      this.steps[stepIndex].message = message;
      this.render();
    }
  }

  private render(): void {
    // Limpar linha anterior
    process.stdout.write('\r\x1b[K');
    
    const output: string[] = [];
    
    this.steps.forEach((step, index) => {
      let icon = '';
      let color = chalk.gray;
      
      switch (step.status) {
        case 'pending':
          icon = '○';
          color = chalk.gray;
          break;
        case 'running':
          icon = '◐';
          color = chalk.cyan;
          break;
        case 'completed':
          icon = '✓';
          color = chalk.green;
          break;
        case 'error':
          icon = '✗';
          color = chalk.red;
          break;
      }
      
      const stepText = step.message || step.name;
      output.push(color(`${icon} ${stepText}`));
    });
    
    console.log('\n' + output.join('\n'));
  }

  clear(): void {
    console.log('');
  }
}

export class SimpleProgress {
  private steps: string[];
  private current: number = 0;
  private isFirstStep: boolean = true;

  constructor(steps: string[]) {
    this.steps = steps;
  }

  next(message?: string): void {
    if (!this.isFirstStep) {
      // Completar step anterior - limpar linha e mostrar ✓
      process.stdout.write('\r\x1b[K'); // Limpar linha
      const prevMessage = this.steps[this.current - 1];
      process.stdout.write(chalk.green(`✓ ${prevMessage}\n`));
    } else {
      this.isFirstStep = false;
    }
    
    if (this.current < this.steps.length) {
      const stepMessage = message || this.steps[this.current];
      process.stdout.write(chalk.cyan(`◐ ${stepMessage}...`));
      this.current++;
    }
  }

  complete(): void {
    if (this.current > 0) {
      // Completar último step
      process.stdout.write('\r\x1b[K'); // Limpar linha
      const lastMessage = this.steps[this.current - 1];
      process.stdout.write(chalk.green(`✓ ${lastMessage}\n`));
    }
    console.log('');
  }

  error(message: string): void {
    process.stdout.write('\r\x1b[K'); // Limpar linha
    process.stdout.write(chalk.red(`✗ ${message}\n\n`));
  }
}

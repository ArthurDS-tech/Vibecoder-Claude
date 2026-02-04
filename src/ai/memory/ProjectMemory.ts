import * as fs from 'fs';
import * as path from 'path';

export interface ProjectMemoryData {
  stack: string[];
  architecture: string;
  codeStyle: Record<string, any>;
  decisions: Decision[];
  preferences: Record<string, any>;
}

export interface Decision {
  date: string;
  description: string;
  rationale: string;
}

export class ProjectMemory {
  private memoryPath: string;
  private data: ProjectMemoryData;

  constructor(projectRoot: string) {
    this.memoryPath = path.join(projectRoot, '.vibecode', 'memory.json');
    this.data = this.load();
  }

  private load(): ProjectMemoryData {
    if (fs.existsSync(this.memoryPath)) {
      const content = fs.readFileSync(this.memoryPath, 'utf-8');
      return JSON.parse(content);
    }

    return {
      stack: [],
      architecture: '',
      codeStyle: {},
      decisions: [],
      preferences: {},
    };
  }

  save(): void {
    const dir = path.dirname(this.memoryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.memoryPath, JSON.stringify(this.data, null, 2));
  }

  addDecision(description: string, rationale: string): void {
    this.data.decisions.push({
      date: new Date().toISOString(),
      description,
      rationale,
    });
    this.save();
  }

  setStack(stack: string[]): void {
    this.data.stack = stack;
    this.save();
  }

  setArchitecture(architecture: string): void {
    this.data.architecture = architecture;
    this.save();
  }

  getContext(): string {
    return `
Stack: ${this.data.stack.join(', ')}
Arquitetura: ${this.data.architecture}
Decisões recentes: ${this.data.decisions.slice(-5).map(d => d.description).join(', ')}
    `.trim();
  }

  getData(): ProjectMemoryData {
    return this.data;
  }
}

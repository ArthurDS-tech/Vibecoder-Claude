import * as fs from 'fs';
import * as path from 'path';
import {
  Convention,
  ProjectMemory,
  ProjectConventions,
  TaskRecord,
} from '../../shared/types/memory.types';

const MEMORY_DIRECTORY = '.vibecoding';
const MEMORY_FILE = 'memory.json';

const DEFAULT_MEMORY: ProjectMemory = {
  projectConventions: {},
  conventions: [],
  architecturalDecisions: [],
  userPreferences: {
    verbosity: 'normal',
    preferDiffs: true,
    autoApproveMinorRefactors: false,
  },
  taskHistory: [],
  knownIssues: [],
};

export class MemoryStore {
  private readonly memoryPath: string;

  constructor(private readonly projectRoot: string) {
    this.memoryPath = path.join(projectRoot, MEMORY_DIRECTORY, MEMORY_FILE);
  }

  load(): ProjectMemory {
    if (!fs.existsSync(this.memoryPath)) {
      return this.cloneDefaultMemory();
    }

    const raw = fs.readFileSync(this.memoryPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ProjectMemory>;

    return {
      ...this.cloneDefaultMemory(),
      ...parsed,
      projectConventions: {
        ...DEFAULT_MEMORY.projectConventions,
        ...(parsed.projectConventions || {}),
      },
      userPreferences: {
        ...DEFAULT_MEMORY.userPreferences,
        ...(parsed.userPreferences || {}),
      },
      conventions: parsed.conventions || [],
      architecturalDecisions: parsed.architecturalDecisions || [],
      taskHistory: parsed.taskHistory || [],
      knownIssues: parsed.knownIssues || [],
    };
  }

  save(memory: ProjectMemory): void {
    fs.mkdirSync(path.dirname(this.memoryPath), { recursive: true });
    fs.writeFileSync(this.memoryPath, JSON.stringify(memory, null, 2));
  }

  ensureInitialized(): ProjectMemory {
    const memory = this.load();

    if (!fs.existsSync(this.memoryPath)) {
      this.save(memory);
    }

    return memory;
  }

  updateConventions(updates: Partial<ProjectConventions>): ProjectMemory {
    const memory = this.load();
    memory.projectConventions = {
      ...memory.projectConventions,
      ...updates,
    };
    this.save(memory);
    return memory;
  }

  mergeDetectedConventions(conventions: Convention[]): ProjectMemory {
    const memory = this.load();
    const existing = new Map(
      memory.conventions.map((entry) => [this.getConventionKey(entry), entry])
    );

    for (const convention of conventions) {
      const key = this.getConventionKey(convention);
      if (!existing.has(key)) {
        existing.set(key, convention);
      }
    }

    memory.conventions = Array.from(existing.values());
    this.save(memory);
    return memory;
  }

  recordTask(task: TaskRecord): ProjectMemory {
    const memory = this.load();
    memory.taskHistory.push(task);
    this.save(memory);
    return memory;
  }

  getPath(): string {
    return this.memoryPath;
  }

  private cloneDefaultMemory(): ProjectMemory {
    return JSON.parse(JSON.stringify(DEFAULT_MEMORY)) as ProjectMemory;
  }

  private getConventionKey(convention: Convention): string {
    return `${convention.category}:${convention.value}`;
  }
}

export interface Convention {
  category: string;
  value: string;
  source?: string;
  confidence?: 'low' | 'medium' | 'high';
}

export interface ArchitecturalDecision {
  date: string;
  decision: string;
  reasoning: string;
  affectedModules: string[];
}

export interface TaskRecord {
  taskId: string;
  completedAt: string;
  result: 'success' | 'failure';
  loopAttempts: number;
  filesModified: string[];
}

export interface KnownIssue {
  file: string;
  issue: string;
  workaround?: string;
}

export interface ProjectConventions {
  namingStyle?: string;
  moduleExportStyle?: string;
  errorHandlingPattern?: string;
  testFramework?: string;
  packageManager?: string;
}

export interface UserPreferences {
  verbosity: 'minimal' | 'normal' | 'detailed';
  preferDiffs: boolean;
  autoApproveMinorRefactors: boolean;
}

export interface ProjectMemory {
  projectConventions: ProjectConventions;
  conventions: Convention[];
  architecturalDecisions: ArchitecturalDecision[];
  userPreferences: UserPreferences;
  taskHistory: TaskRecord[];
  knownIssues: KnownIssue[];
}

// Command types and enums
export enum Command {
  // IA & Geração
  ASK = 'ask',
  CHAT = 'chat',
  PLAN = 'plan',
  GENERATE = 'generate',
  GEN = 'gen',
  
  // Análise
  REVIEW = 'review',
  EXPLAIN = 'explain',
  DEBUG = 'debug',
  SECURITY = 'security',
  
  // Melhorias
  REFACTOR = 'refactor',
  OPTIMIZE = 'optimize',
  TEST = 'test',
  DOCS = 'docs',
  
  // Utilitários
  CONVERT = 'convert',
  COMPARE = 'compare',
  CONTEXT = 'context',
  MEMORY = 'memory',
  
  // Arquivos
  READ = 'read',
  WRITE = 'write',
  EDIT = 'edit',
  RM = 'rm',
  DELETE = 'delete',
  MKDIR = 'mkdir',
  TREE = 'tree',
  SEARCH = 'search',
  CAT = 'cat',
  TOUCH = 'touch',
  
  // Projetos
  CREATE = 'create',
  CLONE = 'clone',
  GIT = 'git',
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
  
  // Sistema
  CONFIG = 'config',
  HISTORY = 'history',
  SAVE = 'save',
  LOAD = 'load',
  
  // Navegação
  CD = 'cd',
  LS = 'ls',
  PWD = 'pwd',
  CLEAR = 'clear',
  HELP = 'help',
  EXIT = 'exit',
  QUIT = 'quit',
  
  // Novos
  INSTALL = 'install',
  RUN = 'run',
  BUILD = 'build',
  STATUS = 'status',
  INFO = 'info',
  VERSION = 'version',
}

export interface TerminalState {
  history: string[];
  historyIndex: number;
  currentDir: string;
  context: any;
  memory: any;
}

export interface SessionData {
  history: string[];
  currentDir: string;
  conversation: Array<{ role: string; content: string }>;
  timestamp: string;
}

export interface ProjectType {
  name: string;
  command: string;
  description: string;
}

export const PROJECT_TYPES: Record<string, ProjectType> = {
  react: {
    name: 'React',
    command: 'npx create-react-app',
    description: 'React application',
  },
  next: {
    name: 'Next.js',
    command: 'npx create-next-app',
    description: 'Next.js application',
  },
  vite: {
    name: 'Vite',
    command: 'npm create vite@latest',
    description: 'Vite project',
  },
  node: {
    name: 'Node.js',
    command: 'npm init -y',
    description: 'Node.js project',
  },
  express: {
    name: 'Express',
    command: 'npx express-generator',
    description: 'Express application',
  },
  vue: {
    name: 'Vue',
    command: 'npm create vue@latest',
    description: 'Vue application',
  },
};

export interface CommandContext {
  command: Command;
  args: string[];
  rawInput: string;
}

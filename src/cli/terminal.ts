#!/usr/bin/env node

import readline from 'readline';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from './core/config';
import { AIClient } from './core/ai-client';
import { ContextBuilder } from './core/context';
import { ProjectMemory } from '../ai/memory/ProjectMemory';
import ora from 'ora';
import { SimpleProgress } from './utils/progress';
import { ResponseFormatter } from './utils/response-formatter';
import { TokenOptimizer } from './utils/token-optimizer';
import { FileNavigator } from './utils/file-navigator';
import { AutocompleteManager } from './utils/autocomplete';
import { ProviderSwitcher } from './utils/provider-switcher';
import { UltraAgent } from './utils/ultra-agent';

const execAsync = promisify(exec);

interface TerminalState {
  history: string[];
  historyIndex: number;
  currentDir: string;
  context: any;
  memory: ProjectMemory;
}

export class VibeCodeTerminal {
  private rl: readline.Interface;
  private state: TerminalState;
  private configManager: ConfigManager;
  private aiClient: AIClient;
  private contextBuilder: ContextBuilder;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private autocompleteManager: AutocompleteManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.aiClient = new AIClient(this.configManager);
    this.contextBuilder = new ContextBuilder(this.configManager);

    this.state = {
      history: [],
      historyIndex: 0,
      currentDir: process.cwd(),
      context: null,
      memory: new ProjectMemory(process.cwd()),
    };

    // Lista MÍNIMA de comandos essenciais
    const allCommands = [
      // COMANDO PRINCIPAL
      'vibe',
      // Navegação básica
      'cd', 'ls', 'tree',
      // Sistema
      'switch', 'config', 'help', 'clear', 'exit'
    ];

    this.autocompleteManager = new AutocompleteManager({
      commands: allCommands,
      currentDir: this.state.currentDir
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt(),
      completer: this.completer.bind(this),
      terminal: true
    });

    this.setupKeyBindings();
    this.setupAutocomplete();
  }

  private getPrompt(): string {
    const dir = path.basename(this.state.currentDir);
    return chalk.blue(dir) + chalk.gray(' › ');
  }

  private setupKeyBindings(): void {
    // Arrow up - previous command
    this.rl.on('line', (line: string) => {
      if (line.trim()) {
        this.state.history.push(line);
        this.state.historyIndex = this.state.history.length;
      }
    });
  }

  private setupAutocomplete(): void {
    // O autocomplete é gerenciado pelo método completer()
    // Não precisa de configuração adicional
  }

  private completer(line: string): [string[], string] {
    const suggestions = this.autocompleteManager.getSuggestions(line);
    
    // Se não há sugestões, retornar vazio
    if (suggestions.length === 0) {
      return [[], line];
    }
    
    // Para comandos, retornar sugestões completas
    const parts = line.split(' ');
    if (parts.length === 1) {
      return [suggestions, line];
    }
    
    // Para arquivos, precisamos construir o caminho completo
    const lastPart = parts[parts.length - 1];
    const prefix = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '');
    
    // Se o último parte tem caminho, manter o diretório
    let completions: string[];
    if (lastPart.includes('/') || lastPart.includes('\\')) {
      const dirPath = path.dirname(lastPart);
      completions = suggestions.map(s => prefix + path.join(dirPath, s).replace(/\\/g, '/'));
    } else {
      completions = suggestions.map(s => prefix + s);
    }
    
    return [completions, line];
  }

  async start(): Promise<void> {
    this.showWelcome();
    await this.loadConfig();
    this.rl.prompt();

    this.rl.on('line', async (input: string) => {
      await this.handleCommand(input.trim());
      this.rl.setPrompt(this.getPrompt());
      this.rl.prompt();
    });

this.rl.on('close', () => {
  console.log(chalk.gray('\nGoodbye!\n'));
  process.exit(0);
});
  }

  private showWelcome(): void {
    console.clear();
    
    // Logo ASCII minimalista
    console.log('');
    console.log(chalk.bold.blue('  ╭─────────────────────────────────╮'));
    console.log(chalk.bold.blue('  │') + chalk.bold.white('         VibeCode  AI          ') + chalk.bold.blue('│'));
    console.log(chalk.bold.blue('  ╰─────────────────────────────────╯'));
    console.log('');
    
    const version = '1.0.0';
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    console.log(chalk.gray('  AI-powered development terminal'));
    console.log(chalk.gray(`  v${version} • ${date}`));
    console.log('');
    
    // Quick start
    console.log(chalk.bold.white('  Quick Start'));
    console.log('');
    console.log(chalk.gray('  →') + chalk.white(' vibe ') + chalk.gray('"your task here"'));
    console.log(chalk.gray('  →') + chalk.white(' help ') + chalk.gray('for all commands'));
    console.log(chalk.gray('  →') + chalk.white(' switch ') + chalk.gray('to change AI provider'));
    console.log('');
  }

  private async loadConfig(): Promise<void> {
    try {
      await this.configManager.reload();
      const config = await this.configManager.load();
      
      // Status discreto
      const providerName = config.provider === 'anthropic' ? 'Claude' : 'OpenAI';
      const modelShort = config.model.includes('sonnet') ? 'Sonnet' : 
                         config.model.includes('opus') ? 'Opus' :
                         config.model.includes('haiku') ? 'Haiku' :
                         config.model.includes('gpt-4') ? 'GPT-4' : config.model;
      
      console.log(chalk.gray('  ✓ Connected to ') + chalk.green(providerName) + chalk.gray(' · ') + chalk.white(modelShort));
      console.log('');
    } catch (error) {
      console.log('');
      console.log(chalk.yellow('  ⚠  API key not configured'));
      console.log('');
      console.log(chalk.gray('  Setup:'));
      console.log(chalk.white('    config set apiKey ') + chalk.gray('YOUR_KEY'));
      console.log(chalk.white('    config set provider ') + chalk.gray('openai|anthropic'));
      console.log('');
    }
  }

  private async handleCommand(input: string): Promise<void> {
    if (!input) return;

    const parts = input.split(' ');
    const rawCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Aliases MÍNIMOS
    const commandAliases: Record<string, string> = {
      'v': 'vibe',
      'ajuda': 'help',
      'sair': 'exit',
      'limpar': 'clear',
      'trocar': 'switch'
    };

    const command = commandAliases[rawCommand] || rawCommand;

    if (['hello', 'hi', 'hey'].includes(rawCommand)) {
      console.log(chalk.gray('\n  Hello! Use ') + chalk.white('vibe') + chalk.gray(' to get started.\n'));
      return;
    }

    try {
      switch (command) {
        case 'help':
          this.showSimpleHelp();
          break;

        case 'clear':
          console.clear();
          this.showWelcome();
          break;

        case 'exit':
        case 'quit':
          this.rl.close();
          break;

        case 'cd':
          await this.changeDirectory(args[0]);
          break;

        case 'ls':
          await this.listFiles();
          break;

        case 'tree':
          await this.showTree();
          break;

        case 'vibe':
          await this.runUltraAgent(args.join(' '));
          break;

        case 'switch':
          await this.switchProvider();
          break;

        case 'config':
          await this.manageConfig(args);
          break;

        default:
          console.log(chalk.red(`  Command not found: ${command}`));
          console.log(chalk.gray('  Try ') + chalk.white('help') + chalk.gray(' for available commands'));
          console.log('');
      }
    } catch (error) {
      console.log(chalk.red(`  Error: ${(error as Error).message}`));
      console.log('');
    }
  }

  private showHelp(): void {
    console.log('');
    console.log(chalk.bold('Commands'));
    console.log('');
    
    console.log(chalk.blue('  vibe') + chalk.gray(' <task>'));
    console.log(chalk.gray('    AI-powered task execution'));
    console.log(chalk.gray('    Example: ') + chalk.white('vibe "fix bugs in auth module"'));
    console.log('');
    
    console.log(chalk.blue('  cd') + chalk.gray(' <directory>'));
    console.log(chalk.gray('    Change directory'));
    console.log('');
    
    console.log(chalk.blue('  ls'));
    console.log(chalk.gray('    List files'));
    console.log('');
    
    console.log(chalk.blue('  tree'));
    console.log(chalk.gray('    Show file tree'));
    console.log('');
    
    console.log(chalk.blue('  switch'));
    console.log(chalk.gray('    Switch AI provider'));
    console.log('');
    
    console.log(chalk.blue('  config'));
    console.log(chalk.gray('    View configuration'));
    console.log('');
    
    console.log(chalk.blue('  clear'));
    console.log(chalk.gray('    Clear terminal'));
    console.log('');
    
    console.log(chalk.blue('  exit'));
    console.log(chalk.gray('    Exit VibeCode'));
    console.log('');
  }

  private async changeDirectory(dir: string): Promise<void> {
    if (!dir) {
      console.log(chalk.gray('  ' + this.state.currentDir));
      console.log('');
      return;
    }

    const newDir = path.resolve(this.state.currentDir, dir);
    
    if (fs.existsSync(newDir) && fs.statSync(newDir).isDirectory()) {
      this.state.currentDir = newDir;
      process.chdir(newDir);
      this.autocompleteManager.updateCurrentDir(newDir);
      console.log(chalk.gray('  Changed to ') + chalk.white(path.basename(newDir)));
      console.log('');
    } else {
      console.log(chalk.red(`  Directory not found: ${dir}`));
      console.log('');
    }
  }

  private async listFiles(): Promise<void> {
    const nodes = FileNavigator.listDirectory(this.state.currentDir, { detailed: true });
    
    console.log('');
    
    nodes.forEach(node => {
      const icon = node.type === 'directory' ? chalk.blue('▸') : chalk.gray('·');
      const name = node.type === 'directory' ? chalk.blue(node.name) : chalk.white(node.name);
      
      let line = `  ${icon} ${name}`;
      
      if (node.size !== undefined && node.type !== 'directory') {
        const size = FileNavigator.formatSize(node.size);
        line += chalk.gray(` · ${size}`);
      }
      
      console.log(line);
    });
    
    console.log('');
    console.log(chalk.gray(`  ${nodes.length} items`));
    console.log('');
  }

  private async askAI(question: string): Promise<void> {
    if (!question) {
      console.log(chalk.red('✗ Forneça uma pergunta'));
      return;
    }

    // Progresso com steps
    const progress = new SimpleProgress([
      'Analisando pergunta',
      'Construindo contexto',
      'Consultando IA',
      'Processando resposta'
    ]);
    
    try {
      progress.next();
      
      // Otimizar pergunta
      const optimizedQuestion = TokenOptimizer.optimizePrompt(question);
      
      progress.next();
      
      // Construir contexto mínimo
      const context = await this.contextBuilder.buildContext();
      const contextStr = TokenOptimizer.compressContext(
        this.contextBuilder.formatContext(context),
        1000
      );
      
      progress.next();
      
      const fullPrompt = `${optimizedQuestion}\n\nContexto:\n${contextStr}`;
      const response = await this.aiClient.ask(fullPrompt);
      
      progress.next();
      progress.complete();
      
      // Formatar resposta no estilo Claude Code
      ResponseFormatter.formatAIResponse(response, 'ask');
      
    } catch (error) {
      ResponseFormatter.formatError((error as Error).message);
    }
  }

  private async startChat(): Promise<void> {
    console.log(chalk.hex('#FF00FF')('\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#00D9FF')('  💬 MODO CHAT ATIVADO'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  • Digite sua mensagem e pressione Enter'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  • Digite "exit" para voltar ao terminal'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  • A IA tem acesso ao seu código'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('╚════════════════════════════════════════════════════════╝\n'));
    
    // Pausar o readline principal
    this.rl.pause();
    
    const chatRl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.hex('#00D9FF')('╭─') + chalk.hex('#FF00FF')('[') + chalk.bold.hex('#FFD700')('Chat') + chalk.hex('#FF00FF')(']') + chalk.hex('#00D9FF')('\n╰─▶ ')
    });

    chatRl.prompt();

    const handleLine = async (input: string) => {
      const trimmed = input.trim();

      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'sair') {
        chatRl.close();
        console.log(chalk.hex('#00D9FF')('\n✓ Voltando ao terminal\n'));
        // Retomar o readline principal
        this.rl.resume();
        this.rl.prompt();
        return;
      }

      if (!trimmed) {
        chatRl.prompt();
        return;
      }

      try {
        // Add context about current directory and files
        const context = await this.contextBuilder.buildContext();
        const contextStr = this.contextBuilder.formatContext(context);
        
        const systemPrompt = `Você é o VibeCode AI Assistant.
Você tem acesso ao código do projeto e pode:
- Criar novos arquivos
- Modificar arquivos existentes
- Explicar código
- Sugerir melhorias
- Debugar problemas

Contexto do projeto:
${contextStr}

Diretório atual: ${this.state.currentDir}

Quando sugerir código, seja específico sobre qual arquivo criar/modificar.`;

        this.conversationHistory.push({ role: 'user', content: trimmed });

        const spinner = ora({
          text: 'Pensando...',
          color: 'cyan',
          spinner: 'dots12'
        }).start();
        
        const messages = [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory.slice(-10), // Last 10 messages
        ];

        const response = await this.aiClient.chat(messages as any);
        this.conversationHistory.push({ role: 'assistant', content: response });

        spinner.stop();
        
        // Design profissional sem emoji
        const terminalWidth = process.stdout.columns || 80;
        const boxWidth = Math.min(terminalWidth - 4, 100);
        
        console.log('');
        console.log(chalk.hex('#00D9FF')('╭' + '─'.repeat(boxWidth - 2) + '╮'));
        console.log(chalk.hex('#00D9FF')('│') + chalk.bold.hex('#00FF00')(' IA ASSISTANT'.padEnd(boxWidth - 2)) + chalk.hex('#00D9FF')('│'));
        console.log(chalk.hex('#00D9FF')('├' + '─'.repeat(boxWidth - 2) + '┤'));
        
        // Quebrar resposta em linhas
        const lines = response.split('\n');
        lines.forEach(line => {
          if (line.trim() === '') {
            console.log(chalk.hex('#00D9FF')('│') + ' '.repeat(boxWidth - 2) + chalk.hex('#00D9FF')('│'));
          } else {
            // Quebrar linhas longas
            const words = line.split(' ');
            let currentLine = '';
            
            words.forEach(word => {
              if ((currentLine + word).length > boxWidth - 6) {
                console.log(chalk.hex('#00D9FF')('│ ') + chalk.white(currentLine.padEnd(boxWidth - 4)) + chalk.hex('#00D9FF')(' │'));
                currentLine = word + ' ';
              } else {
                currentLine += word + ' ';
              }
            });
            
            if (currentLine.trim()) {
              console.log(chalk.hex('#00D9FF')('│ ') + chalk.white(currentLine.trim().padEnd(boxWidth - 4)) + chalk.hex('#00D9FF')(' │'));
            }
          }
        });
        
        console.log(chalk.hex('#00D9FF')('╰' + '─'.repeat(boxWidth - 2) + '╯'));
        console.log('');
      } catch (error) {
        console.log(chalk.red(`\n✗ Erro: ${(error as Error).message}\n`));
      }

      chatRl.prompt();
    };

    chatRl.on('line', handleLine);

    chatRl.on('close', () => {
      // Retomar o readline principal
      this.rl.resume();
    });
  }

  private async createPlan(intent: string): Promise<void> {
    if (!intent) {
      console.log(chalk.red('✗ Descreva o que quer planejar'));
      return;
    }

    const progress = new SimpleProgress([
      'Analisando requisitos',
      'Construindo contexto do projeto',
      'Gerando plano técnico',
      'Estruturando resposta'
    ]);
    
    try {
      progress.next();
      
      const optimizedIntent = TokenOptimizer.optimizePrompt(intent);
      
      progress.next();
      
      const context = await this.contextBuilder.buildContext();
      const contextStr = TokenOptimizer.compressContext(
        this.contextBuilder.formatContext(context),
        1500
      );
      
      progress.next();
      
      const prompt = `Crie um plano técnico detalhado para: ${optimizedIntent}\n\nContexto do projeto:\n${contextStr}\n\nO plano deve incluir:\n1. Análise de requisitos\n2. Arquitetura proposta\n3. Passos de implementação\n4. Arquivos a criar/modificar\n5. Testes necessários`;
      
      const response = await this.aiClient.ask(prompt);
      
      progress.next();
      progress.complete();
      
      ResponseFormatter.formatAIResponse(response, 'ask');
      
    } catch (error) {
      ResponseFormatter.formatError((error as Error).message);
    }
  }

  private async generateCode(description: string): Promise<void> {
    if (!description) {
      console.log(chalk.red('✗ Descreva o código a gerar'));
      return;
    }

    const progress = new SimpleProgress([
      'Analisando descrição',
      'Verificando contexto',
      'Gerando código',
      'Formatando resultado'
    ]);
    
    try {
      progress.next();
      
      const optimizedDesc = TokenOptimizer.optimizePrompt(description);
      
      progress.next();
      
      const context = await this.contextBuilder.buildContext();
      const contextStr = TokenOptimizer.compressContext(
        this.contextBuilder.formatContext(context),
        1000
      );
      
      progress.next();
      
      const prompt = `Gere código para: ${optimizedDesc}\n\nContexto:\n${contextStr}\n\nRetorne apenas o código, sem explicações adicionais.`;
      const response = await this.aiClient.ask(prompt);
      
      progress.next();
      progress.complete();
      
      ResponseFormatter.formatAIResponse(response, 'ask');
      
    } catch (error) {
      ResponseFormatter.formatError((error as Error).message);
    }
  }

  private async reviewFile(file: string): Promise<void> {
    if (!file || !fs.existsSync(file)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const spinner = ora('Revisando código...').start();
    
    try {
      const response = await this.aiClient.ask(`Revise este código:\n\n${content}`);
      spinner.stop();
      
      console.log(chalk.cyan(`\n🔍 Revisão: ${file}\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async explainFile(file: string): Promise<void> {
    if (!file || !fs.existsSync(file)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const spinner = ora('Analisando...').start();
    
    try {
      const response = await this.aiClient.ask(`Explique este código:\n\n${content}`);
      spinner.stop();
      
      console.log(chalk.cyan(`\n📖 Explicação: ${file}\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async debugFile(file: string, error: string): Promise<void> {
    if (!file || !fs.existsSync(file)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const spinner = ora('Debugando...').start();
    
    try {
      let prompt = `Debug este código:\n\n${content}`;
      if (error) prompt += `\n\nErro: ${error}`;
      
      const response = await this.aiClient.ask(prompt);
      spinner.stop();
      
      console.log(chalk.cyan(`\n🐛 Debug: ${file}\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async refactorFile(file: string): Promise<void> {
    if (!file || !fs.existsSync(file)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const spinner = ora('Refatorando...').start();
    
    try {
      const response = await this.aiClient.ask(`Refatore este código:\n\n${content}`);
      spinner.stop();
      
      console.log(chalk.cyan(`\n⚡ Refatorado: ${file}\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async optimizeFile(file: string): Promise<void> {
    if (!file || !fs.existsSync(file)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const spinner = ora('Otimizando...').start();
    
    try {
      const response = await this.aiClient.ask(`Otimize este código:\n\n${content}`);
      spinner.stop();
      
      console.log(chalk.cyan(`\n🚀 Otimizado: ${file}\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async securityScan(file: string): Promise<void> {
    if (!file || !fs.existsSync(file)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const spinner = ora('Analisando segurança...').start();
    
    try {
      const response = await this.aiClient.ask(`Analise segurança:\n\n${content}`);
      spinner.stop();
      
      console.log(chalk.cyan(`\n🔒 Segurança: ${file}\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async generateTests(file: string): Promise<void> {
    if (!file || !fs.existsSync(file)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const spinner = ora('Gerando testes...').start();
    
    try {
      const response = await this.aiClient.ask(`Gere testes para:\n\n${content}`);
      spinner.stop();
      
      console.log(chalk.cyan(`\n🧪 Testes: ${file}\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async generateDocs(file: string): Promise<void> {
    if (!file || !fs.existsSync(file)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const spinner = ora('Gerando documentação...').start();
    
    try {
      const response = await this.aiClient.ask(`Gere documentação para:\n\n${content}`);
      spinner.stop();
      
      console.log(chalk.cyan(`\n📚 Documentação: ${file}\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async convertCode(file: string, targetLang: string): Promise<void> {
    if (!file || !fs.existsSync(file)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }
    if (!targetLang) {
      console.log(chalk.red('✗ Especifique a linguagem alvo'));
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const spinner = ora(`Convertendo para ${targetLang}...`).start();
    
    try {
      const response = await this.aiClient.ask(`Converta para ${targetLang}:\n\n${content}`);
      spinner.stop();
      
      console.log(chalk.cyan(`\n🔄 Convertido para ${targetLang}:\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async compareFiles(file1: string, file2: string): Promise<void> {
    if (!file1 || !fs.existsSync(file1)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file1}`));
      return;
    }
    if (!file2 || !fs.existsSync(file2)) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file2}`));
      return;
    }

    const content1 = fs.readFileSync(file1, 'utf-8');
    const content2 = fs.readFileSync(file2, 'utf-8');
    const spinner = ora('Comparando...').start();
    
    try {
      const response = await this.aiClient.ask(`Compare:\n\nArquivo 1:\n${content1}\n\nArquivo 2:\n${content2}`);
      spinner.stop();
      
      console.log(chalk.cyan(`\n⚖️  Comparação:\n`));
      console.log(response);
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async showContext(): Promise<void> {
    const spinner = ora('Carregando contexto...').start();
    
    try {
      const context = await this.contextBuilder.buildContext();
      spinner.stop();
      
      console.log(chalk.cyan('\n📦 Contexto do Projeto:\n'));
      console.log(chalk.gray(`  Arquivos: ${context.fileCount}`));
      console.log(chalk.gray(`  Tamanho: ${(context.totalSize / 1024).toFixed(2)}KB\n`));
      
      context.files.forEach(f => {
        console.log(chalk.blue(`  ${f.path}`));
      });
      console.log('');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private showMemory(): void {
    console.log(chalk.cyan('\n🧠 Memória do Projeto:\n'));
    console.log(this.state.memory.getContext());
    console.log('');
  }

  private showHistory(): void {
    console.log(chalk.cyan('\n📜 Histórico de Comandos:\n'));
    
    this.state.history.forEach((cmd, i) => {
      console.log(chalk.gray(`  ${i + 1}. ${cmd}`));
    });
    console.log('');
  }

  private async manageConfig(args: string[]): Promise<void> {
    const subcommand = args[0];
    
    if (!subcommand || subcommand === 'list') {
      // Mostrar configuração atual de forma bonita
      const config = await this.configManager.load();
      const tokenUsage = await this.configManager.getTokenUsage();
      
      console.log(chalk.hex('#FF00FF')('\n╔════════════════════════════════════════════════════════╗'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#00D9FF')('  ⚙️  CONFIGURAÇÃO DO VIBECODE'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      
      // Provider
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Provider:       ') + chalk.white(config.provider.padEnd(38)) + chalk.hex('#FF00FF')('║'));
      
      // Model
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Model:          ') + chalk.white(config.model.padEnd(38)) + chalk.hex('#FF00FF')('║'));
      
      // API Key (mascarada)
      if (config.apiKey) {
        const masked = '****' + config.apiKey.slice(-4);
        console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  API Key:        ') + chalk.green(`✓ ${masked}`.padEnd(38)) + chalk.hex('#FF00FF')('║'));
      } else {
        console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  API Key:        ') + chalk.red('✗ Não configurada'.padEnd(38)) + chalk.hex('#FF00FF')('║'));
      }
      
      // Max Tokens
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Max Tokens:     ') + chalk.white(String(config.maxTokens || 4096).padEnd(38)) + chalk.hex('#FF00FF')('║'));
      
      // Temperature
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Temperature:    ') + chalk.white(String(config.temperature || 0.7).padEnd(38)) + chalk.hex('#FF00FF')('║'));
      
      // Uso de Tokens
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#FFD700')('  💰 USO DE TOKENS'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      
      const totalTokensStr = (tokenUsage?.totalTokens || 0).toLocaleString('pt-BR');
      const totalCostStr = `$${(tokenUsage?.totalCost || 0).toFixed(4)}`;
      const remainingBudget = 4 - (tokenUsage?.totalCost || 0);
      const remainingStr = `$${remainingBudget.toFixed(4)}`;
      
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Total de Tokens:') + chalk.hex('#00D9FF')(` ${totalTokensStr}`.padEnd(39)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Custo Total:    ') + chalk.hex('#FFD700')(` ${totalCostStr}`.padEnd(39)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Orçamento:      ') + chalk.white(' $4.00'.padEnd(39)) + chalk.hex('#FF00FF')('║'));
      
      if (remainingBudget > 0) {
        console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Restante:       ') + chalk.green(` ${remainingStr}`.padEnd(39)) + chalk.hex('#FF00FF')('║'));
      } else {
        console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Restante:       ') + chalk.red(` ${remainingStr}`.padEnd(39)) + chalk.hex('#FF00FF')('║'));
      }
      
      // Barra de progresso
      const percentage = Math.min(((tokenUsage?.totalCost || 0) / 4) * 100, 100);
      const barLength = 40;
      const filledLength = Math.round((percentage / 100) * barLength);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      
      let barColor = chalk.green;
      if (percentage > 75) barColor = chalk.red;
      else if (percentage > 50) barColor = chalk.yellow;
      
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Uso:            ') + barColor(bar.substring(0, 38).padEnd(38)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + ''.padEnd(56) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray(`  ${percentage.toFixed(1)}% do orçamento utilizado`.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.white('  📋 COMANDOS DISPONÍVEIS'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  config set <key> <value>  ') + chalk.white('- Definir configuração'.padEnd(28)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  config get <key>          ') + chalk.white('- Ver configuração'.padEnd(28)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  config api                ') + chalk.white('- Gerenciar provider'.padEnd(28)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  config keys               ') + chalk.white('- Gerenciar API keys'.padEnd(28)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  config test               ') + chalk.white('- Testar conexão'.padEnd(28)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  config usage              ') + chalk.white('- Ver histórico de uso'.padEnd(28)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  config reset-usage        ') + chalk.white('- Resetar contador'.padEnd(28)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╚════════════════════════════════════════════════════════╝'));
      console.log('');
      
    } else if (subcommand === 'usage') {
      await this.showTokenUsageHistory();
      
    } else if (subcommand === 'reset-usage') {
      await this.configManager.resetTokenUsage();
      console.log(chalk.green('\n✓ Contador de tokens resetado!\n'));
      
    } else if (subcommand === 'keys') {
      // Gerenciamento de API keys
      await this.manageApiKeys();
      
    } else if (subcommand === 'api') {
      // Gerenciamento de provider (OpenAI/Claude)
      if (args[1] === 'openai') {
        await this.configManager.set('provider', 'openai');
        await this.configManager.set('model', 'gpt-4');
        console.log(chalk.green('\n✓ Provider alterado para OpenAI (GPT-4)'));
        console.log(chalk.gray('Configure sua API key: config set apiKey sk-...\n'));
      } else if (args[1] === 'claude' || args[1] === 'anthropic') {
        await this.configManager.set('provider', 'anthropic');
        await this.configManager.set('model', 'claude-3-5-sonnet-20240620');
        console.log(chalk.green('\n✓ Provider alterado para Anthropic (Claude 3.5 Sonnet)'));
        console.log(chalk.gray('Configure sua API key: config set apiKey sk-ant-...\n'));
      } else {
        await this.manageProvider();
      }
      
    } else if (subcommand === 'test') {
      // Testar conexão com IA
      await this.testAIConnection();
      
    } else if (subcommand === 'reset') {
      // Resetar configuração
      console.log(chalk.yellow('\n⚠️  Tem certeza que deseja resetar a configuração? (s/n)'));
      // TODO: Implementar confirmação
      console.log(chalk.gray('Funcionalidade em desenvolvimento\n'));
      
    } else if (subcommand === 'set' && args[1] && args[2]) {
      await this.configManager.set(args[1] as any, args[2]);
      console.log(chalk.green(`\n✓ ${args[1]} configurado com sucesso\n`));
      
    } else if (subcommand === 'get' && args[1]) {
      const value = await this.configManager.get(args[1] as any);
      
      // Mascarar se for API key
      if (args[1] === 'apiKey' && value) {
        console.log(chalk.gray('\n' + '****' + value.slice(-4) + '\n'));
      } else {
        console.log(chalk.gray('\n' + value + '\n'));
      }
      
    } else {
      console.log(chalk.red('\n✗ Uso: config [list|set|get|keys|test|reset] [key] [value]\n'));
    }
  }

  private async manageApiKeys(): Promise<void> {
    console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.white('  🔑 GERENCIAMENTO DE API KEYS'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    
    const config = await this.configManager.load();
    
    // Mostrar provider atual
    console.log(chalk.cyan('║') + chalk.gray('  Provider Atual: ') + chalk.white(config.provider.padEnd(38)) + chalk.cyan('║'));
    
    // Status da API key
    if (config.apiKey) {
      const masked = '****' + config.apiKey.slice(-4);
      console.log(chalk.cyan('║') + chalk.gray('  API Key:        ') + chalk.green(`✓ Configurada (${masked})`.padEnd(38)) + chalk.cyan('║'));
    } else {
      console.log(chalk.cyan('║') + chalk.gray('  API Key:        ') + chalk.red('✗ Não configurada'.padEnd(38)) + chalk.cyan('║'));
    }
    
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║') + chalk.bold.white('  📝 COMO CONFIGURAR'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    
    // OpenAI
    console.log(chalk.cyan('║') + chalk.bold.yellow('  OpenAI:'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    1. Acesse: ') + chalk.blue('https://platform.openai.com/api-keys'.padEnd(42)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    2. Crie uma nova API key'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    3. Execute: ') + chalk.white('config set apiKey sk-...'.padEnd(42)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    4. Execute: ') + chalk.white('config set provider openai'.padEnd(42)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + ''.padEnd(56) + chalk.cyan('║'));
    
    // Anthropic
    console.log(chalk.cyan('║') + chalk.bold.yellow('  Anthropic (Claude):'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    1. Acesse: ') + chalk.blue('https://console.anthropic.com/'.padEnd(42)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    2. Crie uma nova API key'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    3. Execute: ') + chalk.white('config set apiKey sk-ant-...'.padEnd(42)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    4. Execute: ') + chalk.white('config set provider anthropic'.padEnd(42)) + chalk.cyan('║'));
    
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║') + chalk.bold.white('  💰 GERENCIAR USO'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║') + chalk.gray('  OpenAI Usage:   ') + chalk.blue('https://platform.openai.com/usage'.padEnd(38)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('  Anthropic Usage:') + chalk.blue('https://console.anthropic.com/'.padEnd(38)) + chalk.cyan('║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝'));
    console.log('');
  }

  private async testAIConnection(): Promise<void> {
    console.log(chalk.cyan('\n🔍 Testando conexão com IA...\n'));
    
    const spinner = ora('Enviando requisição de teste...').start();
    
    try {
      const response = await this.aiClient.ask('Responda apenas: OK');
      spinner.stop();
      
      console.log(chalk.green('✓ Conexão estabelecida com sucesso!'));
      console.log(chalk.gray(`Resposta: ${response.substring(0, 50)}...\n`));
    } catch (error) {
      spinner.stop();
      console.log(chalk.red('✗ Falha na conexão'));
      console.log(chalk.yellow(`Erro: ${(error as Error).message}\n`));
      console.log(chalk.gray('Verifique:'));
      console.log(chalk.gray('  1. API key está correta'));
      console.log(chalk.gray('  2. Provider está correto'));
      console.log(chalk.gray('  3. Você tem créditos disponíveis\n'));
    }
  }

  private async manageProvider(): Promise<void> {
    const config = await this.configManager.load();
    
    console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.white('  🤖 GERENCIAR PROVIDER DE IA'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    
    // Provider atual
    const currentProvider = config.provider || 'openai';
    console.log(chalk.cyan('║') + chalk.gray('  Provider Atual: ') + chalk.white(currentProvider.padEnd(38)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('  Model Atual:    ') + chalk.white((config.model || 'gpt-4').padEnd(38)) + chalk.cyan('║'));
    
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║') + chalk.bold.white('  📋 PROVIDERS DISPONÍVEIS'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    
    // OpenAI
    const openaiMark = currentProvider === 'openai' ? chalk.green('✓') : chalk.gray(' ');
    console.log(chalk.cyan('║') + `  ${openaiMark} ` + chalk.bold.yellow('OpenAI'.padEnd(52)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    Models: gpt-4, gpt-4-turbo, gpt-3.5-turbo'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    Comando: ') + chalk.white('config set provider openai'.padEnd(44)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    Comando: ') + chalk.white('config set model gpt-4'.padEnd(44)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + ''.padEnd(56) + chalk.cyan('║'));
    
    // Anthropic
    const anthropicMark = currentProvider === 'anthropic' ? chalk.green('✓') : chalk.gray(' ');
    console.log(chalk.cyan('║') + `  ${anthropicMark} ` + chalk.bold.yellow('Anthropic (Claude)'.padEnd(52)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    Models: claude-3-5-sonnet-20240620, claude-3-opus'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    Comando: ') + chalk.white('config set provider anthropic'.padEnd(44)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    Comando: ') + chalk.white('config set model claude-3-5-sonnet-20240620'.padEnd(44)) + chalk.cyan('║'));
    
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║') + chalk.bold.white('  ⚡ ATALHOS RÁPIDOS'.padEnd(56)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║') + chalk.gray('  Mudar para OpenAI:   ') + chalk.white('config api openai'.padEnd(32)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('  Mudar para Claude:   ') + chalk.white('config api claude'.padEnd(32)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('  Ver API keys:        ') + chalk.white('config keys'.padEnd(32)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('  Testar conexão:      ') + chalk.white('config test'.padEnd(32)) + chalk.cyan('║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝'));
    console.log('');
  }

  private async saveSession(name: string): Promise<void> {
    if (!name) {
      name = `session-${Date.now()}`;
    }

    const session = {
      history: this.state.history,
      currentDir: this.state.currentDir,
      conversation: this.conversationHistory,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(`${name}.json`, JSON.stringify(session, null, 2));
    console.log(chalk.green(`✓ Sessão salva: ${name}.json`));
  }

  private async loadSession(name: string): Promise<void> {
    if (!name || !fs.existsSync(`${name}.json`)) {
      console.log(chalk.red(`✗ Sessão não encontrada: ${name}`));
      return;
    }

    const session = JSON.parse(fs.readFileSync(`${name}.json`, 'utf-8'));
    this.state.history = session.history || [];
    this.state.currentDir = session.currentDir || process.cwd();
    this.conversationHistory = session.conversation || [];
    
    console.log(chalk.green(`✓ Sessão carregada: ${name}.json`));
  }

  private async executeShell(command: string): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: this.state.currentDir });
      
      if (stdout) console.log(stdout);
      if (stderr) console.log(chalk.yellow(stderr));
    } catch (error) {
      console.log(chalk.red(`✗ ${(error as Error).message}`));
    }
  }

  private async createProject(name: string, type: string): Promise<void> {
    if (!name) {
      console.log('');
      console.log(chalk.red('✗ Forneça um nome para o projeto'));
      console.log('');
      console.log(chalk.gray('Uso: ') + chalk.white('create <nome> <tipo>'));
      console.log('');
      console.log(chalk.gray('Tipos disponíveis:'));
      console.log(chalk.hex('#00D9FF')('  react   ') + chalk.gray('- Aplicação React com Create React App'));
      console.log(chalk.hex('#00D9FF')('  next    ') + chalk.gray('- Aplicação Next.js'));
      console.log(chalk.hex('#00D9FF')('  vite    ') + chalk.gray('- Projeto Vite (React, Vue, etc)'));
      console.log(chalk.hex('#00D9FF')('  node    ') + chalk.gray('- Projeto Node.js básico'));
      console.log(chalk.hex('#00D9FF')('  express ') + chalk.gray('- API Express.js'));
      console.log(chalk.hex('#00D9FF')('  vue     ') + chalk.gray('- Aplicação Vue.js'));
      console.log('');
      console.log(chalk.hex('#FFD700')('Exemplo:'));
      console.log(chalk.white('  create meu-app react'));
      console.log('');
      return;
    }

    const projectTypes: Record<string, { command: string; description: string }> = {
      'react': { 
        command: 'npx create-react-app',
        description: 'React App'
      },
      'next': { 
        command: 'npx create-next-app',
        description: 'Next.js App'
      },
      'vite': { 
        command: 'npm create vite@latest',
        description: 'Vite Project'
      },
      'node': { 
        command: 'npm init -y',
        description: 'Node.js Project'
      },
      'express': { 
        command: 'npx express-generator',
        description: 'Express API'
      },
      'vue': { 
        command: 'npm create vue@latest',
        description: 'Vue.js App'
      },
    };

    const projectType = projectTypes[type || 'node'];
    
    if (!projectType) {
      console.log('');
      console.log(chalk.red(`✗ Tipo desconhecido: ${type}`));
      console.log('');
      console.log(chalk.gray('Tipos disponíveis:'));
      Object.entries(projectTypes).forEach(([key, value]) => {
        console.log(chalk.hex('#00D9FF')(`  ${key.padEnd(8)}`) + chalk.gray(`- ${value.description}`));
      });
      console.log('');
      return;
    }

    console.log('');
    console.log(chalk.hex('#00D9FF')(`━━━ Criando ${projectType.description} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log('');

    const progress = new SimpleProgress([
      'Inicializando projeto',
      'Instalando dependências',
      'Configurando estrutura',
      'Finalizando'
    ]);
    
    try {
      progress.next();
      
      await execAsync(`${projectType.command} ${name}`, { cwd: this.state.currentDir });
      
      progress.next();
      progress.next();
      progress.next();
      progress.complete();
      
      console.log('');
      console.log(chalk.green('✓ Projeto criado com sucesso!'));
      console.log('');
      console.log(chalk.hex('#FFD700')('Próximos passos:'));
      console.log(chalk.white(`  cd ${name}`));
      
      if (type === 'node') {
        console.log(chalk.white('  ask "crie uma estrutura básica de projeto Node.js"'));
      } else if (type === 'express') {
        console.log(chalk.white('  install'));
        console.log(chalk.white('  run start'));
      } else {
        console.log(chalk.white('  run dev'));
      }
      
      console.log('');
      
    } catch (error) {
      progress.error((error as Error).message);
      ResponseFormatter.formatError(`Erro ao criar projeto: ${(error as Error).message}`);
    }
  }

  private async cloneProject(url: string): Promise<void> {
    if (!url) {
      console.log('');
      console.log(chalk.red('✗ Forneça a URL do repositório'));
      console.log('');
      console.log(chalk.gray('Uso: ') + chalk.white('clone <url>'));
      console.log('');
      console.log(chalk.hex('#FFD700')('Exemplo:'));
      console.log(chalk.white('  clone https://github.com/usuario/repo.git'));
      console.log('');
      return;
    }

    // Verificar se está em diretório de rede
    const isNetworkPath = this.state.currentDir.startsWith('\\\\') || 
                          this.state.currentDir.includes('//192.168');
    
    if (isNetworkPath) {
      console.log('');
      console.log(chalk.yellow('⚠ Diretório de Rede Detectado'));
      console.log('');
      console.log(chalk.gray('Você está em um diretório de rede:'));
      console.log(chalk.white(`  ${this.state.currentDir}`));
      console.log('');
      console.log(chalk.gray('Git pode ter problemas com diretórios de rede.'));
      console.log('');
      console.log(chalk.hex('#FFD700')('Soluções:'));
      console.log('');
      console.log(chalk.white('1. Clone em um diretório local:'));
      console.log(chalk.hex('#00D9FF')('   cd C:\\Users\\YourUser\\Documents'));
      console.log(chalk.hex('#00D9FF')('   clone ' + url));
      console.log('');
      console.log(chalk.white('2. Ou use o comando git diretamente:'));
      console.log(chalk.hex('#00D9FF')('   !git clone ' + url + ' --config core.symlinks=false'));
      console.log('');
      console.log(chalk.gray('Deseja continuar mesmo assim? (pode falhar)'));
      console.log('');
      
      // Por enquanto, vamos tentar mesmo assim
    }

    console.log('');
    console.log(chalk.hex('#00D9FF')('━━━ Clonando Repositório ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');

    const progress = new SimpleProgress([
      'Conectando ao repositório',
      'Baixando arquivos',
      'Configurando projeto'
    ]);
    
    try {
      progress.next();
      
      // Extrair nome do repositório
      const repoName = url.split('/').pop()?.replace('.git', '') || 'repo';
      
      // Tentar clonar com configurações que funcionam melhor em rede
      const cloneCommand = isNetworkPath 
        ? `git clone ${url} --config core.symlinks=false --config core.fileMode=false`
        : `git clone ${url}`;
      
      await execAsync(cloneCommand, { cwd: this.state.currentDir });
      
      progress.next();
      progress.next();
      progress.complete();
      
      console.log('');
      console.log(chalk.green('✓ Repositório clonado com sucesso!'));
      console.log('');
      console.log(chalk.hex('#FFD700')('Próximos passos:'));
      console.log(chalk.white(`  cd ${repoName}`));
      console.log(chalk.white('  ls'));
      console.log(chalk.white('  tree'));
      console.log('');
      
    } catch (error) {
      progress.error((error as Error).message);
      
      const errorMsg = (error as Error).message;
      
      console.log('');
      console.log(chalk.red('✗ Erro ao clonar repositório'));
      console.log('');
      
      // Detectar tipo de erro e dar solução específica
      if (errorMsg.includes('cannot lock ref') || errorMsg.includes('unable to create directory')) {
        console.log(chalk.yellow('🔍 Problema Detectado: Permissões em Diretório de Rede'));
        console.log('');
        console.log(chalk.gray('O Git não consegue criar arquivos no diretório de rede.'));
        console.log('');
        console.log(chalk.hex('#FFD700')('Soluções:'));
        console.log('');
        console.log(chalk.white('1. Clone em um diretório local (RECOMENDADO):'));
        console.log(chalk.hex('#00D9FF')('   cd C:\\Users\\YourUser\\Documents'));
        console.log(chalk.hex('#00D9FF')('   mkdir projetos'));
        console.log(chalk.hex('#00D9FF')('   cd projetos'));
        console.log(chalk.hex('#00D9FF')('   clone ' + url));
        console.log('');
        console.log(chalk.white('2. Use o Git Bash diretamente:'));
        console.log(chalk.hex('#00D9FF')('   Abra Git Bash e execute:'));
        console.log(chalk.hex('#00D9FF')('   git clone ' + url));
        console.log('');
        console.log(chalk.white('3. Clone via HTTPS se estiver usando SSH:'));
        if (url.includes('git@')) {
          const httpsUrl = url.replace('git@github.com:', 'https://github.com/');
          console.log(chalk.hex('#00D9FF')('   clone ' + httpsUrl));
        }
        console.log('');
        
      } else if (errorMsg.includes('Authentication failed') || errorMsg.includes('Permission denied')) {
        console.log(chalk.yellow('🔍 Problema Detectado: Autenticação'));
        console.log('');
        console.log(chalk.gray('Você não tem permissão para acessar este repositório.'));
        console.log('');
        console.log(chalk.hex('#FFD700')('Soluções:'));
        console.log('');
        console.log(chalk.white('1. Verifique se o repositório é público'));
        console.log(chalk.white('2. Configure suas credenciais do Git:'));
        console.log(chalk.hex('#00D9FF')('   !git config --global user.name "Seu Nome"'));
        console.log(chalk.hex('#00D9FF')('   !git config --global user.email "seu@email.com"'));
        console.log('');
        console.log(chalk.white('3. Use HTTPS ao invés de SSH:'));
        if (url.includes('git@')) {
          const httpsUrl = url.replace('git@github.com:', 'https://github.com/');
          console.log(chalk.hex('#00D9FF')('   clone ' + httpsUrl));
        }
        console.log('');
        
      } else if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        console.log(chalk.yellow('🔍 Problema Detectado: Repositório Não Encontrado'));
        console.log('');
        console.log(chalk.gray('O repositório não existe ou a URL está incorreta.'));
        console.log('');
        console.log(chalk.hex('#FFD700')('Verifique:'));
        console.log(chalk.white('  • A URL está correta'));
        console.log(chalk.white('  • O repositório existe'));
        console.log(chalk.white('  • Você tem acesso ao repositório'));
        console.log('');
        
      } else {
        console.log(chalk.gray('Erro: ') + chalk.white(errorMsg));
        console.log('');
        console.log(chalk.hex('#FFD700')('Tente:'));
        console.log(chalk.white('  • Verificar sua conexão com a internet'));
        console.log(chalk.white('  • Clonar em um diretório local'));
        console.log(chalk.white('  • Usar o Git diretamente: !git clone ' + url));
        console.log('');
      }
    }
  }

  private async writeFile(file: string, content: string): Promise<void> {
    if (!file) {
      console.log(chalk.red('✗ Forneça o nome do arquivo'));
      return;
    }

    try {
      const fullPath = path.join(this.state.currentDir, file);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(chalk.green(`✓ Arquivo criado: ${file}`));
    } catch (error) {
      console.log(chalk.red(`✗ Erro: ${(error as Error).message}`));
    }
  }

  private async readFile(file: string): Promise<void> {
    if (!file) {
      console.log(chalk.red('✗ Forneça o nome do arquivo'));
      return;
    }

    try {
      const fullPath = path.join(this.state.currentDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      console.log(chalk.cyan(`\n${file}:\n`));
      console.log(content);
      console.log('');
    } catch (error) {
      console.log(chalk.red(`✗ Erro: ${(error as Error).message}`));
    }
  }

  private async editFile(file: string): Promise<void> {
    if (!file || !fs.existsSync(path.join(this.state.currentDir, file))) {
      console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
      return;
    }

    const fullPath = path.join(this.state.currentDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    console.log(chalk.cyan('\n✏️  Editando com IA...'));
    console.log(chalk.gray('Descreva as mudanças que quer fazer:\n'));
    
    const editRl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.yellow('Mudanças> '),
    });

    editRl.prompt();

    editRl.once('line', async (changes: string) => {
      editRl.close();

      if (!changes.trim()) {
        console.log(chalk.yellow('✗ Nenhuma mudança especificada'));
        return;
      }

      const spinner = ora('Aplicando mudanças...').start();
      
      try {
        const prompt = `Edite este arquivo conforme solicitado:

Arquivo: ${file}
Conteúdo atual:
${content}

Mudanças solicitadas: ${changes}

Retorne APENAS o código completo do arquivo modificado, sem explicações.`;

        const response = await this.aiClient.ask(prompt);
        
        // Extract code from response (remove markdown if present)
        let newContent = response;
        const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
        if (codeMatch) {
          newContent = codeMatch[1];
        }

        fs.writeFileSync(fullPath, newContent);
        spinner.stop();
        
        console.log(chalk.green(`✓ Arquivo atualizado: ${file}`));
        console.log(chalk.gray('\nMudanças aplicadas. Use "read" para ver o resultado.'));
      } catch (error) {
        spinner.stop();
        console.log(chalk.red(`✗ Erro: ${(error as Error).message}`));
      }
    });
  }

  private async deleteFile(file: string): Promise<void> {
    if (!file) {
      console.log(chalk.red('✗ Forneça o nome do arquivo'));
      return;
    }

    try {
      const fullPath = path.join(this.state.currentDir, file);
      
      if (!fs.existsSync(fullPath)) {
        console.log(chalk.red(`✗ Arquivo não encontrado: ${file}`));
        return;
      }

      fs.unlinkSync(fullPath);
      console.log(chalk.green(`✓ Arquivo deletado: ${file}`));
    } catch (error) {
      console.log(chalk.red(`✗ Erro: ${(error as Error).message}`));
    }
  }

  private async makeDirectory(dir: string): Promise<void> {
    if (!dir) {
      console.log(chalk.red('✗ Forneça o nome do diretório'));
      return;
    }

    try {
      const fullPath = path.join(this.state.currentDir, dir);
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(chalk.green(`✓ Diretório criado: ${dir}`));
    } catch (error) {
      console.log(chalk.red(`✗ Erro: ${(error as Error).message}`));
    }
  }

  private async showTree(dir: string = '.', prefix: string = '', isLast: boolean = true): Promise<void> {
    const fullPath = path.join(this.state.currentDir, dir);
    
    if (!fs.existsSync(fullPath)) {
      console.log(chalk.red(`✗ Diretório não encontrado: ${dir}`));
      return;
    }

    if (dir === '.') {
      console.log('');
      console.log(chalk.hex('#00D9FF')(`━━━ Árvore de Arquivos ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
      console.log('');
      
      const tree = FileNavigator.buildTree(fullPath, 3);
      FileNavigator.renderTree(tree);
      
      console.log('');
    }
  }

  private async searchInFiles(term: string): Promise<void> {
    if (!term) {
      console.log(chalk.red('✗ Forneça um termo para buscar'));
      return;
    }

    const progress = new SimpleProgress(['Buscando arquivos', 'Analisando conteúdo']);
    
    try {
      progress.next();
      
      const results = FileNavigator.searchInFiles(this.state.currentDir, term, ['.ts', '.js', '.tsx', '.jsx', '.json']);
      
      progress.next();
      progress.complete();
      
      if (results.length === 0) {
        ResponseFormatter.formatWarning(`Nenhum resultado encontrado para "${term}"`);
        return;
      }
      
      console.log('');
      console.log(chalk.hex('#00D9FF')(`━━━ Resultados para "${term}" ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
      console.log('');
      
      // Agrupar por arquivo
      const byFile = new Map<string, Array<{ line: number; content: string }>>();
      
      results.forEach(result => {
        const relativePath = path.relative(this.state.currentDir, result.file);
        if (!byFile.has(relativePath)) {
          byFile.set(relativePath, []);
        }
        byFile.get(relativePath)!.push({ line: result.line, content: result.content });
      });
      
      // Mostrar resultados
      byFile.forEach((matches, file) => {
        console.log(chalk.hex('#FFD700')(file));
        matches.slice(0, 5).forEach(match => {
          console.log(chalk.gray(`   ${match.line}: `) + chalk.white(match.content));
        });
        if (matches.length > 5) {
          console.log(chalk.gray(`   ... e mais ${matches.length - 5} ocorrências`));
        }
        console.log('');
      });
      
      console.log(chalk.gray(`  Total: ${results.length} ocorrências em ${byFile.size} arquivos`));
      console.log('');
      
    } catch (error) {
      ResponseFormatter.formatError((error as Error).message);
    }
  }

  private async gitCommand(args: string[]): Promise<void> {
    const command = `git ${args.join(' ')}`;
    await this.executeShell(command);
  }

  private async packageManager(manager: string, args: string[]): Promise<void> {
    const command = `${manager} ${args.join(' ')}`;
    await this.executeShell(command);
  }

  private async installDependencies(): Promise<void> {
    const spinner = ora('Instalando dependências...').start();
    
    try {
      // Detectar package manager
      let manager = 'npm';
      if (fs.existsSync(path.join(this.state.currentDir, 'yarn.lock'))) {
        manager = 'yarn';
      } else if (fs.existsSync(path.join(this.state.currentDir, 'pnpm-lock.yaml'))) {
        manager = 'pnpm';
      }

      await execAsync(`${manager} install`, { cwd: this.state.currentDir });
      spinner.stop();
      console.log(chalk.green(`✓ Dependências instaladas com ${manager}`));
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`✗ Erro: ${(error as Error).message}`));
    }
  }

  private async runScript(script: string): Promise<void> {
    if (!script) {
      // Listar scripts disponíveis
      const pkgPath = path.join(this.state.currentDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.scripts) {
          console.log(chalk.cyan('\n📜 Scripts disponíveis:\n'));
          Object.keys(pkg.scripts).forEach(name => {
            console.log(chalk.gray(`  ${name.padEnd(15)} ${pkg.scripts[name]}`));
          });
          console.log('');
        }
      }
      return;
    }

    const spinner = ora(`Executando ${script}...`).start();
    
    try {
      await execAsync(`npm run ${script}`, { cwd: this.state.currentDir });
      spinner.stop();
      console.log(chalk.green(`✓ Script ${script} executado`));
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`✗ Erro: ${(error as Error).message}`));
    }
  }

  private async buildProject(): Promise<void> {
    const spinner = ora('Building projeto...').start();
    
    try {
      // Tentar detectar comando de build
      const pkgPath = path.join(this.state.currentDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.scripts?.build) {
          await execAsync('npm run build', { cwd: this.state.currentDir });
          spinner.stop();
          console.log(chalk.green('✓ Build completo'));
          return;
        }
      }

      // Fallback para TypeScript
      if (fs.existsSync(path.join(this.state.currentDir, 'tsconfig.json'))) {
        await execAsync('npx tsc', { cwd: this.state.currentDir });
        spinner.stop();
        console.log(chalk.green('✓ TypeScript compilado'));
        return;
      }

      spinner.stop();
      console.log(chalk.yellow('⚠ Nenhum comando de build encontrado'));
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`✗ Erro: ${(error as Error).message}`));
    }
  }

  private async showStatus(): Promise<void> {
    console.log(chalk.cyan('\n📊 Status do Projeto:\n'));

    // Git status
    try {
      const { stdout } = await execAsync('git status --short', { cwd: this.state.currentDir });
      if (stdout.trim()) {
        console.log(chalk.bold('Git:'));
        console.log(stdout);
      } else {
        console.log(chalk.green('✓ Git: Working tree clean'));
      }
    } catch {
      console.log(chalk.gray('  Git: Não é um repositório'));
    }

    // Package.json info
    const pkgPath = path.join(this.state.currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      console.log(chalk.bold('\nProjeto:'));
      console.log(chalk.gray(`  Nome: ${pkg.name || 'N/A'}`));
      console.log(chalk.gray(`  Versão: ${pkg.version || 'N/A'}`));
      
      if (pkg.dependencies) {
        const depCount = Object.keys(pkg.dependencies).length;
        console.log(chalk.gray(`  Dependências: ${depCount}`));
      }
    }

    // Arquivos
    const files = fs.readdirSync(this.state.currentDir);
    const filtered = files.filter(f => !f.startsWith('.') && f !== 'node_modules');
    console.log(chalk.bold('\nArquivos:'));
    console.log(chalk.gray(`  Total: ${filtered.length} arquivos/pastas`));

    console.log('');
  }

  private async showInfo(): Promise<void> {
    console.log(chalk.cyan('\n📋 Informações do Sistema:\n'));

    // Node version
    try {
      const { stdout: nodeVersion } = await execAsync('node --version');
      console.log(chalk.gray(`  Node.js: ${nodeVersion.trim()}`));
    } catch {}

    // NPM version
    try {
      const { stdout: npmVersion } = await execAsync('npm --version');
      console.log(chalk.gray(`  NPM: ${npmVersion.trim()}`));
    } catch {}

    // Git version
    try {
      const { stdout: gitVersion } = await execAsync('git --version');
      console.log(chalk.gray(`  ${gitVersion.trim()}`));
    } catch {}

    // VibeCode config
    try {
      const config = await this.configManager.load();
      console.log(chalk.bold('\nVibeCode:'));
      console.log(chalk.gray(`  Provider: ${config.provider}`));
      console.log(chalk.gray(`  Model: ${config.model}`));
      console.log(chalk.gray(`  API Key: ${config.apiKey ? '✓ Configurada' : '✗ Não configurada'}`));
    } catch {
      console.log(chalk.yellow('\n⚠ VibeCode não configurado'));
    }

    // Diretório atual
    console.log(chalk.bold('\nDiretório:'));
    console.log(chalk.gray(`  ${this.state.currentDir}`));

    console.log('');
  }

  private showVersion(): void {
    console.log(chalk.cyan('\nVibeCode Terminal v1.0.0'));
    console.log(chalk.gray('Terminal de Desenvolvimento com IA\n'));
  }

  private async updateCLI(): Promise<void> {
    console.log(chalk.hex('#FF00FF')('\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#00D9FF')('  🔄 SISTEMA DE ATUALIZAÇÃO INTELIGENTE'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Verificando sistema...'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('╚════════════════════════════════════════════════════════╝\n'));
    
    const spinner = ora({
      text: 'Analisando ambiente...',
      color: 'cyan',
      spinner: 'dots12'
    }).start();
    
    try {
      // 1. Detectar diretório do projeto
      let projectDir = __dirname;
      if (projectDir.includes('out')) {
        projectDir = path.resolve(projectDir, '../..');
      }
      
      spinner.text = 'Verificando integridade do projeto...';
      
      // 2. Verificar se é um projeto válido
      const packageJsonPath = path.join(projectDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('Diretório do projeto não encontrado');
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const currentVersion = packageJson.version || '0.0.0';
      
      spinner.text = 'Criando backup de segurança...';
      
      // 3. Criar backup da configuração
      const configPath = path.join(projectDir, '.vibecoderc.json');
      let configBackup = null;
      if (fs.existsSync(configPath)) {
        configBackup = fs.readFileSync(configPath, 'utf-8');
      }
      
      spinner.text = 'Verificando dependências...';
      
      // 4. Verificar se há mudanças no package.json
      const { stdout: gitStatus } = await execAsync('git status --porcelain package.json', { cwd: projectDir }).catch(() => ({ stdout: '' }));
      
      spinner.text = 'Limpando cache...';
      
      // 5. Limpar diretório out
      const outDir = path.join(projectDir, 'out');
      if (fs.existsSync(outDir)) {
        await execAsync('rmdir /s /q out', { cwd: projectDir }).catch(() => {});
      }
      
      spinner.text = 'Recompilando TypeScript...';
      
      // 6. Recompilar
      await execAsync('npm run build', { cwd: projectDir });
      
      spinner.text = 'Atualizando link global...';
      
      // 7. Atualizar link
      await execAsync('npm unlink -g vibecode', { cwd: projectDir }).catch(() => {});
      await execAsync('npm link', { cwd: projectDir });
      
      spinner.text = 'Restaurando configuração...';
      
      // 8. Restaurar backup se necessário
      if (configBackup && fs.existsSync(configPath)) {
        const currentConfig = fs.readFileSync(configPath, 'utf-8');
        if (currentConfig !== configBackup) {
          // Mesclar configurações
          const backup = JSON.parse(configBackup);
          const current = JSON.parse(currentConfig);
          const merged = { ...current, ...backup };
          fs.writeFileSync(configPath, JSON.stringify(merged, null, 2));
        }
      }
      
      spinner.stop();
      
      // 9. Exibir resultado
      console.log(chalk.hex('#FF00FF')('\n╔════════════════════════════════════════════════════════╗'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#00FF00')('  ✓ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Versão:         ') + chalk.hex('#FFD700')(currentVersion.padEnd(38)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Diretório:      ') + chalk.white(projectDir.substring(0, 38).padEnd(38)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Backup:         ') + chalk.hex('#00D9FF')((configBackup ? '✓ Criado' : 'N/A').padEnd(38)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#FFD700')('  ⚠️  PRÓXIMOS PASSOS'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.white('  1. Feche este terminal'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.white('  2. Abra um novo terminal'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.white('  3. Execute: vibecode'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.white('  4. Verifique: version'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╚════════════════════════════════════════════════════════╝\n'));
      
    } catch (error) {
      spinner.stop();
      
      console.log(chalk.hex('#FF00FF')('\n╔════════════════════════════════════════════════════════╗'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.red('  ✗ ERRO NA ATUALIZAÇÃO'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.red(`  ${(error as Error).message}`.substring(0, 54).padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#FFD700')('  💡 SOLUÇÃO MANUAL'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.white('  Execute no diretório do projeto:'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.hex('#00D9FF')('  npm run build && npm link'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + ''.padEnd(56) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.white('  Ou use o script de limpeza:'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.hex('#00D9FF')('  ./limpar-tudo.bat'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╚════════════════════════════════════════════════════════╝\n'));
    }
  }

  private async checkForUpdates(): Promise<void> {
    console.log(chalk.hex('#FF00FF')('\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#00D9FF')('  🔍 VERIFICAÇÃO DE ATUALIZAÇÕES'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Consultando npm registry...'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('╚════════════════════════════════════════════════════════╝\n'));
    
    const spinner = ora({
      text: 'Verificando versão mais recente...',
      color: 'cyan',
      spinner: 'dots12'
    }).start();
    
    try {
      // 1. Obter versão local
      let projectDir = __dirname;
      if (projectDir.includes('out')) {
        projectDir = path.resolve(projectDir, '../..');
      }
      
      const packageJsonPath = path.join(projectDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json não encontrado');
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const currentVersion = packageJson.version || '0.0.0';
      const packageName = packageJson.name || 'vibecode';
      
      // 2. Consultar npm registry
      spinner.text = 'Consultando npm registry...';
      
      const https = await import('https');
      const registryUrl = `https://registry.npmjs.org/${packageName}/latest`;
      
      const latestVersion = await new Promise<string>((resolve, reject) => {
        https.get(registryUrl, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json.version || currentVersion);
            } catch (error) {
              reject(new Error('Erro ao parsear resposta do npm'));
            }
          });
        }).on('error', (error) => {
          reject(error);
        });
      });
      
      spinner.stop();
      
      // 3. Comparar versões
      const isUpdateAvailable = this.compareVersions(latestVersion, currentVersion) > 0;
      
      // 4. Exibir resultado
      console.log(chalk.hex('#FF00FF')('\n╔════════════════════════════════════════════════════════╗'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#00D9FF')('  📦 INFORMAÇÕES DE VERSÃO'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Versão Atual:      ') + chalk.white(currentVersion.padEnd(34)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Versão Disponível: ') + chalk.hex('#FFD700')(latestVersion.padEnd(34)) + chalk.hex('#FF00FF')('║'));
      
      if (isUpdateAvailable) {
        console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Status:            ') + chalk.green('✓ Atualização disponível'.padEnd(34)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#FFD700')('  📋 NOVIDADES'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.white('  • Melhorias de performance e estabilidade'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.white('  • Correções de bugs'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.white('  • Novos recursos e funcionalidades'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#00D9FF')('  ⚡ COMO ATUALIZAR'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.white('  Opção 1 (Recomendado):'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.hex('#FFD700')('    update'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + ''.padEnd(56) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.white('  Opção 2 (Manual):'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.hex('#FFD700')('    npm update -g vibecode'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + ''.padEnd(56) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.white('  Opção 3 (Desenvolvimento):'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.hex('#FFD700')('    cd <projeto> && npm run build && npm link'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      } else {
        console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Status:            ') + chalk.green('✓ Você está atualizado!'.padEnd(34)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.white('  Você já está usando a versão mais recente.'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
        console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Não há atualizações disponíveis no momento.'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      }
      
      console.log(chalk.hex('#FF00FF')('╚════════════════════════════════════════════════════════╝\n'));
      
    } catch (error) {
      spinner.stop();
      
      console.log(chalk.hex('#FF00FF')('\n╔════════════════════════════════════════════════════════╗'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.red('  ✗ ERRO AO VERIFICAR ATUALIZAÇÕES'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.red(`  ${(error as Error).message}`.substring(0, 54).padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Verifique sua conexão com a internet.'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Ou consulte: https://www.npmjs.com/package/vibecode'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╚════════════════════════════════════════════════════════╝\n'));
    }
  }

  /**
   * Compara duas versões semver
   * Retorna: 1 se v1 > v2, -1 se v1 < v2, 0 se iguais
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }

  private async touchFile(file: string): Promise<void> {
    if (!file) {
      console.log(chalk.red('✗ Forneça o nome do arquivo'));
      return;
    }

    try {
      const fullPath = path.join(this.state.currentDir, file);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, '');
        console.log(chalk.green(`✓ Arquivo criado: ${file}`));
      } else {
        const now = new Date();
        fs.utimesSync(fullPath, now, now);
        console.log(chalk.green(`✓ Timestamp atualizado: ${file}`));
      }
    } catch (error) {
      console.log(chalk.red(`✗ Erro: ${(error as Error).message}`));
    }
  }

  /**
   * Executar Ultra Agente IA - COMANDO PRINCIPAL
   */
  private async runUltraAgent(command: string): Promise<void> {
if (!command) {
  console.log('');
  console.log(chalk.bold('Usage'));
  console.log('');
  console.log(chalk.gray('  vibe ') + chalk.white('"<your task description>"'));
  console.log('');
  console.log(chalk.bold('Examples'));
  console.log('');
  console.log(chalk.gray('  vibe ') + chalk.white('"fix authentication bugs"'));
  console.log(chalk.gray('  vibe ') + chalk.white('"add tests to Button component"'));
  console.log(chalk.gray('  vibe ') + chalk.white('"refactor using TypeScript"'));
  console.log('');
  return;
}

    const agent = new UltraAgent(
      this.aiClient,
      this.configManager,
      this.state.currentDir
    );

    await agent.execute(command);
  }

  /**
   * Help SIMPLIFICADO
   */
  private showSimpleHelp(): void {
    console.log('');
    console.log(chalk.hex('#00D9FF')('━━━ VIBECODE - COMANDOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');
    
    // COMANDO PRINCIPAL
    console.log(chalk.bold.hex('#FFD700')('🤖 COMANDO PRINCIPAL'));
    console.log(chalk.hex('#00D9FF')('  vibe') + chalk.white(' "<tarefa>"        ') + chalk.gray('IA super inteligente - faz TUDO'));
    console.log('');
    console.log(chalk.gray('  Exemplos:'));
    console.log(chalk.white('    vibe "na pasta src/auth desenvolva código melhorado"'));
    console.log(chalk.white('    vibe "debug tudo e otimize performance"'));
    console.log(chalk.white('    vibe "crie API REST com autenticação JWT"'));
    console.log(chalk.white('    vibe "refatore usando TypeScript e adicione testes"'));
    console.log('');
    
    // NAVEGAÇÃO
    console.log(chalk.bold.hex('#FFD700')('📁 NAVEGAÇÃO'));
    console.log(chalk.hex('#00D9FF')('  cd') + chalk.white(' <pasta>           ') + chalk.gray('Mudar diretório'));
    console.log(chalk.hex('#00D9FF')('  ls') + chalk.white('                    ') + chalk.gray('Listar arquivos'));
    console.log(chalk.hex('#00D9FF')('  tree') + chalk.white('                  ') + chalk.gray('Árvore de arquivos'));
    console.log('');
    
    // SISTEMA
    console.log(chalk.bold.hex('#FFD700')('⚙️  SISTEMA'));
    console.log(chalk.hex('#00D9FF')('  switch') + chalk.white('                ') + chalk.gray('Trocar API (OpenAI ↔ Claude)'));
    console.log(chalk.hex('#00D9FF')('  config') + chalk.white('                ') + chalk.gray('Ver configuração e uso de tokens'));
    console.log(chalk.hex('#00D9FF')('  clear') + chalk.white('                 ') + chalk.gray('Limpar tela'));
    console.log(chalk.hex('#00D9FF')('  exit') + chalk.white('                  ') + chalk.gray('Sair'));
    console.log('');
    
    // DICAS
    console.log(chalk.bold.hex('#FFD700')('💡 DICAS'));
    console.log(chalk.gray('  • Use linguagem natural no comando ') + chalk.white('vibe'));
    console.log(chalk.gray('  • Seja específico sobre pasta/arquivo alvo'));
    console.log(chalk.gray('  • Combine múltiplas ações: "debug, otimize e documente"'));
    console.log(chalk.gray('  • Use ') + chalk.white('switch') + chalk.gray(' para trocar entre OpenAI e Claude'));
    console.log(chalk.gray('  • Use ') + chalk.white('config usage') + chalk.gray(' para ver gastos'));
    console.log('');
    
    console.log(chalk.hex('#00D9FF')('━'.repeat(100)));
    console.log('');
  }

  /**
   * Trocar provider de IA com dropdown interativo
   */
  private async switchProvider(): Promise<void> {
    const switcher = new ProviderSwitcher();
    await switcher.show(this.configManager);
    
    // Recarregar configuração
    await this.configManager.reload();
  }

  /**
   * Calcula distância de Levenshtein para sugestões de comandos
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  private async showTokenUsageHistory(): Promise<void> {
    const tokenUsage = await this.configManager.getTokenUsage();
    
    console.log(chalk.hex('#FF00FF')('\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#FFD700')('  📊 HISTÓRICO DE USO DE TOKENS'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
    
    if (!tokenUsage || tokenUsage.history.length === 0) {
      console.log(chalk.hex('#FF00FF')('║') + chalk.gray('  Nenhum uso registrado ainda'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    } else {
      console.log(chalk.hex('#FF00FF')('║') + chalk.bold.white('  Data/Hora           Comando      Tokens    Custo'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
      
      // Mostrar últimos 10 registros
      const recentHistory = tokenUsage.history.slice(-10);
      recentHistory.forEach(entry => {
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const tokensStr = entry.tokens.toString().padStart(6);
        const costStr = `$${entry.cost.toFixed(4)}`;
        const commandStr = entry.command.substring(0, 10).padEnd(10);
        
        const line = `  ${dateStr}  ${commandStr}  ${tokensStr}  ${costStr}`;
        console.log(chalk.hex('#FF00FF')('║') + chalk.gray(line.padEnd(56)) + chalk.hex('#FF00FF')('║'));
      });
    }
    
    console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.bold.hex('#00D9FF')('  RESUMO'.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('╠════════════════════════════════════════════════════════╣'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.gray(`  Total de Tokens: ${(tokenUsage?.totalTokens || 0).toLocaleString('pt-BR')}`.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.gray(`  Custo Total: $${(tokenUsage?.totalCost || 0).toFixed(4)}`.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('║') + chalk.gray(`  Orçamento Restante: $${(4 - (tokenUsage?.totalCost || 0)).toFixed(4)}`.padEnd(56)) + chalk.hex('#FF00FF')('║'));
    console.log(chalk.hex('#FF00FF')('╚════════════════════════════════════════════════════════╝'));
    console.log('');
  }
}

// Start terminal if executed directly
if (require.main === module) {
  const terminal = new VibeCodeTerminal();
  terminal.start();
}

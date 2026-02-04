import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { AIClient } from '../core/ai-client';
import { ContextBuilder } from '../core/context';
import { ConfigManager } from '../core/config';
import { SimpleProgress } from './progress';
import { ResponseFormatter } from './response-formatter';
import { TokenOptimizer } from './token-optimizer';
import { FileNavigator } from './file-navigator';

export interface AgentAction {
  type: 'create' | 'modify' | 'delete' | 'analyze' | 'execute';
  target: string;
  content?: string;
  reason: string;
}

export class SuperAgent {
  private aiClient: AIClient;
  private contextBuilder: ContextBuilder;
  private configManager: ConfigManager;
  private currentDir: string;

  constructor(
    aiClient: AIClient,
    contextBuilder: ContextBuilder,
    configManager: ConfigManager,
    currentDir: string
  ) {
    this.aiClient = aiClient;
    this.contextBuilder = contextBuilder;
    this.configManager = configManager;
    this.currentDir = currentDir;
  }

  async execute(command: string): Promise<void> {
    const progress = new SimpleProgress([
      'Analisando comando',
      'Escaneando projeto',
      'Planejando ações',
      'Executando tarefas',
      'Validando resultado'
    ]);

    try {
      progress.next();
      
      // Otimizar comando
      const optimizedCommand = TokenOptimizer.optimizePrompt(command);
      
      progress.next();
      
      // Escanear projeto completo
      const projectStructure = await this.scanProject();
      const relevantFiles = await this.findRelevantFiles(command);
      
      progress.next();
      
      // Criar plano de ação detalhado
      const plan = await this.createActionPlan(optimizedCommand, projectStructure, relevantFiles);
      
      progress.next();
      
      // Executar ações
      const results = await this.executeActions(plan);
      
      progress.next();
      
      // Validar resultado
      const validation = await this.validateResults(results);
      
      progress.complete();
      
      // Mostrar resultado
      this.displayResults(results, validation);
      
    } catch (error) {
      progress.error((error as Error).message);
    }
  }

  private async scanProject(): Promise<any> {
    const structure = {
      root: this.currentDir,
      files: [] as string[],
      directories: [] as string[],
      languages: new Set<string>(),
      frameworks: [] as string[],
      dependencies: {} as Record<string, any>
    };

    // Escanear arquivos
    const scan = (dir: string, depth: number = 0) => {
      if (depth > 5) return; // Limitar profundidade
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(this.currentDir, fullPath);
        
        // Ignorar node_modules, .git, etc
        if (this.shouldIgnore(item)) continue;
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          structure.directories.push(relativePath);
          scan(fullPath, depth + 1);
        } else {
          structure.files.push(relativePath);
          
          // Detectar linguagem
          const ext = path.extname(item);
          if (ext) structure.languages.add(ext);
        }
      }
    };

    scan(this.currentDir);

    // Detectar frameworks
    if (fs.existsSync(path.join(this.currentDir, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(this.currentDir, 'package.json'), 'utf-8'));
      structure.dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      
      // Detectar frameworks comuns
      if (pkg.dependencies?.react) structure.frameworks.push('React');
      if (pkg.dependencies?.next) structure.frameworks.push('Next.js');
      if (pkg.dependencies?.vue) structure.frameworks.push('Vue');
      if (pkg.dependencies?.express) structure.frameworks.push('Express');
      if (pkg.dependencies?.['@nestjs/core']) structure.frameworks.push('NestJS');
    }

    return structure;
  }

  private async findRelevantFiles(command: string): Promise<string[]> {
    const keywords = command.toLowerCase().split(' ');
    const relevantFiles: string[] = [];
    
    const searchInDirectory = (dir: string, depth: number = 0) => {
      if (depth > 3) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (this.shouldIgnore(item)) continue;
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchInDirectory(fullPath, depth + 1);
        } else {
          // Verificar se o nome do arquivo contém palavras-chave
          const itemLower = item.toLowerCase();
          if (keywords.some(kw => itemLower.includes(kw))) {
            relevantFiles.push(path.relative(this.currentDir, fullPath));
          }
        }
      }
    };

    searchInDirectory(this.currentDir);
    
    return relevantFiles.slice(0, 10); // Limitar a 10 arquivos mais relevantes
  }

  private async createActionPlan(
    command: string,
    structure: any,
    relevantFiles: string[]
  ): Promise<AgentAction[]> {
    // Ler conteúdo dos arquivos relevantes
    const filesContent = relevantFiles.map(file => {
      const fullPath = path.join(this.currentDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      return { file, content: content.substring(0, 2000) }; // Limitar tamanho
    });

    const prompt = `Você é um agente de IA super inteligente que analisa projetos e executa tarefas.

COMANDO DO USUÁRIO: ${command}

ESTRUTURA DO PROJETO:
- Diretório: ${structure.root}
- Total de arquivos: ${structure.files.length}
- Linguagens: ${Array.from(structure.languages).join(', ')}
- Frameworks: ${structure.frameworks.join(', ')}

ARQUIVOS RELEVANTES:
${filesContent.map(f => `\n${f.file}:\n${f.content.substring(0, 500)}...`).join('\n')}

TAREFA:
Analise o comando e crie um plano de ação detalhado. Retorne um JSON com as ações necessárias.

Formato de resposta (JSON):
{
  "actions": [
    {
      "type": "create|modify|delete|analyze",
      "target": "caminho/do/arquivo",
      "content": "conteúdo do arquivo (se aplicável)",
      "reason": "motivo da ação"
    }
  ],
  "summary": "resumo do que será feito"
}

IMPORTANTE:
- Seja específico sobre quais arquivos criar/modificar
- Inclua o conteúdo completo dos arquivos
- Explique o motivo de cada ação
- Priorize qualidade sobre quantidade`;

    const response = await this.aiClient.ask(prompt);
    
    // Extrair JSON da resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Não foi possível criar plano de ação');
    }

    const plan = JSON.parse(jsonMatch[0]);
    return plan.actions || [];
  }

  private async executeActions(actions: AgentAction[]): Promise<any[]> {
    const results = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create':
            await this.createFile(action.target, action.content || '');
            results.push({ action, status: 'success', message: 'Arquivo criado' });
            break;

          case 'modify':
            await this.modifyFile(action.target, action.content || '');
            results.push({ action, status: 'success', message: 'Arquivo modificado' });
            break;

          case 'delete':
            await this.deleteFile(action.target);
            results.push({ action, status: 'success', message: 'Arquivo deletado' });
            break;

          case 'analyze':
            const analysis = await this.analyzeFile(action.target);
            results.push({ action, status: 'success', message: 'Análise concluída', data: analysis });
            break;

          default:
            results.push({ action, status: 'skipped', message: 'Ação não suportada' });
        }
      } catch (error) {
        results.push({ action, status: 'error', message: (error as Error).message });
      }
    }

    return results;
  }

  private async createFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.currentDir, filePath);
    const dir = path.dirname(fullPath);
    
    // Criar diretório se não existir
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  private async modifyFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.currentDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  private async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.currentDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    fs.unlinkSync(fullPath);
  }

  private async analyzeFile(filePath: string): Promise<string> {
    const fullPath = path.join(this.currentDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    const response = await this.aiClient.ask(`Analise este código:\n\n${content}`);
    
    return response;
  }

  private async validateResults(results: any[]): Promise<any> {
    const validation = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      errors: results.filter(r => r.status === 'error').length,
      skipped: results.filter(r => r.status === 'skipped').length
    };

    return validation;
  }

  private displayResults(results: any[], validation: any): void {
    console.log('');
    console.log(chalk.hex('#00D9FF')('━━━ RESULTADO DA EXECUÇÃO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');
    
    // Estatísticas
    console.log(chalk.bold.hex('#FFD700')('📊 ESTATÍSTICAS'));
    console.log(chalk.gray(`  Total de ações: ${validation.total}`));
    console.log(chalk.green(`  ✓ Sucesso: ${validation.success}`));
    if (validation.errors > 0) {
      console.log(chalk.red(`  ✗ Erros: ${validation.errors}`));
    }
    if (validation.skipped > 0) {
      console.log(chalk.yellow(`  ○ Ignoradas: ${validation.skipped}`));
    }
    console.log('');
    
    // Detalhes das ações
    console.log(chalk.bold.hex('#FFD700')('📝 AÇÕES EXECUTADAS'));
    results.forEach((result, index) => {
      const icon = result.status === 'success' ? chalk.green('✓') : 
                   result.status === 'error' ? chalk.red('✗') : 
                   chalk.yellow('○');
      
      console.log(`${icon} ${chalk.hex('#00D9FF')(result.action.type.toUpperCase())} ${chalk.white(result.action.target)}`);
      console.log(chalk.gray(`  ${result.action.reason}`));
      console.log(chalk.gray(`  Status: ${result.message}`));
      console.log('');
    });
    
    console.log(chalk.hex('#00D9FF')('━'.repeat(100)));
    console.log('');
  }

  private shouldIgnore(name: string): boolean {
    const ignoreList = [
      'node_modules',
      '.git',
      '.vscode',
      'dist',
      'build',
      'out',
      '.next',
      'coverage',
      '.cache',
      'vscode'
    ];
    
    return ignoreList.includes(name) || name.startsWith('.');
  }
}

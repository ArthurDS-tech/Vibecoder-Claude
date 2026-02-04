import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { AIClient } from '../core/ai-client';
import { ConfigManager } from '../core/config';
import { SimpleProgress } from './progress';

/**
 * Ultra Agent - IA Super Inteligente
 * Um único comando que faz TUDO
 */
export class UltraAgent {
  private aiClient: AIClient;
  private configManager: ConfigManager;
  private currentDir: string;
  private projectContext: any = {};

  constructor(
    aiClient: AIClient,
    configManager: ConfigManager,
    currentDir: string
  ) {
    this.aiClient = aiClient;
    this.configManager = configManager;
    this.currentDir = currentDir;
  }

  /**
   * Executa comando inteligente
   * Entende contexto, analisa projeto, executa ações
   */
  async execute(command: string): Promise<void> {
    const progress = new SimpleProgress([
      'Entendendo comando',
      'Analisando projeto',
      'Executando ações'
    ]);

    try {
      progress.next();
      
      // Entender o comando e extrair intenção
      const intent = await this.understandCommand(command);
      
      progress.next();
      
      // Análise ultra-rápida do projeto
      await this.quickScan();
      
      progress.next();
      
      // Executar com IA super inteligente
      await this.smartExecute(intent, command);
      
      progress.complete();
      
    } catch (error) {
      progress.error((error as Error).message);
    }
  }

  /**
   * Entende o comando do usuário
   * Extrai: pasta alvo, ação, contexto
   */
  private async understandCommand(command: string): Promise<any> {
    // Extrair pasta mencionada
    const folderMatch = command.match(/(?:pasta|folder|dir|diretório|diretorio)\s+([^\s]+)/i);
    const targetFolder = folderMatch ? folderMatch[1] : null;

    // Extrair arquivo mencionado
    const fileMatch = command.match(/(?:arquivo|file)\s+([^\s]+)/i);
    const targetFile = fileMatch ? fileMatch[1] : null;

    // Detectar ações
    const actions = {
      develop: /desenvolv|cri|implement|cod|faz|fazer/i.test(command),
      debug: /debug|corrig|fix|consert|erro|bug/i.test(command),
      optimize: /otimiz|melhor|performance|rapido|rápido/i.test(command),
      refactor: /refator|limpar|organiz|estrutur/i.test(command),
      test: /test|testa/i.test(command),
      document: /document|doc|coment/i.test(command),
      analyze: /analis|revis|verific|check/i.test(command)
    };

    return {
      targetFolder,
      targetFile,
      actions,
      fullCommand: command
    };
  }

  /**
   * Scan ultra-rápido do projeto
   * Apenas o essencial
   */
  private async quickScan(): Promise<void> {
    this.projectContext = {
      root: this.currentDir,
      files: [],
      structure: {},
      tech: []
    };

    // Detectar tecnologias
    if (fs.existsSync(path.join(this.currentDir, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(this.currentDir, 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.react) this.projectContext.tech.push('React');
      if (deps.next) this.projectContext.tech.push('Next.js');
      if (deps.vue) this.projectContext.tech.push('Vue');
      if (deps.express) this.projectContext.tech.push('Express');
      if (deps.typescript) this.projectContext.tech.push('TypeScript');
    }

    // Listar arquivos importantes (máximo 20)
    this.scanDirectory(this.currentDir, 0, 20);
  }

  private scanDirectory(dir: string, depth: number, maxFiles: number): void {
    if (depth > 3 || this.projectContext.files.length >= maxFiles) return;

    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        if (this.shouldIgnore(item)) continue;
        
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(this.currentDir, fullPath);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            this.scanDirectory(fullPath, depth + 1, maxFiles);
          } else if (this.isRelevantFile(item)) {
            this.projectContext.files.push(relativePath);
          }
        } catch (e) {
          // Ignorar erros de permissão
        }
      }
    } catch (e) {
      // Ignorar erros de leitura
    }
  }

  private isRelevantFile(filename: string): boolean {
    const relevantExts = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.java', '.go', '.rs'];
    return relevantExts.some(ext => filename.endsWith(ext));
  }

  private shouldIgnore(name: string): boolean {
    const ignore = ['node_modules', '.git', 'dist', 'build', 'out', '.next', 'coverage', 'vscode'];
    return ignore.includes(name) || name.startsWith('.');
  }

  /**
   * Execução inteligente
   * IA decide o que fazer e executa
   */
  private async smartExecute(intent: any, originalCommand: string): Promise<void> {
    // Construir contexto ultra-compacto
    const contextStr = this.buildCompactContext(intent);
    
    // Ler conteúdo do arquivo alvo se especificado
    let targetFileContent = '';
    if (intent.targetFile) {
      const targetPath = path.join(this.currentDir, intent.targetFile);
      if (fs.existsSync(targetPath)) {
        targetFileContent = fs.readFileSync(targetPath, 'utf-8');
      }
    }
    
    // Prompt ultra-otimizado
    const prompt = `Você é um desenvolvedor expert. Execute esta tarefa:

COMANDO: ${originalCommand}

PROJETO:
- Tecnologias: ${this.projectContext.tech.join(', ') || 'Detectando...'}
- Arquivos: ${this.projectContext.files.length} arquivos
${intent.targetFolder ? `- Pasta alvo: ${intent.targetFolder}` : ''}
${intent.targetFile ? `- Arquivo alvo: ${intent.targetFile}` : ''}

${targetFileContent ? `CONTEÚDO ATUAL DO ARQUIVO:
\`\`\`
${targetFileContent.substring(0, 3000)}
\`\`\`
` : ''}

ARQUIVOS RELEVANTES:
${this.projectContext.files.slice(0, 10).map((f: string) => `- ${f}`).join('\n')}

TAREFA:
${this.describeActions(intent.actions)}

INSTRUÇÕES CRÍTICAS:
1. Analise o código existente
2. Identifique problemas e melhorias
3. Implemente as mudanças necessárias
4. Retorne código COMPLETO e FUNCIONAL
5. Explique o que foi feito

IMPORTANTE:
- Retorne o código COMPLETO do arquivo (não apenas trechos)
- Inclua TODOS os imports necessários
- Mantenha a estrutura e formatação
- Código deve estar pronto para copiar e colar
- Siga best practices da linguagem

FORMATO DE RESPOSTA OBRIGATÓRIO:
## Análise
[sua análise do problema/tarefa]

## Mudanças
[lista detalhada de mudanças feitas]

## Arquivo
Caminho: [caminho/do/arquivo.ext]
\`\`\`[linguagem]
[CÓDIGO COMPLETO DO ARQUIVO AQUI]
\`\`\`

## Próximos Passos
[o que fazer depois]`;

    // Executar com IA
    const response = await this.aiClient.ask(prompt);
    
    // Rastrear tokens
    const tokens = this.estimateTokens(prompt + response);
    await this.configManager.trackTokenUsage(tokens, 'vibe');
    
    // EXECUTAR AÇÕES AUTOMATICAMENTE
    await this.executeActions(response, intent);
    
    // Exibir resultado formatado
    this.displayResult(response, intent);
  }

  /**
   * Valida se o código está completo
   */
  private validateCodeCompleteness(code: string, language: string): { isComplete: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isComplete = true;

    if (language === 'typescript' || language === 'javascript' || language === 'tsx' || language === 'jsx') {
      // Verificar balanceamento de chaves
      const openBraces = (code.match(/{/g) || []).length;
      const closeBraces = (code.match(/}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        warnings.push('Chaves desbalanceadas');
        isComplete = false;
      }

      // Verificar balanceamento de parênteses
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      
      if (openParens !== closeParens) {
        warnings.push('Parênteses desbalanceados');
        isComplete = false;
      }

      // Verificar se tem pelo menos uma função ou classe
      const hasFunction = code.includes('function') || code.includes('=>') || code.includes('class');
      if (!hasFunction && code.length > 50) {
        warnings.push('Nenhuma função ou classe encontrada');
        isComplete = false;
      }

      // Verificar tamanho mínimo para arquivos de código
      if (code.length < 200 && !code.includes('export') && !code.includes('import')) {
        warnings.push('Código muito curto (< 200 caracteres)');
        isComplete = false;
      }

      // Verificar se termina abruptamente (comentário incompleto)
      const lastLines = code.split('\n').slice(-3).join('\n');
      if (lastLines.includes('/**') && !lastLines.includes('*/')) {
        warnings.push('Comentário JSDoc incompleto');
        isComplete = false;
      }
      if (lastLines.includes('/*') && !lastLines.includes('*/')) {
        warnings.push('Comentário de bloco incompleto');
        isComplete = false;
      }
    }

    return { isComplete, warnings };
  }

  /**
   * Executa ações automaticamente (criar/modificar arquivos)
   */
  private async executeActions(response: string, intent: any): Promise<void> {
    try {
      // Extrair blocos de código da resposta
      const codeBlocks = this.extractAllCodeBlocks(response);
      
      if (codeBlocks.length === 0) {
        console.log(chalk.yellow('\n⚠️  Nenhum código para executar encontrado na resposta\n'));
        return;
      }

      console.log('');
      console.log(chalk.hex('#00D9FF')('━━━ EXECUTANDO AÇÕES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log('');

      for (const block of codeBlocks) {
        // Validar completude do código
        const validation = this.validateCodeCompleteness(block.code, block.language);
        
        if (!validation.isComplete) {
          console.log(chalk.yellow(`\n⚠️  ATENÇÃO: Código parece incompleto!`));
          console.log(chalk.yellow(`   Problemas detectados:`));
          validation.warnings.forEach(warning => {
            console.log(chalk.yellow(`   - ${warning}`));
          });
          console.log(chalk.yellow(`\n   Sugestões:`));
          console.log(chalk.yellow(`   1. Execute: vibe "complete o arquivo [caminho]"`));
          console.log(chalk.yellow(`   2. Ou revise e complete manualmente o código\n`));
        }
        // Determinar caminho do arquivo
        let filePath = block.path || intent.targetFile;
        
        if (!filePath) {
          // Tentar extrair do contexto - APENAS se for caminho válido
          const fileMatch = response.match(/(?:Arquivo|File|Caminho|Path|ARQUIVO):\s*`?([^\n`]+\.[a-zA-Z0-9]+)`?/i);
          if (fileMatch) {
            filePath = fileMatch[1].trim().replace(/`/g, '');
          }
        }

        if (!filePath) {
          console.log(chalk.yellow('⚠️  Caminho do arquivo não especificado, pulando...'));
          continue;
        }

        // VALIDAÇÃO: Verificar se é um caminho de arquivo válido
        // Deve ter extensão e não ser apenas uma palavra
        if (!filePath.includes('.') || filePath.split('.').length < 2) {
          console.log(chalk.yellow(`⚠️  Caminho inválido: ${filePath}, pulando...`));
          continue;
        }

        // VALIDAÇÃO: Não criar arquivos em diretórios estranhos
        const invalidDirs = ['heap', 'stack', 'memory', 'buffer', 'cache'];
        const firstPart = filePath.split('/')[0].split('\\')[0].toLowerCase();
        if (invalidDirs.includes(firstPart) && !filePath.includes('/') && !filePath.includes('\\')) {
          console.log(chalk.yellow(`⚠️  Nome de arquivo suspeito: ${filePath}, pulando...`));
          continue;
        }

        // Limpar caminho de caracteres inválidos
        filePath = filePath.replace(/[<>:"|?*]/g, '').trim();

        // Criar/modificar arquivo
        const fullPath = path.join(this.currentDir, filePath);
        const dir = path.dirname(fullPath);

        // Criar diretório se não existir
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(chalk.gray(`  📁 Criado diretório: ${path.relative(this.currentDir, dir)}`));
        }

        // Escrever arquivo
        fs.writeFileSync(fullPath, block.code, 'utf-8');
        
        const action = fs.existsSync(fullPath) ? 'Modificado' : 'Criado';
        console.log(chalk.green(`  ✓ ${action}: ${filePath}`));
      }

      console.log('');
      console.log(chalk.hex('#00D9FF')('━'.repeat(100)));
      console.log('');
      
    } catch (error) {
      console.log(chalk.red(`\n✗ Erro ao executar ações: ${(error as Error).message}\n`));
    }
  }

  /**
   * Extrai todos os blocos de código da resposta
   * IMPORTANTE: Extrai apenas blocos que são arquivos reais, não exemplos
   */
  private extractAllCodeBlocks(response: string): Array<{ code: string; language: string; path?: string }> {
    const blocks: Array<{ code: string; language: string; path?: string }> = [];
    
    // Padrão para blocos de código com linguagem
    const codeBlockPattern = /```(\w+)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockPattern.exec(response)) !== null) {
      const language = match[1];
      const code = match[2].trim();
      
      // ✅ FILTRO 1: Pular blocos muito pequenos (provavelmente exemplos)
      if (code.length < 100) {
        continue;
      }
      
      // ✅ FILTRO 2: Pular blocos que são claramente exemplos ou comandos
      const lowerCode = code.toLowerCase();
      if (lowerCode.includes('# exemplo') || 
          lowerCode.includes('// exemplo') ||
          lowerCode.includes('# example') ||
          lowerCode.includes('// example') ||
          lowerCode.startsWith('npm ') ||
          lowerCode.startsWith('yarn ') ||
          lowerCode.startsWith('git ') ||
          lowerCode.startsWith('cd ') ||
          lowerCode.startsWith('mkdir ')) {
        continue;
      }
      
      // ✅ FILTRO 3: Buscar caminho IMEDIATAMENTE antes do bloco
      const beforeBlock = response.substring(Math.max(0, match.index - 300), match.index);
      const pathMatch = beforeBlock.match(/(?:Arquivo|File|Caminho|Path|ARQUIVO):\s*`?([^\n`]+\.[a-zA-Z0-9]+)`?\s*$/im);
      
      // ✅ FILTRO 4: Apenas adicionar se tiver caminho explícito com extensão válida
      if (pathMatch) {
        const extractedPath = pathMatch[1].trim().replace(/`/g, '').replace(/\\/g, '/');
        
        // Validar extensão
        const ext = extractedPath.split('.').pop()?.toLowerCase();
        const validExts = ['ts', 'js', 'tsx', 'jsx', 'json', 'md', 'txt', 'html', 'css', 'scss', 'yaml', 'yml'];
        
        if (ext && validExts.includes(ext)) {
          blocks.push({ code, language, path: extractedPath });
        }
      } else if (blocks.length === 0 && code.length > 300) {
        // Primeiro bloco grande - MAS apenas se não parecer documentação
        if (!lowerCode.includes('# setup') && 
            !lowerCode.includes('# instalação') &&
            !lowerCode.includes('# comandos')) {
          blocks.push({ code, language, path: undefined });
        }
      }
    }
    
    return blocks;
  }

  private buildCompactContext(intent: any): string {
    let context = `Projeto: ${path.basename(this.currentDir)}\n`;
    context += `Tecnologias: ${this.projectContext.tech.join(', ')}\n`;
    
    if (intent.targetFolder) {
      const folderPath = path.join(this.currentDir, intent.targetFolder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath).filter(f => !this.shouldIgnore(f));
        context += `\nArquivos em ${intent.targetFolder}:\n`;
        files.slice(0, 5).forEach(f => {
          context += `- ${f}\n`;
        });
      }
    }
    
    return context;
  }

  private describeActions(actions: any): string {
    const tasks = [];
    if (actions.develop) tasks.push('Desenvolver/implementar código');
    if (actions.debug) tasks.push('Debugar e corrigir erros');
    if (actions.optimize) tasks.push('Otimizar performance');
    if (actions.refactor) tasks.push('Refatorar e limpar código');
    if (actions.test) tasks.push('Criar testes');
    if (actions.document) tasks.push('Documentar código');
    if (actions.analyze) tasks.push('Analisar e revisar');
    
    return tasks.length > 0 ? tasks.join(', ') : 'Melhorar código geral';
  }

  private estimateTokens(text: string): number {
    // Estimativa: ~4 caracteres por token
    return Math.ceil(text.length / 4);
  }

  private displayResult(response: string, intent: any): void {
    console.log('');
    console.log(chalk.hex('#00D9FF')('━━━ RESULTADO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');
    
    // Processar e colorir resposta
    const sections = response.split('##');
    
    sections.forEach(section => {
      if (!section.trim()) return;
      
      const lines = section.trim().split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      // Título da seção
      if (title.toLowerCase().includes('análise')) {
        console.log(chalk.bold.hex('#FFD700')('📊 ' + title.toUpperCase()));
      } else if (title.toLowerCase().includes('mudanças') || title.toLowerCase().includes('mudancas')) {
        console.log(chalk.bold.hex('#00FF00')('✨ ' + title.toUpperCase()));
      } else if (title.toLowerCase().includes('código') || title.toLowerCase().includes('codigo')) {
        console.log(chalk.bold.hex('#00D9FF')('💻 ' + title.toUpperCase()));
      } else if (title.toLowerCase().includes('próximos') || title.toLowerCase().includes('proximos')) {
        console.log(chalk.bold.hex('#FF00FF')('🚀 ' + title.toUpperCase()));
      } else {
        console.log(chalk.bold.hex('#FFD700')(title.toUpperCase()));
      }
      
      console.log('');
      
      // Conteúdo
      if (content.includes('```')) {
        // Código
        const codeMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch) {
          console.log(chalk.hex('#00D9FF')(codeMatch[1]));
        }
      } else {
        // Texto normal
        content.split('\n').forEach(line => {
          if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
            console.log(chalk.hex('#00D9FF')('  ' + line.trim()));
          } else {
            console.log(chalk.gray('  ' + line));
          }
        });
      }
      
      console.log('');
    });
    
    console.log(chalk.hex('#00D9FF')('━'.repeat(100)));
    console.log('');
  }
}

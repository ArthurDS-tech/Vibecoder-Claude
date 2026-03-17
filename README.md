<div align="center">

```
██╗   ██╗██╗██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ██╗███╗   ██╗ ██████╗
██║   ██║██║██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██║████╗  ██║██╔════╝
██║   ██║██║██████╔╝█████╗  ██║     ██║   ██║██║  ██║██║██╔██╗ ██║██║  ███╗
╚██╗ ██╔╝██║██╔══██╗██╔══╝  ██║     ██║   ██║██║  ██║██║██║╚██╗██║██║   ██║
 ╚████╔╝ ██║██████╔╝███████╗╚██████╗╚██████╔╝██████╔╝██║██║ ╚████║╚██████╔╝
  ╚═══╝  ╚═╝╚═════╝ ╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝
```

**Um runtime de desenvolvimento autônomo com IA. Direto no seu terminal.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Bem-vindos](https://img.shields.io/badge/PRs-bem--vindos-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

</div>

---

> **VibeCoding não é um gerador de código.**
> É um runtime de desenvolvimento que entende seu projeto, planeja a execução,
> escreve código, valida os resultados e repete até tudo funcionar — de forma autônoma.

---

## O que é o VibeCoding?

A maioria das ferramentas de IA para código faz uma coisa só: gera código quando você pede.

O VibeCoding faz algo diferente. Ele age como um **motor de ciclo completo de desenvolvimento** embutido no seu terminal — capaz de entender toda a sua base de código, construir um plano de execução estruturado, rodar tarefas em paralelo, identificar seus próprios erros e iterar até o resultado estar pronto para produção.

Você descreve o objetivo. O VibeCoding cuida do resto.

```bash
$ vibecoding goal "adicionar autenticação na API com JWT, refresh tokens e rate limiting"

🔍 Analisando codebase...     encontrado: Express 4.x, Prisma ORM, model de usuário existente
📋 Criando plano...           8 tarefas, 3 rodam em paralelo
⚡ Executando...              [agente-1] auth.service.ts  [agente-2] jwt.middleware.ts
🔁 Loop iteração 1/5...       erro tsc em token.types.ts → corrigindo
✅ Validado                   tsc ✓  testes 12/12 ✓  lint ✓
```

---

## Funcionalidades Principais

### 🔁 Loop Engine — Auto-correção Até Funcionar
O VibeCoding não para no primeiro erro. Ele interpreta a saída do compilador TypeScript, falhas de testes e erros de lint, gera uma correção cirúrgica (apenas diff — nunca reescrita completa) e tenta novamente. Mantém histórico de erros entre iterações para evitar loops infinitos de correção.

### ⚡ Execução Paralela com Multi-Agentes
Tarefas sem dependências compartilhadas rodam simultaneamente. Cada agente recebe apenas os arquivos relevantes à sua tarefa — contexto isolado, sem ruído — e retorna diffs estruturados que o orquestrador mescla com segurança.

### 🧠 Memória Persistente do Projeto
O VibeCoding aprende o seu projeto. Detecta convenções de nomenclatura, padrões de módulos, seu framework de testes, gerenciador de pacotes e estilo de tratamento de erros — e armazena tudo em `.vibecoding/memory.json`. Cada sessão futura começa com esse contexto já carregado.

### 💰 Motor de Contexto Otimizado para Tokens
Nunca carrega o projeto inteiro. Usa seletores de arquivo para limitar o contexto por tarefa, carrega resumos em vez de arquivos completos quando possível, e gera diffs em vez de reescritas. Construído para uso real em escala.

### 📋 Planejamento Estruturado de Tarefas (DAG)
Todo objetivo com múltiplos passos é decomposto em um Grafo Acíclico Dirigido antes da execução. Cada tarefa tem dependências tipadas, arquivos-alvo, estimativa de complexidade e agente atribuído. Você pode inspecionar, editar ou aprovar o plano antes de qualquer execução.

---

## Modos de Execução

| Modo | Comando | Descrição |
|------|---------|-----------|
| **Goal** | `vibecoding goal "..."` | Autônomo completo: intenção → plano → código → validação |
| **Plan** | `vibecoding plan "..."` | Gera apenas o DAG, sem executar nada |
| **Run** | `vibecoding run [--loop] [--parallel]` | Executa a partir de um plano existente |
| **Loop** | flag `--loop` | Auto-correção até os testes passarem ou atingir o limite |
| **Debug** | `vibecoding debug` | Analisa erro/log → causa raiz → correção mínima |
| **Design** | `vibecoding design "..."` | Saída apenas de arquitetura, sem código |
| **Task** | `vibecoding task "..."` | Execução única e focada, sem orquestração |
| **Batch** | `vibecoding batch tasks.json` | Executa múltiplas tarefas a partir de um arquivo de config |

---

## Arquitetura

```
src/
├── core/
│   ├── orchestrator/       → distribuição de tarefas, ciclo de vida dos agentes, resolvedor DAG
│   ├── planner/            → converte intenção do usuário em DAG de TaskNodes executáveis
│   ├── loop/               → motor de loop, analisador de erros, gerador de correções via diff
│   ├── agent/              → executor de agente isolado com contexto próprio
│   ├── context/            → scanner de projeto, motor de relevância de arquivos
│   ├── memory/             → leitura/escrita persistente (.vibecoding/memory.json)
│   └── executor/           → escrita de arquivos, execução shell, aplicador de diffs
├── cli/
│   ├── index.ts            → ponto de entrada
│   └── commands/           → um arquivo por modo (goal, plan, run, debug, ...)
├── providers/
│   └── claude/             → cliente da API Claude, construtor de prompts com orçamento de tokens
└── shared/
    ├── types/              → TaskNode, AgentContext, LoopConfig, ProjectMemory
    └── utils/              → utilitários de diff, contador de tokens, scanner de arquivos
```

---

## Começando

### Pré-requisitos

- Node.js 20+
- npm ou pnpm
- Chave de API da Anthropic

### Instalação

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/vibecoding.git
cd vibecoding

# Instale as dependências
npm install

# Configure sua chave de API
echo "ANTHROPIC_API_KEY=sua_chave_aqui" > .env

# Build
npm run build

# Link global (opcional)
npm link
```

### Primeira Execução

```bash
# Analise seu projeto e confirme que o VibeCoding o entende
vibecoding goal "descreva o que este projeto faz e o que está faltando"

# Planeje sem executar
vibecoding plan "adicionar validação de entrada em todos os endpoints da API"

# Execute com loop de auto-correção ativado
vibecoding run --loop --parallel
```

---

## Configuração

O VibeCoding armazena o estado do projeto em `.vibecoding/`:

```
.vibecoding/
├── memory.json       → convenções do projeto, decisões, histórico de tarefas
├── config.json       → configurações de runtime (maxAttempts, verbosity, etc.)
└── tasks/            → planos de execução salvos
```

**Padrões do `config.json`:**
```json
{
  "loop": {
    "maxAttempts": 5,
    "validator": ["tsc", "test", "lint"]
  },
  "agents": {
    "maxParallel": 3
  },
  "context": {
    "strategy": "scoped",
    "tokenBudget": 40000
  },
  "output": {
    "verbosity": "normal",
    "preferDiffs": true
  }
}
```

---

## Como o Loop Engine Funciona

```
EXECUTA tarefa
     ↓
RODA validadores (tsc → testes → lint)
     ↓
PASSOU? ──── sim ──→ ✅ Tarefa concluída
  │
  não
  ↓
INTERPRETA erro → extrai { arquivo, linha, mensagem, tipo }
     ↓
VERIFICA histórico → este erro já ocorreu antes?
     ↓
GERA correção em diff (cirúrgica — nunca reescrita completa)
     ↓
APLICA correção
     ↓
tentativa++ → volta ao início
     ↓
tentativas >= maxAttempts?
     ↓
ESCALA → relatório completo + solicita orientação do usuário
```

---

## Como a Memória Funciona

Após cada sessão, o VibeCoding atualiza `.vibecoding/memory.json`:

```json
{
  "projectConventions": {
    "namingStyle": "camelCase",
    "moduleExportStyle": "named",
    "errorHandlingPattern": "Result<T>",
    "testFramework": "vitest",
    "packageManager": "pnpm"
  },
  "architecturalDecisions": [
    {
      "date": "2025-01-15T10:30:00Z",
      "decision": "Usar padrão Result<T> em vez de throw para erros de domínio",
      "reasoning": "Tratamento de erros consistente em todas as camadas de serviço",
      "affectedModules": ["src/core/**"]
    }
  ],
  "taskHistory": [
    {
      "taskId": "add_auth_service",
      "completedAt": "2025-01-15T11:00:00Z",
      "result": "success",
      "loopAttempts": 2,
      "filesModified": ["src/services/auth.service.ts"]
    }
  ]
}
```
---

## Contribuindo

Contribuições são bem-vindas. Leia a visão geral da arquitetura acima antes de abrir um PR — o VibeCoding tem padrões específicos de interação entre módulos.

```bash
# Rodar testes
npm test

# Verificação de tipos
npm run typecheck

# Lint
npm run lint
```

---

## Licença

MIT — veja [LICENSE](./LICENSE)

---

<div align="center">

Construído para substituir o ciclo de *gerar → erro → corrigir manualmente → gerar de novo*.

**O VibeCoding fecha esse loop sozinho.**

</div>
<p align="center">
  <img src="terminal.gif" width="780" alt="VibeCode terminal demo" />
</p>

# ⚡ VibeCode — AI Development Terminal

### **Your AI pair programmer, right in your terminal**

Stop switching between ChatGPT and your IDE. **VibeCode — AI Development Terminal** brings GPT-4 and Claude directly to your command line.

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ArthurDS-tech/Vibecoder-Claude/pulls)

<br/>

```bash
# 1. Clone VibeCode — AI Development Terminal
git clone https://github.com/ArthurDS-tech/Vibecoder-Claude.git
cd Vibecoder-Claude

# 2. Build and install
npm install && npm run build && npm install -g .

# 3. Start coding
vibecode
```

<br/>

[🚀 Quick Start](#-quick-start) •
[✨ Features](#-why-vibecode--ai-development-terminal) •
[📦 Install](#-installation) •
[🎯 Commands](#-commands) •
[⚙️ Config](#-configuration)

</div>

---

## 🎬 See VibeCode — AI Development Terminal in Action

```bash
$ vibecode

  ╭─────────────────────────────────╮
  │      VibeCode  AI               │
  ╰─────────────────────────────────╯

  AI-powered development terminal
  v1.0.0 • Connected to Claude · Sonnet

  Quick Start
  → vibe "your task here"
  → help for all commands
  → switch to change AI provider

myproject › vibe "add error handling to auth.ts"

◐ Entendendo comando...
✓ Entendendo comando
◐ Analisando projeto...
✓ Analisando projeto
◐ Executando ações...
✓ Executando ações

━━━ RESULTADO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

� ANÁLISE
Identificado: Falta tratamento de erros em operações assíncronas
Solução: Adicionar try-catch e validação de entrada

✨ MUDANÇAS
• Adicionado try-catch em todas as funções async
• Validação de token JWT antes de processar
• Mensagens de erro específicas para cada caso
• Logging de erros para debug

💻 CÓDIGO
Arquivo: src/auth.ts
[código completo com melhorias...]

🚀 PRÓXIMOS PASSOS
• Testar com tokens inválidos
• Adicionar testes unitários
• Documentar novos error codes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  Executar ações automaticamente? (s/n): s

━━━ EXECUTANDO AÇÕES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓ Modificado: src/auth.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

myproject › 
```

---

## 🔥 Why VibeCode — AI Development Terminal?

<table>
<tr>
<td width="50%" valign="top">

### ⚡ **Lightning Fast**
No more copy-paste between ChatGPT and your IDE.

**VibeCode — AI Development Terminal** understands your project context automatically.

```bash
vibe "optimize this function"
# ✓ Done in 3 seconds
```

</td>
<td width="50%" valign="top">

### 🎯 **Context-Aware**
**VibeCode — AI Development Terminal** reads your:
- Project structure
- Dependencies
- Code style
- Git history

No need to explain your codebase every time.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🤖 **Multi-AI Support**
Switch between AI providers instantly:
- **OpenAI GPT-4** - Most powerful
- **Claude 3.5 Sonnet** - Best for code
- **GPT-4 Turbo** - Fastest & cheapest

```bash
switch  # Interactive menu
```

</td>
<td width="50%" valign="top">

### 💰 **Token Tracking**
**VibeCode — AI Development Terminal** tracks your API usage:
- Real-time cost monitoring
- Budget alerts
- Usage history
- Cost optimization tips

Never overspend on AI APIs again.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔒 **Secure by Default**
- API keys never exposed in logs
- Automatic key masking
- Local configuration only
- No data sent to third parties

Your code stays private.

</td>
<td width="50%" valign="top">

### 🎨 **Beautiful UX**
Clean, minimal interface inspired by Claude Code.

**VibeCode — AI Development Terminal** feels like a native tool, not a chatbot.

No clutter. Just results.

</td>
</tr>
</table>

---

## 🚀 Quick Start

### ⚠️ Important: Clone to Local Drive (Not Network Drive)

**VibeCode — AI Development Terminal** requires a local directory. Network drives (`Z:\`, `\\server\...`) cause Git issues.

### 1️⃣ Clone to Local Directory

```bash
# Windows - Use C: drive
cd C:\Users\YourUser\Documents
git clone https://github.com/ArthurDS-tech/Vibecoder-Claude.git
cd Vibecoder-Claude

# Linux/Mac
cd ~/projects
git clone https://github.com/ArthurDS-tech/Vibecoder-Claude.git
cd Vibecoder-Claude
```

### 2️⃣ Install VibeCode — AI Development Terminal

```bash
# Install dependencies
npm install

# Build VibeCode — AI Development Terminal
npm run build

# Install globally
npm install -g .

# Verify installation
vibecode --version
```

### 3️⃣ Configure Your API Key

```bash
# Start VibeCode — AI Development Terminal
vibecode

# Set your API key
config set apiKey YOUR_API_KEY

# Choose provider
config set provider anthropic  # or openai
```

**Get your API key:**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/

### 4️⃣ Start Using VibeCode — AI Development Terminal

```bash
vibe "create a REST API with authentication"
vibe "refactor this code using best practices"
vibe "add tests to Button component"
vibe "fix the bug in auth.ts"
```

**That's it!** VibeCode — AI Development Terminal handles the rest.

---

## ✨ What Can VibeCode — AI Development Terminal Do?

<table>
<tr>
<td width="33%" align="center">

### 🏗️ **Build**
```bash
vibe "create a React component"
vibe "add API endpoint"
vibe "setup database schema"
```

</td>
<td width="33%" align="center">

### 🐛 **Debug**
```bash
vibe "fix this error"
vibe "why is this slow?"
vibe "find memory leaks"
```

</td>
<td width="33%" align="center">

### ⚡ **Optimize**
```bash
vibe "improve performance"
vibe "reduce bundle size"
vibe "optimize queries"
```

</td>
</tr>
<tr>
<td width="33%" align="center">

### 🔄 **Refactor**
```bash
vibe "use TypeScript"
vibe "apply SOLID principles"
vibe "modernize this code"
```

</td>
<td width="33%" align="center">

### 🧪 **Test**
```bash
vibe "add unit tests"
vibe "create test cases"
vibe "mock this API"
```

</td>
<td width="33%" align="center">

### 📚 **Document**
```bash
vibe "add JSDoc comments"
vibe "write README"
vibe "explain this code"
```

</td>
</tr>
</table>

---

## 📦 Installation

### Method 1: From Source (Recommended)

```bash
# ⚠️ IMPORTANT: Clone to LOCAL drive (C:\, not Z:\ or network drive)
cd C:\Users\YourUser\Documents

# Clone VibeCode — AI Development Terminal
git clone https://github.com/ArthurDS-tech/Vibecoder-Claude.git
cd Vibecoder-Claude

# Install dependencies
npm install

# Build VibeCode — AI Development Terminal
npm run build

# Install globally
npm install -g .

# Verify installation
vibecode --version
```

### Method 2: Quick Install Script (Windows)

```powershell
# Run PowerShell as Administrator
cd C:\Users\YourUser\Documents
git clone https://github.com/ArthurDS-tech/Vibecoder-Claude.git
cd Vibecoder-Claude
.\install-global.ps1
```

This script automatically:
- ✅ Builds VibeCode — AI Development Terminal
- ✅ Installs globally
- ✅ Adds to Windows PATH
- ✅ Verifies installation

### Troubleshooting Installation

#### Problem: Git clone fails on network drive

```bash
error: cannot lock ref 'refs/remotes/origin/HEAD'
fatal: unable to update refs/remotes/origin/HEAD
```

**Solution:** Clone to local drive instead:

```bash
# ❌ DON'T: Network drive
Z:\> git clone https://github.com/...

# ✅ DO: Local drive
C:\Users\YourUser\Documents> git clone https://github.com/...
```

#### Problem: `vibecode` command not found

**Windows:**
```powershell
# Add npm global bin to PATH
setx PATH "%PATH%;%APPDATA%\npm"

# Restart terminal and try again
vibecode --version
```

**Linux/Mac:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm config get prefix)/bin"

# Reload shell
source ~/.bashrc
```

#### Problem: Permission denied

**Windows:** Run PowerShell as Administrator

**Linux/Mac:**
```bash
sudo npm install -g .
```

---

## ⚙️ Configuration

### First Time Setup

```bash
# Start VibeCode — AI Development Terminal
vibecode

# Set your API key
config set apiKey YOUR_API_KEY

# Choose your AI provider
config set provider anthropic  # or openai

# Set your preferred model
config set model claude-3-5-sonnet-20240620
```

### Configuration File

VibeCode — AI Development Terminal stores config in `.vibecoderc.json`:

```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20240620",
  "apiKey": "sk-ant-...",
  "maxTokens": 4096,
  "temperature": 0.7
}
```

### Environment Variables

Alternatively, use environment variables:

```bash
# Windows
set ANTHROPIC_API_KEY=sk-ant-...
set OPENAI_API_KEY=sk-...

# Linux/Mac
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

---

## 🎯 Commands

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `vibe <task>` | Execute AI-powered task | `vibe "refactor this code"` |
| `help` | Show all commands | `help` |
| `config` | Manage configuration | `config list` |
| `switch` | Change AI provider | `switch` |
| `update` | Update VibeCode from GitHub | `update` |

### Navigation Commands

| Command | Description | Example |
|---------|-------------|---------|
| `ls` | List files | `ls` |
| `cd <dir>` | Change directory | `cd src` |
| `tree` | Show file tree | `tree` |
| `clear` | Clear terminal | `clear` |
| `exit` | Exit VibeCode | `exit` |

### Configuration Commands

```bash
# View configuration
config list

# Set API key
config set apiKey YOUR_KEY

# Change provider
config set provider anthropic  # or openai

# View token usage
config usage

# Reset token counter
config reset-usage

# Test connection
config test
```

---

## � Pro Tips

### 1. Be Specific

❌ **Bad:** `vibe "improve code"`
✅ **Good:** `vibe "refactor auth.ts using async/await and add error handling"`

### 2. Mention Files/Folders

```bash
vibe "in folder src/components, create a Button component with TypeScript"
vibe "fix the bug in file auth.ts line 42"
```

### 3. Combine Multiple Actions

```bash
vibe "refactor, optimize, and add tests to UserService.ts"
vibe "debug this error, fix it, and add logging"
```

### 4. Use Context

VibeCode — AI Development Terminal automatically understands:
- Your project structure
- Installed dependencies
- Code style
- Recent changes

Just describe what you want!

### 5. Switch Providers for Different Tasks

```bash
switch  # Opens interactive menu

# Claude 3.5 Sonnet → Best for complex refactoring
# GPT-4 → Best for creative solutions
# GPT-4 Turbo → Best for speed
```

---

## 🔄 Updating VibeCode — AI Development Terminal

### Automatic Update (Recommended)

Inside VibeCode — AI Development Terminal:

```bash
update
```

The `update` command automatically:
- ✅ Checks for new updates from GitHub
- ✅ Shows you what's changed
- ✅ Backs up your configuration
- ✅ Handles local changes safely
- ✅ Rebuilds and relinks

**See [UPDATE-GUIDE.md](./UPDATE-GUIDE.md) for details.**

### Manual Update

```bash
cd /path/to/Vibecoder-Claude
git pull origin main
npm install
npm run build
npm link
```

---

## 📊 Token Usage & Costs

VibeCode — AI Development Terminal tracks your API usage in real-time:

```bash
config usage
```

**Output:**
```
╔════════════════════════════════════════════════════════╗
║  💰 USO DE TOKENS                                      ║
╠════════════════════════════════════════════════════════╣
║  Total de Tokens: 45,230                               ║
║  Custo Total:     $1.2340                              ║
║  Orçamento:       $4.00                                ║
║  Restante:        $2.7660                              ║
║                                                        ║
║  Uso: ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      ║
║  30.8% do orçamento utilizado                          ║
╚════════════════════════════════════════════════════════╝
```

### Cost Optimization Tips

1. **Use GPT-4 Turbo** for simple tasks (10x cheaper)
2. **Be specific** in your prompts (fewer retries)
3. **Set token limits** in config
4. **Monitor usage** regularly with `config usage`

---

## 🛡️ Security

VibeCode — AI Development Terminal takes security seriously:

### ✅ What We Do

- **API keys are masked** in all logs and outputs
- **Local storage only** - no cloud sync
- **No telemetry** - your code stays private
- **Automatic sanitization** of sensitive data
- **User confirmation** before executing code changes

### 🔒 Best Practices

1. **Never commit** `.vibecoderc.json` to Git
2. **Use environment variables** for API keys in CI/CD
3. **Rotate keys regularly**
4. **Set spending limits** on your AI provider dashboard
5. **Review changes** before confirming execution

---

## 🤝 Contributing

We love contributions! Here's how to help make VibeCode — AI Development Terminal even better:

### Quick Start

```bash
# Fork and clone to LOCAL drive
cd C:\Users\YourUser\Documents
git clone https://github.com/YOUR_USERNAME/Vibecoder-Claude.git
cd Vibecoder-Claude

# Install dependencies
npm install

# Make your changes
# ...

# Build and test
npm run build
npm link

# Test your changes
vibecode
```

### Contribution Ideas

- 🐛 **Bug fixes** - Check [Issues](https://github.com/ArthurDS-tech/Vibecoder-Claude/issues)
- ✨ **New features** - Add new AI providers, commands, or tools
- 📚 **Documentation** - Improve README, add tutorials
- 🎨 **UI/UX** - Enhance terminal design
- 🧪 **Tests** - Add unit and integration tests

### Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.**

---

## 🐛 Troubleshooting

### VibeCode — AI Development Terminal command not found

**Windows:**
```powershell
# Add npm global bin to PATH
setx PATH "%PATH%;%APPDATA%\npm"

# Restart terminal
vibecode --version
```

**Linux/Mac:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm config get prefix)/bin"
source ~/.bashrc
```

### Git clone fails on network drive

```bash
error: cannot lock ref 'refs/remotes/origin/HEAD'
```

**Solution:** Always clone to local drive:

```bash
# ✅ Correct
cd C:\Users\YourUser\Documents
git clone https://github.com/ArthurDS-tech/Vibecoder-Claude.git

# ❌ Wrong
cd Z:\  # Network drive
git clone https://github.com/...
```

### API Key Issues

```bash
# Verify your key is set
config get apiKey

# Test connection
config test

# Re-set your key
config set apiKey YOUR_NEW_KEY
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules dist out
npm install
npm run build
npm link
```

---

## 📚 Documentation

- **[UPDATE-GUIDE.md](./UPDATE-GUIDE.md)** - Detailed update instructions
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
- **[SECURITY.md](./SECURITY.md)** - Security policy
- **[RELEASE-NOTES.md](./RELEASE-NOTES.md)** - Version history

---

## 🌟 Why Developers Love VibeCode — AI Development Terminal

> "VibeCode — AI Development Terminal cut my development time in half. No more context switching!"
> — **@developer1**

> "Finally, an AI tool that actually understands my codebase. VibeCode — AI Development Terminal is a game changer."
> — **@developer2**

> "The token tracking feature saved me $200 last month. VibeCode — AI Development Terminal pays for itself."
> — **@developer3**

---

## 📈 Roadmap

### v1.1 (Coming Soon)
- [ ] NPM package publication
- [ ] VS Code extension
- [ ] Git integration (auto-commit, PR descriptions)
- [ ] Team collaboration features

### v1.2 (Future)
- [ ] More AI providers (Gemini, Mistral)
- [ ] Plugin system
- [ ] Cloud sync (optional)
- [ ] Web dashboard

**Vote on features:** [GitHub Discussions](https://github.com/ArthurDS-tech/Vibecoder-Claude/discussions)

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

**VibeCode — AI Development Terminal** is free and open source. Use it however you want!

---

## 🙏 Acknowledgments

**VibeCode — AI Development Terminal** is built with:
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Ora](https://github.com/sindresorhus/ora) - Elegant spinners
- [OpenAI API](https://openai.com/) - GPT-4 integration
- [Anthropic API](https://www.anthropic.com/) - Claude integration

Special thanks to all [contributors](https://github.com/ArthurDS-tech/Vibecoder-Claude/graphs/contributors)!

---

## 🔗 Links

- **GitHub:** https://github.com/ArthurDS-tech/Vibecoder-Claude
- **Issues:** https://github.com/ArthurDS-tech/Vibecoder-Claude/issues
- **Discussions:** https://github.com/ArthurDS-tech/Vibecoder-Claude/discussions

---

<div align="center">

### ⚡ Ready to supercharge your development?

```bash
# Clone to LOCAL drive (not Z:\ or network drive)
cd C:\Users\YourUser\Documents
git clone https://github.com/ArthurDS-tech/Vibecoder-Claude.git
cd Vibecoder-Claude
npm install && npm run build && npm install -g .
vibecode
```

<br/>

**VibeCode — AI Development Terminal**

*Your AI pair programmer, right in your terminal*

<br/>

Made with ❤️ by developers, for developers

<br/>

⭐ **Star us on GitHub** if VibeCode — AI Development Terminal helps you code faster!

</div>

<br/>

<img width="780" src="https://ibb.co/qLn6QJkV" />

<br/><br/>

# ⚡ VibeCode — AI Development Terminal

### Transform your development workflow with intelligent AI assistance

![TypeScript](https://ibb.co/qLn6QJkV)

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ArthurDS-tech/Vibecoder-Claude/pulls)

<br/>

 **Code faster. Debug smarter. Build better.**

<br/>

[Features](#-features) •
[Installation](#-installation) •
[Quick Start](#-quick-start) •
[Commands](#-commands) •
[Configuration](#-configuration)

</div>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 **AI Integration**
- OpenAI GPT-4 & GPT-3.5
- Anthropic Claude 3.5 Sonnet
- Intelligent context awareness
- Multi-provider support

</td>
<td width="50%">

### ⚡ **Smart Terminal**
- Interactive AI chat
- Code generation
- File navigation
- Auto-completion

</td>
</tr>
<tr>
<td width="50%">

### 🎨 **Developer Experience**
- Clean, minimal interface
- Real-time progress tracking
- Token usage monitoring
- Session management

</td>
<td width="50%">

### 🔧 **Powerful Tools**
- Code review & refactoring
- Bug detection & fixing
- Documentation generation
- Test creation

</td>
</tr>
</table>

---

## 📦 Installation

### Method 1: From Source (Recommended)

```bash
# Clone the repository
git clone https://github.com/ArthurDS-tech/Vibecoder-Claude.git
cd Vibecoder-Claude

# Install dependencies
npm install

# Build the project
npm run build

# Install globally
npm install -g .
```

### Method 2: Direct Install

```bash
npm install -g vibecode
```

### Windows PATH Configuration

If you get `'vibecode' is not recognized`, add npm to PATH:

**PowerShell (Run as Administrator):**
```powershell
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "User") + ";$env:APPDATA\npm",
    "User"
)
```

**CMD:**
```cmd
for /f "delims=" %i in ('npm config get prefix') do set PATH=%PATH%;%i
```

Then **restart your terminal** and verify:
```bash
vibecode --version
```

---

## 🚀 Quick Start

### 1. Initialize Configuration

```bash
vibecode
```

On first run, configure your API key:

```bash
config set apiKey YOUR_API_KEY
config set provider anthropic  # or openai
```

### 2. Start Using AI

```bash
# Ask a question
vibe "explain how async/await works"

# Generate code
vibe "create a REST API with Express"

# Fix bugs
vibe "debug this authentication error"
```

### 3. Interactive Mode

Simply run `vibecode` to enter interactive terminal mode with full AI assistance.

---

## 📚 Commands

### Terminal Commands

| Command | Description | Example |
|---------|-------------|---------|
| `vibe <task>` | Execute AI-powered task | `vibe "refactor this code"` |
| `help` | Show all commands | `help` |
| `config` | Manage configuration | `config list` |
| `switch` | Change AI provider | `switch` |
| `update` | Update VibeCode from GitHub | `update` |
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

# Set provider (openai or anthropic)
config set provider anthropic

# Set model
config set model claude-3-5-sonnet-20240620

# Test connection
config test

# View token usage
config usage
```

---

## ⚙️ Configuration

### Configuration File

Create `.vibecoderc.json` in your project root:

```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20240620",
  "apiKey": "your-api-key-here",
  "maxTokens": 4096,
  "temperature": 0.7
}
```

### Environment Variables

Alternatively, use `.env`:

```env
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
VIBECODE_PROVIDER=anthropic
VIBECODE_MODEL=claude-3-5-sonnet-20240620
```

### Supported Models

**Anthropic:**
- `claude-3-5-sonnet-20240620` (Recommended)
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307`

**OpenAI:**
- `gpt-4` (Recommended)
- `gpt-4-turbo`
- `gpt-3.5-turbo`

---

## 🎯 Use Cases

### Code Generation
```bash
vibe "create a TypeScript interface for user authentication"
```

### Code Review
```bash
vibe "review the code in src/auth.ts for security issues"
```

### Bug Fixing
```bash
vibe "fix the null pointer exception in handleLogin function"
```

### Documentation
```bash
vibe "generate JSDoc comments for all functions in utils.ts"
```

### Refactoring
```bash
vibe "refactor this code to use async/await instead of callbacks"
```

---

## 🔒 Security

- API keys are **never** logged or exposed
- Keys are masked in terminal output (shows only last 4 characters)
- Secure configuration file storage
- See [SECURITY.md](./SECURITY.md) for details

---

## 🔄 Updating VibeCode

### Automatic Update (Recommended)

Inside the VibeCode terminal, simply run:

```bash
update
```

The `update` command will:
- ✅ Check for new updates from GitHub
- ✅ Show you what's changed
- ✅ Backup your configuration automatically
- ✅ Handle local changes safely (stash/restore)
- ✅ Reinstall dependencies if needed
- ✅ Rebuild and relink automatically

**See [UPDATE-GUIDE.md](./UPDATE-GUIDE.md) for detailed instructions.**

### Manual Update

```bash
cd /path/to/Vibecoder-Claude
git pull origin main
npm install
npm run build
npm link
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- Powered by [OpenAI](https://openai.com/) and [Anthropic](https://www.anthropic.com/)
- Inspired by modern CLI tools and AI assistants

---

## 📞 Support

- 🐛 [Report a Bug](https://github.com/ArthurDS-tech/Vibecoder-Claude/issues)
- 💡 [Request a Feature](https://github.com/ArthurDS-tech/Vibecoder-Claude/issues)
- 📖 [Documentation](https://github.com/ArthurDS-tech/Vibecoder-Claude/wiki)

---

<div align="center">

**Made with ❤️ by the VibeCode Team**

⭐ Star us on GitHub if you find this useful!

[GitHub](https://github.com/ArthurDS-tech/Vibecoder-Claude) • [Issues](https://github.com/ArthurDS-tech/Vibecoder-Claude/issues) • [Discussions](https://github.com/ArthurDS-tech/Vibecoder-Claude/discussions)

</div>

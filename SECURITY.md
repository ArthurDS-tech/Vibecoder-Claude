# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please email security@vibecode.dev

**Please do not open public issues for security vulnerabilities.**

## Security Best Practices

### API Keys
- Never commit `.vibecoderc.json` to version control
- Use `.env` files for local development
- Use environment variables in production
- Rotate keys regularly

### Configuration
- Keep `.vibecoderc.json` in `.gitignore`
- Use `.env.example` as template
- Never share actual API keys

### Data Privacy
- API keys are stored locally only
- No telemetry or tracking
- Your code never leaves your machine (except API calls to OpenAI/Anthropic)

## Secure Setup

```bash
# 1. Copy example config
cp .env.example .env

# 2. Add your API key
# Edit .env and add your key

# 3. Verify .gitignore
cat .gitignore | grep .env
```

## Questions?

Contact: security@vibecode.dev

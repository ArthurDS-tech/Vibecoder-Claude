import * as fs from 'fs';
import * as path from 'path';

/**
 * Security validators for terminal commands
 */

// Dangerous patterns that should be blocked
const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//, // rm -rf /
  /:\(\)\{.*\}/, // Fork bomb
  />\s*\/dev\/sd/, // Writing to disk devices
  /mkfs/, // Format filesystem
  /dd\s+if=.*of=\/dev/, // Disk operations
  /wget.*\|.*sh/, // Download and execute
  /curl.*\|.*sh/, // Download and execute
];

// Allowed shell commands (whitelist approach)
const ALLOWED_SHELL_COMMANDS = new Set([
  'ls', 'cat', 'echo', 'pwd', 'which', 'whoami',
  'git', 'npm', 'yarn', 'pnpm', 'node', 'npx',
  'grep', 'find', 'wc', 'head', 'tail',
]);

/**
 * Validate if a shell command is safe to execute
 */
export function validateShellCommand(command: string): { valid: boolean; reason?: string } {
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return {
        valid: false,
        reason: 'Comando contém padrão perigoso bloqueado',
      };
    }
  }

  // Extract base command
  const baseCommand = command.trim().split(/\s+/)[0];
  
  // Check if command is in whitelist
  if (!ALLOWED_SHELL_COMMANDS.has(baseCommand)) {
    return {
      valid: false,
      reason: `Comando '${baseCommand}' não está na lista de comandos permitidos`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizePath(inputPath: string, baseDir: string): { valid: boolean; sanitized?: string; reason?: string } {
  try {
    // Resolve the path
    const resolved = path.resolve(baseDir, inputPath);
    
    // Check if resolved path is within base directory
    if (!resolved.startsWith(baseDir)) {
      return {
        valid: false,
        reason: 'Tentativa de acesso fora do diretório permitido',
      };
    }

    return {
      valid: true,
      sanitized: resolved,
    };
  } catch (error) {
    return {
      valid: false,
      reason: 'Caminho inválido',
    };
  }
}

/**
 * Validate file exists and is accessible
 */
export function validateFileAccess(filePath: string): { valid: boolean; reason?: string } {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        reason: 'Arquivo não encontrado',
      };
    }

    // Check if it's actually a file
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return {
        valid: false,
        reason: 'Caminho não é um arquivo',
      };
    }

    // Check read permissions
    fs.accessSync(filePath, fs.constants.R_OK);

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: 'Sem permissão de leitura',
    };
  }
}

/**
 * Validate directory exists and is accessible
 */
export function validateDirectoryAccess(dirPath: string): { valid: boolean; reason?: string } {
  try {
    if (!fs.existsSync(dirPath)) {
      return {
        valid: false,
        reason: 'Diretório não encontrado',
      };
    }

    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return {
        valid: false,
        reason: 'Caminho não é um diretório',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: 'Sem permissão de acesso',
    };
  }
}

/**
 * Sanitize user input to prevent injection
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validate API key format (basic check)
 */
export function validateApiKey(key: string, provider: 'openai' | 'anthropic'): { valid: boolean; reason?: string } {
  if (!key || key.trim().length === 0) {
    return {
      valid: false,
      reason: 'API key vazia',
    };
  }

  // Basic format validation
  if (provider === 'openai') {
    if (!key.startsWith('sk-')) {
      return {
        valid: false,
        reason: 'API key OpenAI deve começar com "sk-"',
      };
    }
  } else if (provider === 'anthropic') {
    if (!key.startsWith('sk-ant-')) {
      return {
        valid: false,
        reason: 'API key Anthropic deve começar com "sk-ant-"',
      };
    }
  }

  return { valid: true };
}

/**
 * Check if file size is within acceptable limits
 */
export function validateFileSize(filePath: string, maxSizeMB: number = 10): { valid: boolean; reason?: string } {
  try {
    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);

    if (sizeMB > maxSizeMB) {
      return {
        valid: false,
        reason: `Arquivo muito grande (${sizeMB.toFixed(2)}MB). Máximo: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: 'Erro ao verificar tamanho do arquivo',
    };
  }
}

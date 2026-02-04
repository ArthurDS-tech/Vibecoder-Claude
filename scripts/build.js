#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔨 Building VibeCode...\n');

// 1. Build TypeScript
console.log('📦 Compilando TypeScript...');
execSync('tsc', { stdio: 'inherit' });
console.log('✅ TypeScript compilado\n');

// 2. Build VS Code (opcional, apenas se necessário)
console.log('📦 VS Code build (skip por padrão)');
console.log('   Para build completo do VS Code: cd vscode && npm run compile\n');

console.log('✨ Build completo!\n');

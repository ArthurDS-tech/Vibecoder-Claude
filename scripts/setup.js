#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 VibeCode Setup\n');

// 1. Clone VS Code OSS (opcional - apenas para referência)
console.log('📦 VS Code OSS Setup...');
if (!fs.existsSync('vscode')) {
  console.log('⚠️  VS Code OSS não será clonado agora (requer Visual Studio Build Tools)');
  console.log('   Para desenvolvimento completo, instale:');
  console.log('   1. Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/');
  console.log('   2. Selecione "Desktop development with C++"');
  console.log('   3. Execute: git clone https://github.com/microsoft/vscode.git vscode\n');
} else {
  console.log('✅ VS Code já existe\n');
}

// 3. Create .env template
console.log('📝 Criando template .env...');
const envTemplate = `# VibeCode Configuration
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
DEFAULT_MODEL=gpt-4
`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', envTemplate);
  console.log('✅ Arquivo .env criado\n');
} else {
  console.log('⚠️  .env já existe\n');
}

console.log('✨ Setup completo! Próximos passos:');
console.log('   1. Configure suas API keys no arquivo .env');
console.log('   2. Execute: npm run build');
console.log('   3. Execute: npm run dev\n');

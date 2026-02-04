# VibeCode Global Installer for Windows (PowerShell)
# Run as Administrator: powershell -ExecutionPolicy Bypass -File install-global.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VibeCode Global Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[WARNING] Não está executando como Administrador" -ForegroundColor Yellow
    Write-Host "Algumas operações podem falhar. Recomendado executar como Admin." -ForegroundColor Yellow
    Write-Host ""
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    
    Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Green
    Write-Host "  Node: $nodeVersion" -ForegroundColor Gray
    Write-Host "  NPM: $npmVersion" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[ERROR] Node.js não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale Node.js primeiro:" -ForegroundColor Yellow
    Write-Host "  https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ou use Chocolatey:" -ForegroundColor Yellow
    Write-Host "  choco install nodejs" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Install dependencies
Write-Host "[2/6] Instalando dependências..." -ForegroundColor Green
try {
    npm install
    Write-Host "  Dependências instaladas com sucesso" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[ERROR] Falha ao instalar dependências" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Build project
Write-Host "[3/6] Compilando projeto..." -ForegroundColor Green
try {
    npm run build
    Write-Host "  Projeto compilado com sucesso" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[ERROR] Falha ao compilar projeto" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Link globally
Write-Host "[4/6] Instalando globalmente..." -ForegroundColor Green
try {
    npm link
    Write-Host "  Instalado globalmente com sucesso" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[ERROR] Falha ao instalar globalmente" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente executar como Administrador" -ForegroundColor Yellow
    exit 1
}

# Add to PATH if needed
Write-Host "[5/6] Verificando PATH..." -ForegroundColor Green
$npmPath = "$env:APPDATA\npm"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($currentPath -notlike "*$npmPath*") {
    Write-Host "  Adicionando NPM ao PATH..." -ForegroundColor Yellow
    try {
        [Environment]::SetEnvironmentVariable(
            "Path",
            "$currentPath;$npmPath",
            "User"
        )
        $env:Path += ";$npmPath"
        Write-Host "  PATH atualizado com sucesso" -ForegroundColor Gray
    } catch {
        Write-Host "  [WARNING] Não foi possível atualizar PATH automaticamente" -ForegroundColor Yellow
        Write-Host "  Adicione manualmente: $npmPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "  PATH já configurado corretamente" -ForegroundColor Gray
}
Write-Host ""

# Verify installation
Write-Host "[6/6] Verificando instalação..." -ForegroundColor Green
$vibecodePath = Get-Command vibecode -ErrorAction SilentlyContinue

if ($vibecodePath) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  INSTALAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Comandos disponíveis:" -ForegroundColor Cyan
    Write-Host "  vibecode          " -NoNewline -ForegroundColor White
    Write-Host "- Terminal AI interativo" -ForegroundColor Gray
    Write-Host "  vbt               " -NoNewline -ForegroundColor White
    Write-Host "- Alias curto do terminal" -ForegroundColor Gray
    Write-Host "  vbc ask `"...`"     " -NoNewline -ForegroundColor White
    Write-Host "- Fazer pergunta" -ForegroundColor Gray
    Write-Host "  vbc help          " -NoNewline -ForegroundColor White
    Write-Host "- Ver todos os comandos" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Configure sua API key:" -ForegroundColor Cyan
    Write-Host "  vbc config set apiKey sk-your-key" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou crie arquivo de configuração:" -ForegroundColor Cyan
    Write-Host "  $env:USERPROFILE\.vibecoderc.json" -ForegroundColor White
    Write-Host ""
    Write-Host "Teste agora:" -ForegroundColor Cyan
    Write-Host "  vibecode" -ForegroundColor White
    Write-Host ""
    
    # Create example config file
    $configPath = "$env:USERPROFILE\.vibecoderc.json"
    if (-not (Test-Path $configPath)) {
        Write-Host "Criando arquivo de configuração exemplo..." -ForegroundColor Yellow
        $exampleConfig = @{
            provider = "openai"
            model = "gpt-4"
            apiKey = "YOUR_API_KEY_HERE"
            maxTokens = 4096
            temperature = 0.7
        } | ConvertTo-Json -Depth 10
        
        $exampleConfig | Out-File -FilePath $configPath -Encoding UTF8
        Write-Host "  Arquivo criado: $configPath" -ForegroundColor Gray
        Write-Host "  Edite e adicione sua API key!" -ForegroundColor Gray
        Write-Host ""
    }
    
} else {
    Write-Host ""
    Write-Host "[WARNING] Comando 'vibecode' não encontrado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possíveis soluções:" -ForegroundColor Cyan
    Write-Host "  1. Feche e reabra o terminal" -ForegroundColor White
    Write-Host "  2. Adicione ao PATH manualmente:" -ForegroundColor White
    Write-Host "     $npmPath" -ForegroundColor Gray
    Write-Host "  3. Execute: refreshenv (se tiver Chocolatey)" -ForegroundColor White
    Write-Host ""
}

Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

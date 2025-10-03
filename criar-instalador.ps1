# Script para criar instalador do Gerador de Orçamentos FINITI
# Este script cria um instalador auto-extraível usando ferramentas nativas do Windows

Write-Host "=== CRIANDO INSTALADOR FINITI ===" -ForegroundColor Green
Write-Host ""

# Criar diretório temporário para o instalador
$tempDir = "C:\temp\finiti-installer"
$distDir = ".\dist-manual"

if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

if (Test-Path $distDir) {
    Remove-Item $distDir -Recurse -Force
}
New-Item -ItemType Directory -Path $distDir -Force | Out-Null

Write-Host "1. Copiando arquivos necessários..." -ForegroundColor Yellow

# Lista de arquivos essenciais para o aplicativo
$arquivos = @(
    "main.js",
    "index.html", 
    "style.css",
    "logo.png",
    "logo2.png",
    "orçamento.png",
    "jspdf.umd.min.js",
    "jspdf.plugin.autotable.min.js",
    "js\*",
    "package.json"
)

# Copiar arquivos
foreach ($arquivo in $arquivos) {
    if ($arquivo -like "*\*") {
        $sourceDir = $arquivo.Replace("\*", "")
        if (Test-Path $sourceDir) {
            Copy-Item $sourceDir -Destination "$tempDir\" -Recurse -Force
        }
    } else {
        if (Test-Path $arquivo) {
            Copy-Item $arquivo -Destination "$tempDir\" -Force
        }
    }
}

Write-Host "2. Instalando dependências mínimas..." -ForegroundColor Yellow

# Criar package.json simplificado
$packageSimplificado = @{
    name = "gerador-orcamentos-finiti"
    version = "1.0.0"
    main = "main.js"
    dependencies = @{
        electron = "^38.2.1"
    }
} | ConvertTo-Json -Depth 3

$packageSimplificado | Out-File "$tempDir\package.json" -Encoding UTF8

# Instalar apenas o Electron
Set-Location $tempDir
npm install electron --save --no-optional --no-dev 2>$null

Write-Host "3. Criando scripts de execução..." -ForegroundColor Yellow

# Script de execução
$scriptExecucao = @"
@echo off
title Gerador de Orçamentos - FINITI
color 0A
echo.
echo ========================================
echo    GERADOR DE ORÇAMENTOS - FINITI
echo ========================================
echo.
echo Iniciando aplicativo...
echo.

cd /d "%~dp0"
if exist "node_modules\electron\dist\electron.exe" (
    "node_modules\electron\dist\electron.exe" .
) else (
    echo ERRO: Electron não encontrado!
    echo Reinstale o aplicativo.
    pause
)
"@

$scriptExecucao | Out-File "$tempDir\EXECUTAR_FINITI.bat" -Encoding ASCII

Write-Host "4. Criando instalador auto-extraível..." -ForegroundColor Yellow

# Voltar ao diretório original
Set-Location $PSScriptRoot

# Criar script de instalação
$scriptInstalacao = @"
@echo off
title Instalador - Gerador de Orçamentos FINITI
color 0A
echo.
echo ========================================
echo   INSTALADOR - GERADOR DE ORÇAMENTOS
echo              FINITI
echo ========================================
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\FINITI\Gerador-Orcamentos"

echo Criando diretório de instalação...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo Copiando arquivos...
xcopy /E /I /Y "%~dp0\app\*" "%INSTALL_DIR%\" >nul

echo Criando atalho na área de trabalho...
powershell -Command "& {`$WshShell = New-Object -comObject WScript.Shell; `$Shortcut = `$WshShell.CreateShortcut('%USERPROFILE%\Desktop\Gerador de Orçamentos - FINITI.lnk'); `$Shortcut.TargetPath = '%INSTALL_DIR%\EXECUTAR_FINITI.bat'; `$Shortcut.WorkingDirectory = '%INSTALL_DIR%'; `$Shortcut.IconLocation = '%INSTALL_DIR%\logo.png'; `$Shortcut.Description = 'Gerador de Orçamentos FINITI'; `$Shortcut.Save()}"

echo.
echo ========================================
echo     INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo ========================================
echo.
echo O aplicativo foi instalado em:
echo %INSTALL_DIR%
echo.
echo Um atalho foi criado na área de trabalho.
echo.
echo Pressione qualquer tecla para finalizar...
pause >nul
"@

$scriptInstalacao | Out-File "$distDir\INSTALAR_FINITI.bat" -Encoding ASCII

# Criar diretório app dentro do dist
New-Item -ItemType Directory -Path "$distDir\app" -Force | Out-Null

# Copiar conteúdo do temp para o app
Copy-Item "$tempDir\*" -Destination "$distDir\app\" -Recurse -Force

Write-Host "5. Criando arquivo README..." -ForegroundColor Yellow

$readme = @"
# INSTALADOR GERADOR DE ORÇAMENTOS - FINITI

## Como instalar:

1. Execute o arquivo: INSTALAR_FINITI.bat
2. Aguarde a instalação concluir
3. Use o atalho criado na área de trabalho

## Requisitos:
- Windows 7 ou superior
- Não precisa de Node.js (já incluído)

## Suporte:
Em caso de problemas, entre em contato com o suporte técnico.

Versão: 1.0.0
Data: $(Get-Date -Format "dd/MM/yyyy")
"@

$readme | Out-File "$distDir\LEIA-ME.txt" -Encoding UTF8

# Limpar diretório temporário
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "=== INSTALADOR CRIADO COM SUCESSO! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Localização: $distDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Arquivos criados:" -ForegroundColor White
Write-Host "- INSTALAR_FINITI.bat (instalador principal)" -ForegroundColor Gray
Write-Host "- app\ (aplicativo completo)" -ForegroundColor Gray  
Write-Host "- LEIA-ME.txt (instruções)" -ForegroundColor Gray
Write-Host ""
Write-Host "Para distribuir:" -ForegroundColor Yellow
Write-Host "1. Compacte a pasta 'dist-manual' em um ZIP" -ForegroundColor Gray
Write-Host "2. Envie para as vendedoras" -ForegroundColor Gray
Write-Host "3. Elas executam INSTALAR_FINITI.bat" -ForegroundColor Gray
Write-Host ""
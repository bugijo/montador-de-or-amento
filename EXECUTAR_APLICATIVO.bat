@echo off
title Gerador de Orçamentos - FINITI
color 0A
echo.
echo ========================================
echo   GERADOR DE ORÇAMENTOS - FINITI
echo ========================================
echo.
echo Iniciando aplicativo...
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js não está instalado!
    echo.
    echo Por favor, instale o Node.js:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo Instalando dependências pela primeira vez...
    echo Isso pode demorar alguns minutos...
    echo.
    npm install
    if errorlevel 1 (
        echo.
        echo ERRO: Falha ao instalar dependências!
        pause
        exit /b 1
    )
)

REM Executar o aplicativo
echo Abrindo aplicativo...
npm run electron

REM Se chegou aqui, o aplicativo foi fechado
echo.
echo Aplicativo fechado.
pause
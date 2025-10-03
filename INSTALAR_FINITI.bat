@echo off
title Instalador - Gerador de Orçamentos FINITI
color 0A

echo.
echo ========================================
echo    INSTALADOR FINITI - ORÇAMENTOS
echo ========================================
echo.
echo Instalando o sistema de orçamentos...
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado!

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo.
    echo Instalando dependências... (pode demorar alguns minutos)
    npm install --silent
    if errorlevel 1 (
        echo [ERRO] Falha na instalação das dependências!
        pause
        exit /b 1
    )
    echo [OK] Dependências instaladas!
)

REM Criar atalho na área de trabalho
echo.
echo Criando atalho na área de trabalho...

set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\Gerador de Orçamentos - FINITI.lnk"
set "TARGET=%CD%\EXECUTAR_APLICATIVO.bat"
set "ICON=%CD%\logo2.png"

REM Criar script VBS para criar o atalho
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%SHORTCUT%" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%TARGET%" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%CD%" >> CreateShortcut.vbs
echo oLink.Description = "Gerador de Orçamentos - FINITI" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

REM Executar o script VBS
cscript CreateShortcut.vbs >nul 2>&1
del CreateShortcut.vbs >nul 2>&1

if exist "%SHORTCUT%" (
    echo [OK] Atalho criado na área de trabalho!
) else (
    echo [AVISO] Não foi possível criar o atalho automaticamente.
)

echo.
echo ========================================
echo        INSTALAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo O sistema está pronto para uso!
echo.
echo Para usar:
echo 1. Clique no atalho "Gerador de Orçamentos - FINITI" na área de trabalho
echo 2. OU execute o arquivo "EXECUTAR_APLICATIVO.bat" nesta pasta
echo.
echo ========================================
echo.
pause
# build-pjsip-windows.ps1
# Script para compilar PJSIP no Windows usando Visual Studio

param(
    [string]$Configuration = "Release",
    [string]$Platform = "x64"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$NativeDir = Join-Path $RootDir "native"
$DepsDir = Join-Path $NativeDir "deps"
$PjsipDir = Join-Path $DepsDir "pjproject"

Write-Host "============================================================"
Write-Host "Compilando PJSIP para Windows"
Write-Host "Configuracao: $Configuration"
Write-Host "Plataforma: $Platform"
Write-Host "PJSIP Dir: $PjsipDir"
Write-Host "============================================================"

# Verificar se PJSIP existe
if (-not (Test-Path $PjsipDir)) {
    Write-Host "PJSIP nao encontrado. Execute primeiro: npm run native:setup"
    exit 1
}

# MSBuild path direto
$MsBuildPath = "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe"

if (-not (Test-Path $MsBuildPath)) {
    # Tentar outros caminhos
    $alternatives = @(
        "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\amd64\MSBuild.exe",
        "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe",
        "C:\Program Files\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe"
    )
    
    $found = $false
    foreach ($alt in $alternatives) {
        if (Test-Path $alt) {
            $MsBuildPath = $alt
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "MSBuild nao encontrado. Instale o Visual Studio com C++ build tools."
        exit 1
    }
}

Write-Host "Usando MSBuild: $MsBuildPath"

# Criar config_site.h se não existir
$ConfigSitePath = "$PjsipDir\pjlib\include\pj\config_site.h"
if (-not (Test-Path $ConfigSitePath)) {
    Write-Host "Criando config_site.h..."
    @"
#define PJ_HAS_SSL_SOCK 0
#define PJMEDIA_HAS_VIDEO 0
#define PJSIP_HAS_TLS_TRANSPORT 0
"@ | Out-File -FilePath $ConfigSitePath -Encoding ASCII
}

# Encontrar arquivo de solução
$SlnFile = Get-ChildItem -Path $PjsipDir -Filter "pjproject-vs14*.sln" | Select-Object -First 1

if (-not $SlnFile) {
    Write-Host "Arquivo de solucao do Visual Studio nao encontrado."
    exit 1
}

Write-Host "Compilando: $($SlnFile.FullName)"

# Compilar com upgrade para toolset v142 (VS2019)
& "$MsBuildPath" "$($SlnFile.FullName)" /p:Configuration=$Configuration /p:Platform=$Platform /p:PlatformToolset=v142 /m /v:minimal

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro na compilacao!"
    exit 1
}

# Copiar bibliotecas para deps/pjproject/lib
$LibDir = "$PjsipDir\lib"
if (-not (Test-Path $LibDir)) {
    New-Item -ItemType Directory -Path $LibDir -Force | Out-Null
}

Write-Host "Copiando bibliotecas para $LibDir..."

# Encontrar e copiar todas as .lib
$LibFiles = Get-ChildItem -Path $PjsipDir -Filter "*.lib" -Recurse | Where-Object { 
    $_.DirectoryName -like "*$Platform*" -or $_.DirectoryName -like "*Release*" 
}

foreach ($lib in $LibFiles) {
    $destPath = "$LibDir\$($lib.Name)"
    Copy-Item -Path $lib.FullName -Destination $destPath -Force
    Write-Host "  Copiado: $($lib.Name)"
}

Write-Host "============================================================"
Write-Host "Compilacao concluida!"
Write-Host "============================================================"

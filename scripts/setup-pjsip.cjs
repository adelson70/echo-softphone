#!/usr/bin/env node

/**
 * @file setup-pjsip.js
 * @brief Script para baixar e configurar PJSIP para o módulo nativo
 * 
 * Este script:
 * 1. Clona o repositório PJSIP
 * 2. Configura para a plataforma atual
 * 3. Compila as bibliotecas necessárias
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PJSIP_VERSION = '2.14.1';
const PJSIP_REPO = 'https://github.com/pjsip/pjproject.git';
const NATIVE_DIR = path.join(__dirname, '..', 'native');
const DEPS_DIR = path.join(NATIVE_DIR, 'deps');
const PJSIP_DIR = path.join(DEPS_DIR, 'pjproject');

function log(msg) {
    console.log(`[PJSIP Setup] ${msg}`);
}

function error(msg) {
    console.error(`[PJSIP Setup ERROR] ${msg}`);
    process.exit(1);
}

function exec(cmd, opts = {}) {
    log(`Executando: ${cmd}`);
    try {
        execSync(cmd, { 
            stdio: 'inherit',
            ...opts
        });
    } catch (e) {
        error(`Falha ao executar: ${cmd}`);
    }
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function clonePjsip() {
    if (fs.existsSync(PJSIP_DIR)) {
        log('PJSIP já existe, pulando clone...');
        return;
    }

    log(`Clonando PJSIP ${PJSIP_VERSION}...`);
    ensureDir(DEPS_DIR);
    
    exec(`git clone --depth 1 --branch ${PJSIP_VERSION} ${PJSIP_REPO} "${PJSIP_DIR}"`);
}

function configurePjsipLinux() {
    log('Configurando PJSIP para Linux...');
    
    // Criar config_site.h
    const configSite = `
#define PJ_HAS_SSL_SOCK 0
#define PJMEDIA_HAS_VIDEO 0
#define PJMEDIA_AUDIO_DEV_HAS_ALSA 1
#define PJMEDIA_AUDIO_DEV_HAS_PORTAUDIO 0
#define PJSIP_HAS_TLS_TRANSPORT 0
`;
    
    const configPath = path.join(PJSIP_DIR, 'pjlib', 'include', 'pj', 'config_site.h');
    fs.writeFileSync(configPath, configSite);
    
    // Configurar e compilar
    exec('./configure --disable-video --disable-ssl --disable-openh264 --disable-v4l2 --disable-libwebrtc', { cwd: PJSIP_DIR });
    exec('make dep', { cwd: PJSIP_DIR });
    exec('make', { cwd: PJSIP_DIR });
}

function configurePjsipWindows() {
    log('Configurando PJSIP para Windows...');
    
    // Criar config_site.h
    const configSite = `
#define PJ_HAS_SSL_SOCK 0
#define PJMEDIA_HAS_VIDEO 0
#define PJSIP_HAS_TLS_TRANSPORT 0
`;
    
    const configPath = path.join(PJSIP_DIR, 'pjlib', 'include', 'pj', 'config_site.h');
    fs.writeFileSync(configPath, configSite);
    
    log('Para Windows, compile usando Visual Studio:');
    log('1. Abra pjproject-vs14.sln em Visual Studio');
    log('2. Configure para Release x64');
    log('3. Build All');
    log('');
    log('Ou use o script PowerShell: scripts/build-pjsip-windows.ps1');
}

function configurePjsipMac() {
    log('Configurando PJSIP para macOS...');
    
    // Criar config_site.h
    const configSite = `
#define PJ_HAS_SSL_SOCK 0
#define PJMEDIA_HAS_VIDEO 0
#define PJMEDIA_AUDIO_DEV_HAS_PORTAUDIO 0
#define PJMEDIA_AUDIO_DEV_HAS_COREAUDIO 1
#define PJSIP_HAS_TLS_TRANSPORT 0
`;
    
    const configPath = path.join(PJSIP_DIR, 'pjlib', 'include', 'pj', 'config_site.h');
    fs.writeFileSync(configPath, configSite);
    
    // Configurar e compilar
    exec('./configure --disable-video --disable-ssl --disable-openh264', { cwd: PJSIP_DIR });
    exec('make dep', { cwd: PJSIP_DIR });
    exec('make', { cwd: PJSIP_DIR });
}

function copyLibraries() {
    const libDir = path.join(PJSIP_DIR, 'lib');
    ensureDir(libDir);
    
    log('Bibliotecas serão copiadas para: ' + libDir);
    
    // No Linux/Mac, as libs já são compiladas no diretório correto
    // No Windows, precisam ser copiadas do diretório de build
}

function main() {
    log('='.repeat(60));
    log('Configuração do PJSIP para Echo Softphone');
    log('='.repeat(60));
    
    const platform = os.platform();
    log(`Plataforma detectada: ${platform}`);
    
    // Clone PJSIP
    clonePjsip();
    
    // Configurar para a plataforma
    switch (platform) {
        case 'linux':
            configurePjsipLinux();
            break;
        case 'win32':
            configurePjsipWindows();
            break;
        case 'darwin':
            configurePjsipMac();
            break;
        default:
            error(`Plataforma não suportada: ${platform}`);
    }
    
    copyLibraries();
    
    log('='.repeat(60));
    log('Configuração concluída!');
    log('='.repeat(60));
}

main();

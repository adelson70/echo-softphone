#!/usr/bin/env node

/**
 * @file rebuild-native.js
 * @brief Script para rebuildar o módulo nativo após empacotamento
 * 
 * Este script é executado pelo electron-builder após o empacotamento
 * para garantir que os binários nativos estejam corretos.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const NATIVE_DIR = path.join(__dirname, '..', 'native');

function log(msg) {
    console.log(`[Native Rebuild] ${msg}`);
}

function rebuild(context) {
    const { appOutDir, packager } = context;
    const platform = packager.platform.name;
    const arch = packager.packager?.config?.electronVersion ? 'x64' : process.arch;
    
    log(`Plataforma: ${platform}, Arquitetura: ${arch}`);
    log(`Diretório de saída: ${appOutDir}`);
    
    // Verificar se o addon existe
    const addonPath = path.join(NATIVE_DIR, 'build', 'Release', 'pjsip_addon.node');
    
    if (!fs.existsSync(addonPath)) {
        log('Addon não encontrado, pulando rebuild...');
        return;
    }
    
    // Copiar addon para o diretório de recursos
    const resourcesDir = path.join(appOutDir, 'resources', 'native');
    
    if (!fs.existsSync(resourcesDir)) {
        fs.mkdirSync(resourcesDir, { recursive: true });
    }
    
    const destPath = path.join(resourcesDir, 'pjsip_addon.node');
    fs.copyFileSync(addonPath, destPath);
    
    log(`Addon copiado para: ${destPath}`);
}

// Exportar para uso pelo electron-builder
module.exports = rebuild;

// Se executado diretamente
if (require.main === module) {
    log('Executando rebuild manual...');
    
    // Verificar se electron-rebuild está disponível
    try {
        execSync('npx electron-rebuild --version', { stdio: 'pipe' });
    } catch {
        log('electron-rebuild não encontrado, instalando...');
        execSync('npm install --save-dev @electron/rebuild', { stdio: 'inherit' });
    }
    
    // Executar rebuild
    try {
        const electronVersion = require(path.join(__dirname, '..', 'node_modules', 'electron', 'package.json')).version;
        log(`Versão do Electron: ${electronVersion}`);
        
        execSync(`npx electron-rebuild -f -w pjsip_addon -v ${electronVersion}`, {
            cwd: NATIVE_DIR,
            stdio: 'inherit'
        });
        
        log('Rebuild concluído com sucesso!');
    } catch (e) {
        log(`Erro no rebuild: ${e.message}`);
        process.exit(1);
    }
}

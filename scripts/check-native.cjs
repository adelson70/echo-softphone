#!/usr/bin/env node

/**
 * @file check-native.js
 * @brief Verifica se o módulo nativo está disponível
 * 
 * Este script é executado no postinstall para informar ao desenvolvedor
 * se o módulo nativo está compilado ou não.
 */

const fs = require('fs');
const path = require('path');

const nativeAddonPath = path.join(__dirname, '..', 'native', 'build', 'Release', 'pjsip_addon.node');
const pjsipPath = path.join(__dirname, '..', 'native', 'deps', 'pjproject');

console.log('\n' + '='.repeat(60));
console.log('Echo Softphone - Verificação do Módulo Nativo');
console.log('='.repeat(60) + '\n');

// Verificar se PJSIP está presente
const hasPjsip = fs.existsSync(pjsipPath);
console.log(`PJSIP fonte: ${hasPjsip ? '✓ Encontrado' : '✗ Não encontrado'}`);

// Verificar se addon está compilado
const hasAddon = fs.existsSync(nativeAddonPath);
console.log(`Addon nativo: ${hasAddon ? '✓ Compilado' : '✗ Não compilado'}`);

console.log('\n' + '-'.repeat(60));

if (!hasPjsip) {
    console.log('\nPara habilitar suporte UDP/TCP, execute:');
    console.log('  npm run native:setup\n');
}

if (hasPjsip && !hasAddon) {
    console.log('\nPJSIP encontrado. Para compilar o addon nativo, execute:');
    console.log('  npm run native:build\n');
}

if (hasAddon) {
    console.log('\n✓ Módulo nativo está pronto!');
    console.log('  Suporte a UDP e TCP está habilitado.\n');
} else {
    console.log('\nSem módulo nativo, apenas WebSocket (WSS) estará disponível.');
    console.log('O aplicativo funcionará normalmente com sip.js.\n');
}

console.log('='.repeat(60) + '\n');

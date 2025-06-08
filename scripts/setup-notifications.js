#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔔 Configurando notificações push para produção...\n');

// Verificar se o EAS CLI está instalado
try {
  execSync('eas --version', { stdio: 'ignore' });
  console.log('✅ EAS CLI encontrado');
} catch (error) {
  console.log('❌ EAS CLI não encontrado. Instalando...');
  execSync('npm install -g @expo/eas-cli', { stdio: 'inherit' });
}

// Verificar se o projeto está logado no Expo
try {
  execSync('eas whoami', { stdio: 'ignore' });
  console.log('✅ Logado no Expo');
} catch (error) {
  console.log('⚠️  Você precisa fazer login no Expo:');
  console.log('   Executar: eas login');
  process.exit(1);
}

// Verificar se o projeto tem um projectId válido
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

if (!appJson.expo.extra?.eas?.projectId) {
  console.log('❌ ProjectId não encontrado no app.json');
  console.log('   Executar: eas init');
  process.exit(1);
}

console.log(`✅ ProjectId configurado: ${appJson.expo.extra.eas.projectId}`);

// Instruções para configuração
console.log('\n📋 Próximos passos para configurar notificações:');
console.log('');
console.log('1. 🔧 Configure as credenciais push:');
console.log('   eas credentials');
console.log('');
console.log('2. 🏗️ Build de desenvolvimento:');
console.log('   eas build --profile development --platform android');
console.log('   eas build --profile development --platform ios');
console.log('');
console.log('3. 🚀 Build de produção:');
console.log('   eas build --profile production --platform android');
console.log('   eas build --profile production --platform ios');
console.log('');
console.log('4. 📱 Testar notificações:');
console.log('   - Instalar o app em dispositivo físico');
console.log('   - Fazer login na aplicação');
console.log('   - Verificar se o token foi registrado no backend');
console.log('   - Enviar notificação de teste');
console.log('');
console.log('💡 Dicas importantes:');
console.log('   - Notificações só funcionam em dispositivos físicos');
console.log('   - Para iOS, você precisa de uma conta Apple Developer');
console.log('   - Para Android, as credenciais são geradas automaticamente');
console.log('');
console.log('🔗 Documentação completa:');
console.log('   https://docs.expo.dev/push-notifications/overview/');

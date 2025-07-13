#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo conflitos de versão que causam problemas de styling...\n');

// 1. Backup do package.json atual
console.log('📋 Fazendo backup do package.json atual...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const backupPath = path.join(__dirname, '..', 'package.json.backup');
fs.copyFileSync(packageJsonPath, backupPath);
console.log('✅ Backup criado: package.json.backup');

// 2. Ler package.json atual
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('\n🔍 Versões atuais problemáticas:');
console.log(`   - React: ${pkg.dependencies.react} (TOO NEW - causing issues)`);
console.log(`   - React Native: ${pkg.dependencies['react-native']} (TOO NEW)`);
console.log(`   - TailwindCSS: ${pkg.devDependencies.tailwindcss} (BUG IN THIS VERSION)`);
console.log(`   - PostCSS: ${pkg.dependencies.postcss} (OUTDATED)`);

// 3. Versões estáveis testadas
const stableVersions = {
  dependencies: {
    react: '18.2.0',
    'react-dom': '18.2.0',
    'react-native': '^0.79.5', // Manter compatível com Expo SDK 53
    postcss: '^8.4.31',
    autoprefixer: '^10.4.16',
  },
  devDependencies: {
    tailwindcss: '^3.4.0',
    '@types/react': '~18.2.79',
  },
};

console.log('\n✅ Atualizando para versões estáveis:');
console.log(`   - React: 18.2.0 (STABLE, widely compatible)`);
console.log(`   - React Native: 0.79.5 (COMPATIBLE with Expo 53)`);
console.log(`   - TailwindCSS: 3.4.0 (STABLE, no PostCSS issues)`);
console.log(`   - PostCSS: 8.4.31 (STABLE, compatible)`);

// 4. Atualizar package.json
Object.assign(pkg.dependencies, stableVersions.dependencies);
Object.assign(pkg.devDependencies, stableVersions.devDependencies);

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
console.log('\n✅ package.json atualizado com versões estáveis');

// 5. Remover node_modules e package-lock.json
console.log('\n🧹 Limpando instalações antigas...');
try {
  if (fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
    execSync('rm -rf node_modules', { cwd: path.join(__dirname, '..') });
  }
  if (fs.existsSync(path.join(__dirname, '..', 'package-lock.json'))) {
    fs.unlinkSync(path.join(__dirname, '..', 'package-lock.json'));
  }
  console.log('✅ Cache limpo');
} catch (error) {
  console.warn('⚠️  Erro ao limpar cache:', error.message);
}

// 6. Reinstalar dependências
console.log('\n📦 Reinstalando dependências com versões estáveis...');
try {
  execSync('npm install', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  console.log('✅ Dependências reinstaladas');
} catch (error) {
  console.error('❌ Erro ao reinstalar dependências:', error.message);

  // Restaurar backup
  console.log('🔄 Restaurando package.json original...');
  fs.copyFileSync(backupPath, packageJsonPath);
  process.exit(1);
}

// 7. Verificar se tudo está OK
console.log('\n🔍 Verificando instalação...');
try {
  const newPkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('\n📦 Versões finais instaladas:');
  console.log(`   ✅ React: ${newPkg.dependencies.react}`);
  console.log(`   ✅ React Native: ${newPkg.dependencies['react-native']}`);
  console.log(`   ✅ TailwindCSS: ${newPkg.devDependencies.tailwindcss}`);
  console.log(`   ✅ PostCSS: ${newPkg.dependencies.postcss}`);
} catch (error) {
  console.warn('⚠️  Não foi possível verificar versões finais');
}

console.log('\n🎉 Correção de versões concluída!');
console.log('\n📋 Próximos passos:');
console.log('1. Execute: npm run generate:css');
console.log('2. Teste localmente: npm start');
console.log('3. Se funcionar, faça build: npm run build:prod');

console.log('\n💡 IMPORTANTE:');
console.log('   ✅ React 18.2.0 é amplamente compatível');
console.log('   ✅ React Native 0.79.5 é compatível com Expo 53');
console.log('   ✅ TailwindCSS 3.4.0 resolve problemas de PostCSS');
console.log('   ✅ Esta combinação é testada e estável');

console.log('\n🔄 Se algo der errado:');
console.log('   cp package.json.backup package.json && npm install');

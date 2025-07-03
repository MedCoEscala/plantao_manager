#!/usr/bin/env node

/**
 * Script para testar se os path aliases estão funcionando corretamente
 * no Metro bundler com Expo SDK 53
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testando Path Aliases no Expo SDK 53...\n');

// 1. Verificar se tsconfig.json está configurado
console.log('1. Verificando tsconfig.json...');
try {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

  if (tsconfig.compilerOptions?.paths?.['@/*']) {
    console.log('✅ Path aliases configurados no tsconfig.json');
  } else {
    console.log('❌ Path aliases NÃO configurados no tsconfig.json');
  }
} catch (error) {
  console.log('❌ Erro ao ler tsconfig.json:', error.message);
}

// 2. Verificar se app.json tem experiments.tsconfigPaths
console.log('\n2. Verificando app.json...');
try {
  const appJsonPath = path.join(process.cwd(), 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  if (appJson.expo?.experiments?.tsconfigPaths) {
    console.log('✅ tsconfigPaths habilitado no app.json');
  } else {
    console.log('❌ tsconfigPaths NÃO habilitado no app.json');
  }
} catch (error) {
  console.log('❌ Erro ao ler app.json:', error.message);
}

// 3. Verificar configuração do Metro
console.log('\n3. Verificando metro.config.js...');
try {
  const metroConfigPath = path.join(process.cwd(), 'metro.config.js');
  const metroConfig = fs.readFileSync(metroConfigPath, 'utf8');

  if (metroConfig.includes('unstable_enablePackageExports: false')) {
    console.log('✅ Package exports desabilitado no metro.config.js');
  } else {
    console.log('⚠️  Package exports pode estar causando conflitos');
  }

  if (metroConfig.includes('resolveRequest')) {
    console.log('✅ Resolver customizado configurado');
  } else {
    console.log('❌ Resolver customizado NÃO configurado');
  }
} catch (error) {
  console.log('❌ Erro ao ler metro.config.js:', error.message);
}

// 4. Testar resolução de path aliases
console.log('\n4. Testando resolução de path aliases...');
try {
  // Verificar se existe algum arquivo com import @/
  const testFile = path.join(process.cwd(), 'app/(auth)/reset-password.tsx');
  if (fs.existsSync(testFile)) {
    const content = fs.readFileSync(testFile, 'utf8');
    if (content.includes('@/')) {
      console.log('✅ Imports @/ encontrados em reset-password.tsx');
    } else {
      console.log('ℹ️  Não há imports @/ em reset-password.tsx');
    }
  }
} catch (error) {
  console.log('❌ Erro ao testar resolução:', error.message);
}

// 5. Testar build
console.log('\n5. Testando build local...');
try {
  console.log('Executando: npx expo export --platform android --clear');
  execSync('npx expo export --platform android --clear', {
    stdio: 'pipe',
    timeout: 60000,
  });
  console.log('✅ Build local bem-sucedido');
} catch (error) {
  console.log('❌ Build local falhou:', error.message.substring(0, 200) + '...');
}

console.log('\n🎯 Teste de Path Aliases concluído!');
console.log('\nSe todos os testes passaram, teste no EAS Build:');
console.log('eas build --platform android --profile preview --clear-cache');

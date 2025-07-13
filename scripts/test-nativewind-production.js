#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico NativeWind - Produção\n');

// Verificar se as dependências estão corretas
function checkDependencies() {
  console.log('📦 Verificando dependências...');

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    console.log(`✅ NativeWind: ${deps.nativewind || 'AUSENTE'}`);
    console.log(`✅ TailwindCSS: ${deps.tailwindcss || 'AUSENTE'}`);
    console.log(`✅ React Native: ${deps['react-native'] || 'AUSENTE'}`);
    console.log(`✅ Expo: ${deps.expo || 'AUSENTE'}`);

    if (!deps.nativewind || !deps.tailwindcss) {
      console.log('❌ Dependências críticas faltando!');
      return false;
    }

    return true;
  } catch (error) {
    console.log(`❌ Erro ao ler package.json: ${error.message}`);
    return false;
  }
}

// Verificar arquivos de configuração
function checkConfigFiles() {
  console.log('\n⚙️  Verificando arquivos de configuração...');

  const files = [
    'global.css',
    'tailwind.config.js',
    'metro.config.js',
    'babel.config.js',
    'app.d.ts',
  ];

  files.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - AUSENTE!`);
    }
  });
}

// Verificar conteúdo do babel.config.js
function checkBabelConfig() {
  console.log('\n🔧 Verificando configuração Babel...');

  try {
    const babelContent = fs.readFileSync('babel.config.js', 'utf8');

    if (babelContent.includes('nativewind/babel')) {
      console.log('✅ Preset nativewind/babel encontrado');
    } else {
      console.log('❌ Preset nativewind/babel ausente - CRÍTICO!');
    }

    if (babelContent.includes('jsxImportSource')) {
      console.log('✅ jsxImportSource configurado');
    } else {
      console.log('❌ jsxImportSource ausente');
    }
  } catch (error) {
    console.log(`❌ Erro ao ler babel.config.js: ${error.message}`);
  }
}

// Verificar conteúdo do global.css
function checkGlobalCSS() {
  console.log('\n🎨 Verificando global.css...');

  try {
    const cssContent = fs.readFileSync('global.css', 'utf8');

    const requiredDirectives = ['@tailwind base', '@tailwind components', '@tailwind utilities'];
    requiredDirectives.forEach((directive) => {
      if (cssContent.includes(directive)) {
        console.log(`✅ ${directive}`);
      } else {
        console.log(`❌ ${directive} - AUSENTE!`);
      }
    });
  } catch (error) {
    console.log(`❌ Erro ao ler global.css: ${error.message}`);
  }
}

// Verificar cache do NativeWind
function checkNativeWindCache() {
  console.log('\n🗂️  Verificando cache NativeWind...');

  const cachePaths = ['node_modules/.nativewind', 'node_modules/.cache/nativewind', '.expo/cache'];

  let cacheFound = false;
  cachePaths.forEach((cachePath) => {
    if (fs.existsSync(cachePath)) {
      console.log(`✅ Cache encontrado: ${cachePath}`);
      cacheFound = true;
    }
  });

  if (!cacheFound) {
    console.log('⚠️  Nenhum cache NativeWind encontrado');
  }
}

// Testar build local
function testLocalBuild() {
  console.log('\n🏗️  Testando build local...');

  try {
    console.log('Limpando cache...');
    execSync('rm -rf .expo node_modules/.cache', { stdio: 'inherit' });

    console.log('Testando bundle...');
    execSync('npx expo export --platform android --output-dir ./test-build', { stdio: 'inherit' });

    console.log('✅ Build local bem-sucedido!');

    // Verificar se CSS foi incluído no bundle
    if (fs.existsSync('./test-build')) {
      console.log('📁 Conteúdo do build gerado:');
      execSync('find ./test-build -name "*.css" -o -name "*.js" | head -10', { stdio: 'inherit' });

      // Limpar build de teste
      execSync('rm -rf ./test-build', { stdio: 'inherit' });
    }
  } catch (error) {
    console.log(`❌ Erro no build local: ${error.message}`);
  }
}

// Executar todos os diagnósticos
function runDiagnostics() {
  checkDependencies();
  checkConfigFiles();
  checkBabelConfig();
  checkGlobalCSS();
  checkNativeWindCache();

  console.log('\n🚀 Executando teste de build...');
  testLocalBuild();

  console.log('\n✨ Diagnóstico completo!');
  console.log('\n📋 Se todos os testes passaram mas o problema persiste:');
  console.log('1. Execute: npm run build:android');
  console.log('2. Teste o APK gerado em um device físico');
  console.log('3. Verifique logs específicos do dispositivo');
}

runDiagnostics();

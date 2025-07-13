#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configurações para build de produção...\n');

// Função para verificar se um arquivo existe
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - AUSENTE!`);
    return false;
  }
}

// Função para verificar conteúdo de arquivo
function checkFileContent(filePath, pattern, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (pattern.test(content)) {
      console.log(`✅ ${description}`);
      return true;
    } else {
      console.log(`❌ ${description} - CONFIGURAÇÃO AUSENTE!`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar ${filePath}: ${error.message}`);
    return false;
  }
}

let allChecksPass = true;

console.log('📁 Verificando arquivos essenciais:');
allChecksPass &= checkFile('global.css', 'Global CSS');
allChecksPass &= checkFile('tailwind.config.js', 'Tailwind Config');
allChecksPass &= checkFile('metro.config.js', 'Metro Config');
allChecksPass &= checkFile('eas.json', 'EAS Config');
allChecksPass &= checkFile('app.json', 'App Config');

console.log('\n⚙️  Verificando configurações do NativeWind:');
allChecksPass &= checkFileContent(
  'global.css',
  /@tailwind base;.*@tailwind components;.*@tailwind utilities;/s,
  'Global CSS contém diretivas Tailwind corretas'
);

allChecksPass &= checkFileContent(
  'tailwind.config.js',
  /presets:\s*\[require\("nativewind\/preset"\)\]/,
  'Tailwind usando preset do NativeWind'
);

allChecksPass &= checkFileContent(
  'metro.config.js',
  /withNativeWind.*input.*global\.css/s,
  'Metro configurado com NativeWind'
);

allChecksPass &= checkFileContent(
  'app/_layout.tsx',
  /import.*global\.css/,
  'Global CSS importado no _layout.tsx'
);

console.log('\n🏗️  Verificando configurações EAS Build:');
allChecksPass &= checkFileContent(
  'eas.json',
  /NATIVEWIND_OUTPUT.*native/,
  'Environment variable NATIVEWIND_OUTPUT configurada'
);

allChecksPass &= checkFileContent(
  'eas.json',
  /buildType.*app-bundle/,
  'Build type configurado para app-bundle'
);

console.log('\n📦 Verificando dependências:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  if (packageJson.dependencies.nativewind) {
    const version = packageJson.dependencies.nativewind;
    console.log(`✅ NativeWind instalado: ${version}`);

    if (version.includes('4.') || version === 'latest') {
      console.log(`✅ Versão compatível do NativeWind (v4+)`);
    } else {
      console.log(`⚠️  Versão do NativeWind pode não ser compatível: ${version}`);
      allChecksPass = false;
    }
  } else {
    console.log(`❌ NativeWind não encontrado nas dependências!`);
    allChecksPass = false;
  }

  // Verificar TailwindCSS em dependencies ou devDependencies
  const tailwindVersion =
    packageJson.dependencies?.tailwindcss || packageJson.devDependencies?.tailwindcss;
  if (tailwindVersion) {
    console.log(`✅ TailwindCSS instalado: ${tailwindVersion}`);
  } else {
    console.log(`❌ TailwindCSS não encontrado nas dependências!`);
    allChecksPass = false;
  }

  // Verificar autoprefixer em devDependencies
  if (packageJson.devDependencies?.autoprefixer) {
    console.log(`✅ Autoprefixer instalado: ${packageJson.devDependencies.autoprefixer}`);
  } else {
    console.log(`⚠️  Autoprefixer não encontrado em devDependencies`);
  }
} catch (error) {
  console.log(`❌ Erro ao verificar package.json: ${error.message}`);
  allChecksPass = false;
}

console.log('\n🧹 Limpando cache antes do build...');
try {
  console.log('Removendo .expo/...');
  execSync('rm -rf .expo', { stdio: 'inherit' });

  console.log('Removendo node_modules/.cache...');
  execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });

  console.log('✅ Cache limpo com sucesso');
} catch (error) {
  console.log(`⚠️  Aviso: Erro ao limpar cache: ${error.message}`);
}

console.log('\n' + '='.repeat(50));
if (allChecksPass) {
  console.log('🎉 TODAS AS VERIFICAÇÕES PASSARAM!');
  console.log('✅ Seu projeto está pronto para build de produção.');
  console.log('\n📝 Para fazer o build de produção, execute:');
  console.log('   npm run build:android');
  console.log('   ou');
  console.log('   eas build --platform android --profile production');
} else {
  console.log('❌ ALGUMAS VERIFICAÇÕES FALHARAM!');
  console.log('⚠️  Corrija os problemas acima antes de fazer o build de produção.');
  process.exit(1);
}

console.log('='.repeat(50));

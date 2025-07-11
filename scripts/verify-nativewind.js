#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuração do NativeWind...\n');

const checks = [
  {
    name: 'Arquivo global.css existe',
    test: () => fs.existsSync(path.join(__dirname, '..', 'global.css')),
    required: true,
  },
  {
    name: 'Metro config contém withNativeWind',
    test: () => {
      const metroConfig = fs.readFileSync(path.join(__dirname, '..', 'metro.config.js'), 'utf8');
      return metroConfig.includes('withNativeWind');
    },
    required: true,
  },
  {
    name: 'Babel config contém nativewind/babel',
    test: () => {
      const babelConfig = fs.readFileSync(path.join(__dirname, '..', 'babel.config.js'), 'utf8');
      return babelConfig.includes('nativewind/babel');
    },
    required: true,
  },
  {
    name: 'Package.json contém dependência do NativeWind',
    test: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
      return pkg.dependencies && pkg.dependencies.nativewind;
    },
    required: true,
  },
  {
    name: 'Tailwind config contém preset do NativeWind',
    test: () => {
      const tailwindConfig = fs.readFileSync(
        path.join(__dirname, '..', 'tailwind.config.js'),
        'utf8'
      );
      return tailwindConfig.includes('nativewind/preset');
    },
    required: true,
  },
];

let allPassed = true;
let criticalFailed = false;

checks.forEach((check) => {
  try {
    const passed = check.test();
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check.name}`);

    if (!passed) {
      allPassed = false;
      if (check.required) {
        criticalFailed = true;
      }
    }
  } catch (error) {
    console.log(`❌ ${check.name} - Erro: ${error.message}`);
    allPassed = false;
    if (check.required) {
      criticalFailed = true;
    }
  }
});

// Verificar tamanho do arquivo CSS nativo
try {
  const cssNativePath = path.join(__dirname, '..', 'app', 'styles', 'global.css.native.css');
  if (fs.existsSync(cssNativePath)) {
    const stats = fs.statSync(cssNativePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`\n📊 Tamanho do CSS nativo: ${sizeKB} KB`);

    if (stats.size > 1000) {
      console.log('✅ Arquivo CSS nativo tem conteúdo suficiente');
    } else {
      console.log('⚠️  Arquivo CSS nativo pode estar incompleto');
      allPassed = false;
    }
  }
} catch (error) {
  console.log(`⚠️  Não foi possível verificar o arquivo CSS nativo: ${error.message}`);
}

// Verificar versões
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  console.log(`\n📦 Versões importantes:`);
  console.log(`   - NativeWind: ${pkg.dependencies.nativewind || 'não encontrado'}`);
  console.log(`   - TailwindCSS: ${pkg.devDependencies.tailwindcss || 'não encontrado'}`);
  console.log(`   - React Native: ${pkg.dependencies['react-native'] || 'não encontrado'}`);
} catch (error) {
  console.log(`⚠️  Não foi possível verificar versões: ${error.message}`);
}

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('🎉 Todas as verificações passaram!');
  console.log('📱 O NativeWind deve funcionar corretamente em builds de produção.');
  process.exit(0);
} else if (criticalFailed) {
  console.log('💥 Verificações críticas falharam!');
  console.log('🚨 O build de produção pode não funcionar corretamente.');
  console.log('🔧 Execute as correções necessárias antes de fazer o build.');
  process.exit(1);
} else {
  console.log('⚠️  Algumas verificações falharam, mas não são críticas.');
  console.log('📱 O build pode funcionar, mas verifique se há problemas.');
  process.exit(0);
}

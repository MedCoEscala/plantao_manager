#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Verificando configuração do NativeWind...');

const checks = [
  {
    name: 'Arquivo global.css existe',
    test: () => fs.existsSync(path.join(__dirname, '..', 'app', 'styles', 'global.css')),
  },
  {
    name: 'Arquivo global.css.native.css foi gerado',
    test: () => fs.existsSync(path.join(__dirname, '..', 'app', 'styles', 'global.css.native.css')),
  },
  {
    name: 'Metro config contém NativeWind',
    test: () => {
      const metroConfig = fs.readFileSync(path.join(__dirname, '..', 'metro.config.js'), 'utf8');
      return metroConfig.includes('withNativeWind');
    },
  },
  {
    name: 'Babel config contém NativeWind',
    test: () => {
      const babelConfig = fs.readFileSync(path.join(__dirname, '..', 'babel.config.js'), 'utf8');
      return babelConfig.includes('nativewind/babel');
    },
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
  },
  {
    name: 'Package.json contém dependência do NativeWind',
    test: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
      return pkg.dependencies && pkg.dependencies.nativewind;
    },
  },
];

let allPassed = true;

checks.forEach((check) => {
  try {
    const passed = check.test();
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    if (!passed) allPassed = false;
  } catch (error) {
    console.log(`❌ ${check.name} - Erro: ${error.message}`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\n🎉 Todas as verificações do NativeWind passaram!');
  console.log('📱 O NativeWind deve funcionar corretamente em builds de produção.');
} else {
  console.log('\n⚠️  Algumas verificações falharam. Verifique a configuração.');
}

// Verificar tamanho do arquivo CSS nativo
try {
  const cssNativePath = path.join(__dirname, '..', 'app', 'styles', 'global.css.native.css');
  if (fs.existsSync(cssNativePath)) {
    const stats = fs.statSync(cssNativePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`\n📊 Tamanho do CSS nativo: ${sizeKB} KB`);

    if (stats.size > 0) {
      console.log('✅ Arquivo CSS nativo tem conteúdo');
    } else {
      console.log('⚠️  Arquivo CSS nativo está vazio');
    }
  }
} catch (error) {
  console.log(`⚠️  Não foi possível verificar o arquivo CSS nativo: ${error.message}`);
}

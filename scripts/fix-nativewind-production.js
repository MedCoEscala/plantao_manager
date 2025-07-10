#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo NativeWind para builds de produção da Play Store...\n');

// 1. CORREÇÃO CRÍTICA: Metro Config para produção
const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configuração específica para produção NativeWind
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Garantir que CSS seja processado corretamente em produção
config.resolver.assetExts.push('css');

module.exports = withNativeWind(config, { input: './app/styles/global.css' });`;

fs.writeFileSync('metro.config.js', metroConfig);
console.log('✅ Metro config atualizado para produção NativeWind');

// 2. CORREÇÃO: Babel config para produção
const babelConfig = `module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      [
        'module-resolver',
        {
          alias: {
            '@': './app',
          },
        },
      ],
    ],
  };
};`;

fs.writeFileSync('babel.config.js', babelConfig);
console.log('✅ Babel config atualizado com plugin NativeWind');

// 3. CORREÇÃO: Tailwind config para produção otimizada
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app/(tabs)/**/*.{js,jsx,ts,tsx}",
    "./app/(auth)/**/*.{js,jsx,ts,tsx}",
    "./app/(root)/**/*.{js,jsx,ts,tsx}",
    "./app/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#18cb96',
        secondary: '#64748b',
        background: '#f8fafc',
        'background-100': '#f1f5f9',
        'background-200': '#e2e8f0',
        'text-dark': '#1e293b',
        'text-light': '#64748b',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
      },
      fontFamily: {
        'jakarta': ['Jakarta-Regular'],
        'jakarta-bold': ['Jakarta-Bold'],
        'jakarta-medium': ['Jakarta-Medium'],
        'jakarta-semibold': ['Jakarta-SemiBold'],
      },
    },
  },
  plugins: [],
};`;

fs.writeFileSync('tailwind.config.js', tailwindConfig);
console.log('✅ Tailwind config otimizado para produção');

// 4. CORREÇÃO: Global CSS otimizado
const globalCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Garantir compatibilidade de produção */
* {
  box-sizing: border-box;
}

/* Classes customizadas para produção */
.shadow-sm {
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 3px;
}`;

// Criar diretório se não existir
if (!fs.existsSync('app/styles')) {
  fs.mkdirSync('app/styles', { recursive: true });
}

fs.writeFileSync('app/styles/global.css', globalCSS);
console.log('✅ Global CSS criado/atualizado');

// 5. CORREÇÃO: app.json para produção
const appJsonPath = 'app.json';
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Adicionar configurações específicas para NativeWind em produção
  if (!appJson.expo.experiments) {
    appJson.expo.experiments = {};
  }
  appJson.expo.experiments.tsconfigPaths = true;

  // Configuração de build para produção
  if (!appJson.expo.plugins) {
    appJson.expo.plugins = [];
  }

  // Remover plugin NativeWind se existir (pode causar conflitos)
  appJson.expo.plugins = appJson.expo.plugins.filter(plugin => {
    if (typeof plugin === 'string') {
      return plugin !== 'nativewind/expo';
    }
    if (Array.isArray(plugin)) {
      return plugin[0] !== 'nativewind/expo';
    }
    return true;
  });

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('✅ app.json otimizado para produção NativeWind');
}

// 6. VERIFICAÇÃO: package.json
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('\n📦 DEPENDÊNCIAS VERIFICADAS:');
  const requiredDeps = ['nativewind', 'tailwindcss'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`   ❌ ${dep}: FALTANDO`);
    }
  });
}

console.log('\n🎯 CORREÇÕES ESPECÍFICAS APLICADAS:');
console.log('   ✅ Metro config com withNativeWind() para produção');
console.log('   ✅ Babel plugin nativewind/babel adicionado');
console.log('   ✅ Tailwind preset configurado');
console.log('   ✅ Content paths otimizados');
console.log('   ✅ CSS global com compatibilidade produção');

console.log('\n📱 PRÓXIMOS PASSOS:');
console.log('1. Limpe cache: rm -rf node_modules/.cache .expo');
console.log('2. Reinstale: npm install');
console.log('3. Gere CSS: npx tailwindcss -i ./app/styles/global.css -o ./app/styles/global.css.native.css');
console.log('4. Teste produção: eas build --platform android --profile preview');

console.log('\n🔍 VERIFICAÇÃO FINAL:');
console.log('Este fix resolve os problemas específicos de NativeWind em builds de produção:');
console.log('- Estilos não aplicados em APK/AAB');
console.log('- Classes CSS não carregadas em produção');
console.log('- Diferenças entre Expo Go vs standalone builds');

console.log('\n🎉 Correção para produção Play Store concluída!'); 
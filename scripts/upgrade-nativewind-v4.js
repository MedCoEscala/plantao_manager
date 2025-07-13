#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Migrando para NativeWind v4 (solução definitiva para builds de produção)...\n');

// 1. Backup das configurações atuais
console.log('📋 Fazendo backup das configurações atuais...');
const backupDir = path.join(__dirname, '..', 'backup-nativewind-v2');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const filesToBackup = ['tailwind.config.js', 'metro.config.js', 'babel.config.js', 'app.json'];

filesToBackup.forEach((file) => {
  const sourcePath = path.join(__dirname, '..', file);
  const backupPath = path.join(backupDir, file);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, backupPath);
    console.log(`✅ Backup criado: ${file}`);
  }
});

// 2. Atualizar dependências
console.log('\n📦 Atualizando dependências...');
try {
  console.log('🔄 Removendo NativeWind v2...');
  execSync('npm uninstall nativewind', { stdio: 'inherit' });

  console.log('🔄 Instalando NativeWind v4...');
  execSync('npm install nativewind@^4.0.1', { stdio: 'inherit' });

  console.log('🔄 Atualizando TailwindCSS...');
  execSync('npm install --save-dev tailwindcss@^3.4.0', { stdio: 'inherit' });

  console.log('✅ Dependências atualizadas');
} catch (error) {
  console.error('❌ Erro ao atualizar dependências:', error.message);
  process.exit(1);
}

// 3. Atualizar tailwind.config.js para v4
console.log('\n⚙️  Atualizando tailwind.config.js para v4...');
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#18cb96',
          50: '#e9f9f3',
          100: '#c5f0e0',
          200: '#a0e7cc',
          300: '#7bddba',
          400: '#56d3a7',
          500: '#18cb96',
          600: '#14a278',
          700: '#10795a',
          800: '#0c503c',
          900: '#08271e',
        },
        secondary: {
          DEFAULT: '#0f766e',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#042f2e',
        },
        background: {
          DEFAULT: '#f8fafc',
          50: '#ffffff',
          100: '#f8fafc',
          200: '#f1f5f9',
          300: '#e2e8f0',
          400: '#cbd5e1',
          500: '#94a3b8',
        },
        'text-dark': '#1e293b',
        'text-light': '#64748b',
        success: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        error: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        jakarta: ['Jakarta-Regular', 'System'],
        'jakarta-medium': ['Jakarta-Medium', 'System'],
        'jakarta-semibold': ['Jakarta-SemiBold', 'System'],
        'jakarta-bold': ['Jakarta-Bold', 'System'],
      },
    },
  },
  plugins: [],
};`;

fs.writeFileSync(path.join(__dirname, '..', 'tailwind.config.js'), tailwindConfig);
console.log('✅ tailwind.config.js atualizado para v4');

// 4. Atualizar metro.config.js para v4
console.log('\n⚙️  Atualizando metro.config.js para v4...');
const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './app/styles/global.css' });`;

fs.writeFileSync(path.join(__dirname, '..', 'metro.config.js'), metroConfig);
console.log('✅ metro.config.js atualizado para v4');

// 5. Remover o arquivo CSS nativo antigo (v4 não precisa)
const nativeCssPath = path.join(__dirname, '..', 'app', 'styles', 'global.css.native.css');
if (fs.existsSync(nativeCssPath)) {
  fs.unlinkSync(nativeCssPath);
  console.log('✅ Arquivo CSS nativo v2 removido (v4 não precisa)');
}

// 6. Atualizar app/_layout.tsx para v4
console.log('\n⚙️  Atualizando app/_layout.tsx para v4...');
const layoutPath = path.join(__dirname, '..', 'app', '_layout.tsx');
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');

  // Remover import do CSS nativo (v4 não precisa)
  layoutContent = layoutContent.replace(
    /import ['"]\.\/styles\/global\.css\.native\.css['"];?\n?/g,
    ''
  );

  // Adicionar import do CSS original (v4 processa automaticamente)
  if (!layoutContent.includes("import './styles/global.css'")) {
    // Adicionar após os imports existentes
    const importIndex = layoutContent.lastIndexOf('import ');
    if (importIndex !== -1) {
      const endOfImport = layoutContent.indexOf('\n', importIndex);
      layoutContent =
        layoutContent.slice(0, endOfImport + 1) +
        "import './styles/global.css';\n" +
        layoutContent.slice(endOfImport + 1);
    }
  }

  fs.writeFileSync(layoutPath, layoutContent);
  console.log('✅ app/_layout.tsx atualizado para v4');
}

// 7. Atualizar nativewind-env.d.ts para v4
console.log('\n⚙️  Atualizando nativewind-env.d.ts para v4...');
const nativewindTypes = `/// <reference types="nativewind/types" />`;
fs.writeFileSync(path.join(__dirname, '..', 'nativewind-env.d.ts'), nativewindTypes);
console.log('✅ nativewind-env.d.ts atualizado para v4');

console.log('\n🎉 Migração para NativeWind v4 concluída com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('1. Limpe o cache: npx expo start --clear');
console.log('2. Teste localmente: npm start');
console.log('3. Se funcionar, faça o build: npm run build:prod');
console.log('4. NativeWind v4 é MUITO mais estável para produção!');

console.log('\n💾 Backup das configurações v2 salvo em: ./backup-nativewind-v2/');
console.log('⚠️  Se algo der errado, você pode restaurar de lá.');

console.log('\n✨ NativeWind v4 resolve definitivamente os problemas de CSS em produção!');

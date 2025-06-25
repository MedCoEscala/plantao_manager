#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building backend for Vercel...');

const backendPath = path.join(__dirname, 'backend');
const rootPath = __dirname;

try {
  // Mudar para o diretório do backend
  process.chdir(backendPath);

  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('🏗️ Building NestJS...');
  execSync('npm run build', { stdio: 'inherit' });

  // Verificar se o build foi criado
  const distPath = path.join(backendPath, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build failed - dist directory not found');
  }

  // Copiar arquivos necessários para a raiz para o Vercel encontrar
  console.log('📋 Copying backend files to root...');
  const rootBackendPath = path.join(rootPath, 'backend');

  // Garantir que a pasta backend existe na raiz
  if (!fs.existsSync(rootBackendPath)) {
    fs.mkdirSync(rootBackendPath, { recursive: true });
  }

  const rootDistPath = path.join(rootBackendPath, 'dist');
  if (!fs.existsSync(rootDistPath)) {
    fs.mkdirSync(rootDistPath, { recursive: true });
  }

  // Copiar recursivamente o diretório dist
  execSync(`cp -r ${distPath}/* ${rootDistPath}/`, { stdio: 'inherit' });

  console.log('✅ Backend build completed successfully!');
  console.log('📂 Files copied to:', rootBackendPath);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

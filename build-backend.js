#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building backend for Vercel...');

const backendPath = path.join(__dirname, 'backend');

try {
  // Verificar se o diretório backend existe
  if (!fs.existsSync(backendPath)) {
    console.log('❌ Backend directory not found');
    process.exit(1);
  }

  // Mudar para o diretório do backend
  process.chdir(backendPath);
  console.log('📂 Changed to backend directory');

  // Instalar dependências (com cache do npm)
  console.log('📦 Installing dependencies...');
  execSync('npm ci --only=production', { stdio: 'inherit' });

  // Instalar dependências de desenvolvimento necessárias para o build
  console.log('🔧 Installing dev dependencies...');
  execSync('npm install --only=dev', { stdio: 'inherit' });

  // Gerar Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Build do NestJS
  console.log('🏗️ Building NestJS...');
  execSync('npm run build', { stdio: 'inherit' });

  // Verificar se o build foi criado
  const distPath = path.join(backendPath, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build failed - dist directory not found');
  }

  const mainJsPath = path.join(distPath, 'main.js');
  if (!fs.existsSync(mainJsPath)) {
    throw new Error('Build failed - main.js not found');
  }

  console.log('✅ Backend build completed successfully!');
  console.log('📂 Build files available at:', distPath);
  console.log('📄 Main file:', mainJsPath);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

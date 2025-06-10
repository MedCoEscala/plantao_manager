#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Building backend for Vercel...');

const backendPath = path.join(__dirname, 'backend');

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

  console.log('✅ Backend build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

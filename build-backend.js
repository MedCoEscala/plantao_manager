#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building backend for Vercel...');

const backendPath = path.join(__dirname, 'backend');
const distPath = path.join(backendPath, 'dist');

try {
  // Mudar para o diretório do backend
  process.chdir(backendPath);
  
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🏗️ Building NestJS application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Verificar se o build foi criado
  if (fs.existsSync(distPath) && fs.readdirSync(distPath).length > 0) {
    console.log('✅ Build completed successfully!');
    console.log('📁 Build files:', fs.readdirSync(distPath));
  } else {
    throw new Error('Build directory is empty or missing');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Backend build process completed!');

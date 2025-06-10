// Vercel serverless function handler para NestJS - DEBUG VERSION
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔄 Handler iniciado - versão debug');

// Handler para Vercel
module.exports = async (req, res) => {
  console.log(
    `📥 ${req.method} ${req.url} - User-Agent: ${req.headers['user-agent']?.substring(0, 50)}`
  );

  // Health check simples - sem inicializar NestJS
  if (req.url === '/health' || req.url === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      message: 'Backend handler is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
    });
  }

  try {
    console.log('🔍 Starting debug checks...');

    // Verificar diretórios
    console.log('📂 Current working directory:', process.cwd());
    console.log('📁 __dirname:', __dirname);

    const backendPath = path.join(__dirname, '../backend');
    const distPath = path.join(backendPath, 'dist');

    console.log('🔍 Backend path:', backendPath);
    console.log('🔍 Dist path:', distPath);

    // Verificar se backend existe
    if (!fs.existsSync(backendPath)) {
      throw new Error(`Backend directory not found at ${backendPath}`);
    }

    console.log('✅ Backend directory exists');

    // Verificar se dist existe
    if (!fs.existsSync(distPath)) {
      throw new Error(`Dist directory not found at ${distPath}`);
    }

    console.log('✅ Dist directory exists');

    // Listar conteúdo do dist
    const distContents = fs.readdirSync(distPath);
    console.log('📋 Dist contents:', distContents);

    // Verificar app.module.js
    const appModulePath = path.join(distPath, 'app.module.js');
    if (!fs.existsSync(appModulePath)) {
      throw new Error(`app.module.js not found at ${appModulePath}`);
    }

    console.log('✅ app.module.js exists');

    // Verificar node_modules do backend
    const backendNodeModules = path.join(backendPath, 'node_modules');
    if (!fs.existsSync(backendNodeModules)) {
      throw new Error(`Backend node_modules not found at ${backendNodeModules}`);
    }

    console.log('✅ Backend node_modules exists');

    // Verificar @nestjs/core
    const nestCoreRoot = path.join(process.cwd(), 'node_modules/@nestjs/core');
    const nestCoreBackend = path.join(backendNodeModules, '@nestjs/core');

    console.log('🔍 Looking for @nestjs/core in:', nestCoreRoot);
    console.log('🔍 Root nestjs/core exists:', fs.existsSync(nestCoreRoot));

    console.log('🔍 Looking for @nestjs/core in:', nestCoreBackend);
    console.log('🔍 Backend nestjs/core exists:', fs.existsSync(nestCoreBackend));

    // Tentar importar app.module
    console.log('📦 Attempting to import app.module...');
    let AppModule;
    try {
      const moduleExports = require('../backend/dist/app.module');
      AppModule = moduleExports.AppModule || moduleExports.default || moduleExports;
      console.log('✅ App module imported successfully, type:', typeof AppModule);
      console.log('📋 Module exports keys:', Object.keys(moduleExports));
    } catch (importError) {
      console.error('❌ Failed to import app.module:', importError.message);
      throw new Error(`App module import failed: ${importError.message}`);
    }

    // Tentar importar NestJS
    console.log('📦 Attempting to import @nestjs/core...');
    let NestFactory;
    try {
      console.log('🔍 Trying root import...');
      ({ NestFactory } = require('@nestjs/core'));
      console.log('✅ NestJS imported from root');
    } catch (rootError) {
      console.log('⚠️ Root import failed:', rootError.message);
      try {
        console.log('🔍 Trying backend import...');
        ({ NestFactory } = require('../backend/node_modules/@nestjs/core'));
        console.log('✅ NestJS imported from backend');
      } catch (backendError) {
        console.error('❌ Both imports failed');
        console.error('❌ Root error:', rootError.message);
        console.error('❌ Backend error:', backendError.message);
        throw new Error(
          `Cannot import NestJS: Root: ${rootError.message}, Backend: ${backendError.message}`
        );
      }
    }

    // Se chegou até aqui, os imports funcionaram
    console.log('🏗️ All imports successful, creating NestJS app...');

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    console.log('✅ NestJS app created successfully');

    app.enableCors({
      origin: true,
      credentials: true,
    });

    await app.init();
    console.log('✅ NestJS app initialized');

    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    console.log('🚀 Forwarding request to NestJS');
    return instance(req, res);
  } catch (error) {
    console.error('❌ Debug error:', error);
    console.error('❌ Error stack:', error.stack);

    res.status(500).json({
      error: 'Backend debug failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    });
  }
};

// Vercel serverless function handler para NestJS
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Garantir que o build foi feito
function ensureBuild() {
  const backendPath = path.join(__dirname, '..', 'backend');
  const distPath = path.join(backendPath, 'dist');

  try {
    if (!fs.existsSync(distPath) || fs.readdirSync(distPath).length === 0) {
      console.log('🔨 Building NestJS application...');
      process.chdir(backendPath);
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build completed');
    }
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    throw error;
  }
}

// Garantir build
ensureBuild();

let app;

async function createNestApp() {
  if (app) return app;

  try {
    console.log('🔄 Initializing NestJS backend...');

    // Tentar diferentes formas de importar o módulo
    let AppModule;
    try {
      const moduleExports = require('../backend/dist/app.module');
      AppModule = moduleExports.AppModule || moduleExports.default || moduleExports;
      console.log('✅ AppModule loaded successfully');
    } catch (importError) {
      console.error('❌ Failed to import AppModule:', importError.message);
      throw new Error(`Module import failed: ${importError.message}`);
    }

    const { NestFactory } = require('@nestjs/core');
    const { ValidationPipe } = require('@nestjs/common');

    console.log('🏗️ Creating NestJS application...');
    app = await NestFactory.create(AppModule, {
      logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn', 'log'],
    });

    // CORS simplificado
    app.enableCors({
      origin: true,
      credentials: true,
    });

    // Validation pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      })
    );

    await app.init();
    console.log('✅ NestJS backend ready for requests');
    return app;
  } catch (error) {
    console.error('❌ Critical error initializing backend:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Handler para Vercel
module.exports = async (req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);

  // Health check simples
  if (req.url === '/health' || req.url === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      message: 'Backend is running',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const nestApp = await createNestApp();
    const httpAdapter = nestApp.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    return instance(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);

    // Resposta de erro mais informativa
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      error: 'Backend initialization failed',
      message: isDev ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      ...(isDev && { stack: error.stack }),
    });
  }
};

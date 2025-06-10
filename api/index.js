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

const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

let app;

async function createNestApp() {
  if (app) return app;

  try {
    // Importar o módulo compilado
    const { AppModule } = require('../backend/dist/app.module');

    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // CORS para permitir acesso do app mobile
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    });

    // Validation pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();
    console.log('✅ NestJS backend ready');
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize backend:', error);
    throw error;
  }
}

// Handler para Vercel
module.exports = async (req, res) => {
  try {
    const nestApp = await createNestApp();
    const httpAdapter = nestApp.getHttpAdapter();
    return httpAdapter.getInstance()(req, res);
  } catch (error) {
    console.error('❌ Request error:', error);
    res.status(500).json({
      error: 'Backend initialization failed',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
};

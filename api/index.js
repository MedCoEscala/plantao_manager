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

const { NestFactory } = require('../backend/dist/app.module');
const { ValidationPipe } = require('@nestjs/common');

let app;

async function createApp() {
  if (app) return app;

  try {
    const AppModule = require('../backend/dist/app.module');
    const moduleToUse = AppModule.AppModule || AppModule;

    app = await NestFactory.create(moduleToUse, {
      logger: ['error', 'warn', 'log'],
    });

    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Accept, Authorization',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();
    return app;
  } catch (error) {
    console.error('❌ Failed to create app:', error);
    throw error;
  }
}

// Handler principal
module.exports = async (req, res) => {
  try {
    const nestApp = await createApp();
    const httpAdapter = nestApp.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    return instance(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
    });
  }
};

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
let initPromise;

async function createNestApp() {
  // Se já tem uma inicialização em progresso, aguarda ela
  if (initPromise) {
    return await initPromise;
  }

  if (app) return app;

  // Criar promise de inicialização com timeout
  initPromise = new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('NestJS initialization timeout (30s)'));
    }, 30000);

    try {
      console.log('🔄 Initializing NestJS backend...');

      // Verificar se o dist existe
      const path = require('path');
      const fs = require('fs');
      const distPath = path.join(__dirname, '../backend/dist');

      if (!fs.existsSync(distPath)) {
        throw new Error('Backend dist directory not found. Build may have failed.');
      }

      // Importar módulos necessários
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
        logger:
          process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn', 'log'],
      });

      // CORS otimizado
      app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      });

      // Validation pipes simplificados
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        })
      );

      await app.init();
      clearTimeout(timeout);
      console.log('✅ NestJS backend ready for requests');
      resolve(app);
    } catch (error) {
      clearTimeout(timeout);
      console.error('❌ Critical error initializing backend:', error);
      console.error('Stack:', error.stack);
      reject(error);
    }
  });

  return await initPromise;
}

// Handler para Vercel
module.exports = async (req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);

  // Health check simples - sem inicializar NestJS
  if (req.url === '/health' || req.url === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      message: 'Backend handler is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  }

  try {
    const nestApp = await createNestApp();
    const httpAdapter = nestApp.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    return instance(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);

    // Resposta de erro detalhada para debug
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      error: 'Backend initialization failed',
      message: isDev ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      ...(isDev && {
        stack: error.stack,
        env: process.env.NODE_ENV,
      }),
    });
  }
};

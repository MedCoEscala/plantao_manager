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
    console.log('⏳ Waiting for existing initialization...');
    return await initPromise;
  }

  if (app) {
    console.log('♻️ Reusing existing NestJS app');
    return app;
  }

  // Criar promise de inicialização com timeout
  initPromise = new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('NestJS initialization timeout (30s)'));
    }, 30000);

    try {
      console.log('🔄 Initializing NestJS backend...');
      console.log('📂 Current working directory:', process.cwd());
      console.log('📁 __dirname:', __dirname);

      // Verificar se o dist existe
      const path = require('path');
      const fs = require('fs');
      const distPath = path.join(__dirname, '../backend/dist');

      console.log('🔍 Checking dist path:', distPath);
      if (!fs.existsSync(distPath)) {
        const availablePaths = fs.readdirSync(path.join(__dirname, '../'));
        console.log('📋 Available paths in root:', availablePaths);
        throw new Error(`Backend dist directory not found at ${distPath}`);
      }

      const distContents = fs.readdirSync(distPath);
      console.log('📋 Dist contents:', distContents);

      // Importar módulos necessários
      let AppModule;
      try {
        console.log('📦 Importing AppModule...');
        const moduleExports = require('../backend/dist/app.module');
        AppModule = moduleExports.AppModule || moduleExports.default || moduleExports;

        if (!AppModule) {
          console.error('❌ AppModule not found in exports:', Object.keys(moduleExports));
          throw new Error('AppModule not found in module exports');
        }
        console.log('✅ AppModule loaded successfully:', typeof AppModule);
      } catch (importError) {
        console.error('❌ Failed to import AppModule:', importError.message);
        console.error('❌ Import error stack:', importError.stack);
        throw new Error(`Module import failed: ${importError.message}`);
      }

      console.log('📦 Importing NestJS dependencies...');

      // Tentar importar das diferentes localizações possíveis
      let NestFactory, ValidationPipe;

      try {
        console.log('🔍 Trying to import from root node_modules...');
        ({ NestFactory } = require('@nestjs/core'));
        ({ ValidationPipe } = require('@nestjs/common'));
        console.log('✅ Found NestJS in root node_modules');
      } catch (rootError) {
        console.log('⚠️ Root import failed, trying backend node_modules...');
        try {
          ({ NestFactory } = require('../backend/node_modules/@nestjs/core'));
          ({ ValidationPipe } = require('../backend/node_modules/@nestjs/common'));
          console.log('✅ Found NestJS in backend node_modules');
        } catch (backendError) {
          console.error('❌ Failed to import from root:', rootError.message);
          console.error('❌ Failed to import from backend:', backendError.message);
          throw new Error(
            `Cannot find NestJS dependencies. Root error: ${rootError.message}, Backend error: ${backendError.message}`
          );
        }
      }

      console.log('🏗️ Creating NestJS application...');
      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
        abortOnError: false,
      });

      console.log('🌐 Configuring CORS...');
      // CORS otimizado
      app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      });

      console.log('🔧 Setting up validation pipes...');
      // Validation pipes simplificados
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        })
      );

      console.log('🚀 Initializing application...');
      await app.init();
      clearTimeout(timeout);
      console.log('✅ NestJS backend ready for requests');
      resolve(app);
    } catch (error) {
      clearTimeout(timeout);
      console.error('❌ Critical error initializing backend:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);

      // Reset state on error
      app = null;
      initPromise = null;

      reject(error);
    }
  });

  return await initPromise;
}

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
    console.log('🔄 Attempting to get NestJS app...');
    const nestApp = await createNestApp();
    console.log('✅ NestJS app obtained, getting HTTP adapter...');

    const httpAdapter = nestApp.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    console.log(`🚀 Forwarding ${req.method} ${req.url} to NestJS`);
    return instance(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);

    // Resetar estado em caso de erro crítico
    if (error.message.includes('timeout') || error.message.includes('initialization')) {
      console.log('🔄 Resetting app state due to critical error...');
      app = null;
      initPromise = null;
    }

    // Resposta de erro detalhada para debug
    res.status(503).json({
      error: 'Backend initialization failed',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      type: error.name || 'UnknownError',
      url: req.url,
      method: req.method,
    });
  }
};

// Vercel serverless function handler para NestJS
const path = require('path');
const fs = require('fs');

console.log('🔄 NestJS Handler carregado');

let app;
let appPromise;

async function createNestApp() {
  if (appPromise) {
    console.log('⏳ Aguardando inicialização em progresso...');
    return await appPromise;
  }

  if (app) {
    console.log('♻️ Reutilizando app NestJS existente');
    return app;
  }

  appPromise = (async () => {
    try {
      console.log('🏗️ Inicializando NestJS...');

      // Verificar se dist existe
      const distPath = path.join(__dirname, '../backend/dist');
      if (!fs.existsSync(distPath)) {
        throw new Error(`Dist não encontrado em: ${distPath}`);
      }

      console.log('✅ Diretório dist encontrado');

      // Importar AppModule
      const moduleExports = require('../backend/dist/app.module');
      const AppModule = moduleExports.AppModule || moduleExports.default || moduleExports;

      if (!AppModule) {
        throw new Error('AppModule não encontrado nos exports');
      }

      console.log('✅ AppModule importado');

      // Importar NestJS (tentar backend primeiro)
      let NestFactory, ValidationPipe;

      try {
        const nestCore = require('../backend/node_modules/@nestjs/core');
        const nestCommon = require('../backend/node_modules/@nestjs/common');
        NestFactory = nestCore.NestFactory;
        ValidationPipe = nestCommon.ValidationPipe;
        console.log('✅ NestJS importado do backend');
      } catch (backendError) {
        try {
          const nestCore = require('@nestjs/core');
          const nestCommon = require('@nestjs/common');
          NestFactory = nestCore.NestFactory;
          ValidationPipe = nestCommon.ValidationPipe;
          console.log('✅ NestJS importado da raiz');
        } catch (rootError) {
          throw new Error(
            `Falha ao importar NestJS: Backend: ${backendError.message}, Root: ${rootError.message}`
          );
        }
      }

      // Criar app NestJS
      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn'],
      });

      // Configurar CORS
      app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      });

      // Configurar validation
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        })
      );

      await app.init();
      console.log('✅ NestJS inicializado com sucesso');

      return app;
    } catch (error) {
      console.error('❌ Erro ao inicializar NestJS:', error.message);
      app = null;
      appPromise = null;
      throw error;
    }
  })();

  return await appPromise;
}

// Handler principal
module.exports = async (req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);

  // Health check simples
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

    console.log(`🚀 Encaminhando para NestJS: ${req.method} ${req.url}`);
    return instance(req, res);
  } catch (error) {
    console.error('❌ Erro no handler:', error.message);

    res.status(503).json({
      error: 'Backend initialization failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

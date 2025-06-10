// Vercel serverless function handler para NestJS
const path = require('path');
const fs = require('fs');

console.log('🔄 NestJS Handler carregado');

let app;
let appPromise;

async function debugNestJS() {
  const results = [];

  try {
    // 1. Verificar diretórios
    results.push('1. Verificando diretórios...');
    const distPath = path.join(__dirname, '../backend/dist');
    const backendPath = path.join(__dirname, '../backend');

    results.push(`   - __dirname: ${__dirname}`);
    results.push(`   - Backend path: ${backendPath}`);
    results.push(`   - Dist path: ${distPath}`);
    results.push(`   - Backend exists: ${fs.existsSync(backendPath)}`);
    results.push(`   - Dist exists: ${fs.existsSync(distPath)}`);

    if (fs.existsSync(distPath)) {
      const distContents = fs.readdirSync(distPath);
      results.push(`   - Dist contents: ${distContents.join(', ')}`);
    }

    // 2. Tentar importar app.module
    results.push('2. Importando app.module...');
    let AppModule;
    try {
      const moduleExports = require('../backend/dist/app.module');
      AppModule = moduleExports.AppModule || moduleExports.default || moduleExports;
      results.push(`   ✅ AppModule importado: ${typeof AppModule}`);
      results.push(`   - Export keys: ${Object.keys(moduleExports).join(', ')}`);
    } catch (error) {
      results.push(`   ❌ Erro ao importar app.module: ${error.message}`);
      return results;
    }

    // 3. Tentar importar @nestjs/core do backend
    results.push('3. Importando @nestjs/core do backend...');
    try {
      const nestCore = require('../backend/node_modules/@nestjs/core');
      results.push(`   ✅ @nestjs/core do backend: ${typeof nestCore.NestFactory}`);
    } catch (error) {
      results.push(`   ❌ Erro @nestjs/core backend: ${error.message}`);
    }

    // 4. Tentar importar @nestjs/core da raiz
    results.push('4. Importando @nestjs/core da raiz...');
    try {
      const nestCore = require('@nestjs/core');
      results.push(`   ✅ @nestjs/core da raiz: ${typeof nestCore.NestFactory}`);
    } catch (error) {
      results.push(`   ❌ Erro @nestjs/core raiz: ${error.message}`);
    }

    // 5. Tentar criar app NestJS
    results.push('5. Tentando criar app NestJS...');
    try {
      let NestFactory;
      try {
        const nestCore = require('../backend/node_modules/@nestjs/core');
        NestFactory = nestCore.NestFactory;
        results.push('   - Usando NestFactory do backend');
      } catch (backendError) {
        const nestCore = require('@nestjs/core');
        NestFactory = nestCore.NestFactory;
        results.push('   - Usando NestFactory da raiz');
      }

      const nestApp = await NestFactory.create(AppModule, {
        logger: false, // Desabilitar logs para debug
      });
      results.push('   ✅ App NestJS criado com sucesso');

      await nestApp.init();
      results.push('   ✅ App NestJS inicializado');

      await nestApp.close();
      results.push('   ✅ App NestJS fechado');
    } catch (error) {
      results.push(`   ❌ Erro ao criar app: ${error.message}`);
      results.push(`   ❌ Stack: ${error.stack}`);
    }
  } catch (error) {
    results.push(`❌ Erro geral no debug: ${error.message}`);
    results.push(`❌ Stack: ${error.stack}`);
  }

  return results;
}

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

  // Debug endpoint
  if (req.url === '/debug' || req.url === '/api/debug') {
    try {
      const debugResults = await debugNestJS();
      return res.status(200).json({
        status: 'debug',
        results: debugResults,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        status: 'debug_error',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
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

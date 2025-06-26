const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function ensureBuild() {
  const backendPath = path.join(__dirname, '..');
  const distPath = path.join(backendPath, 'dist');

  try {
    if (!fs.existsSync(distPath) || fs.readdirSync(distPath).length === 0) {
      console.log('🔨 Building NestJS application...');
      process.chdir(backendPath);
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build completed successfully');
    } else {
      console.log('✅ Build already exists, skipping...');
    }
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    throw error;
  }
}

// Garantir que o build foi feito
ensureBuild();

const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

let app;

async function bootstrap() {
  if (app) return app;

  try {
    console.log('🚀 Initializing NestJS application...');

    // Importar o AppModule compilado do dist apenas quando necessário
    let AppModule;
    try {
      AppModule = require('../dist/app.module');
    } catch (error) {
      console.error('❌ Failed to import AppModule:', error.message);
      throw new Error(
        'Could not load compiled application module: ' + error.message,
      );
    }

    // Verificar se AppModule foi carregado corretamente
    const moduleToUse = AppModule.AppModule || AppModule;

    app = await NestFactory.create(moduleToUse, {
      bodyParser: true,
      logger: ['error', 'warn', 'log'],
    });

    // Configurar CORS
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Accept, Authorization',
      credentials: true,
    });

    // Configurar pipes de validação
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    console.log('✅ NestJS app initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Error initializing NestJS app:', error);
    throw error;
  }
}

// Handler para Vercel
module.exports = async (req, res) => {
  try {
    // Adicionar headers de segurança básicos
    res.setHeader('X-Powered-By', 'NestJS');

    const nestApp = await bootstrap();
    const httpAdapter = nestApp.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    return instance(req, res);
  } catch (error) {
    console.error('❌ Request handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details:
        process.env.NODE_ENV === 'production'
          ? 'Something went wrong'
          : error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

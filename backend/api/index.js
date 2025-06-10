const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Build da aplicação se necessário
function ensureBuild() {
  const backendPath = path.join(__dirname, '..');
  const distPath = path.join(backendPath, 'dist');

  try {
    // Verificar se dist existe e tem arquivos
    if (!fs.existsSync(distPath) || fs.readdirSync(distPath).length === 0) {
      console.log('🔨 Building NestJS application...');
      process.chdir(backendPath);
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build completed successfully');
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

// Importar o AppModule compilado do dist
const { AppModule } = require('../dist/app.module');

let app;

async function bootstrap() {
  if (app) return app;

  try {
    console.log('🚀 Initializing NestJS application...');

    app = await NestFactory.create(AppModule.AppModule, {
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
    const nestApp = await bootstrap();
    const httpAdapter = nestApp.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    return instance(req, res);
  } catch (error) {
    console.error('❌ Request handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

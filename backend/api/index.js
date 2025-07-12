const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const path = require('path');

let app;

async function bootstrap() {
  if (app) return app;

  try {
    console.log('🚀 Initializing NestJS application...');

    // Importar o AppModule compilado do dist
    let AppModule;
    try {
      const modulePath = path.join(__dirname, '../dist/app.module');
      AppModule = require(modulePath);
    } catch (error) {
      console.error('❌ Failed to import AppModule:', error.message);
      throw new Error(
        'Could not load compiled application module. Build may be missing.',
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
          ? 'Application failed to initialize'
          : error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

// Importar o AppModule compilado do dist
const { AppModule } = require('../dist/app.module');

let app;

async function bootstrap() {
  if (app) return app;

  try {
    app = await NestFactory.create(AppModule.AppModule, {
      bodyParser: true,
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
    console.log('✅ NestJS app initialized for Vercel');
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
    res
      .status(500)
      .json({ error: 'Internal Server Error', details: error.message });
  }
};

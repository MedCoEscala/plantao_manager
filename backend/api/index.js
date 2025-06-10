const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');

let app;

async function bootstrap() {
  if (app) return app;

  try {
    app = await NestFactory.create(AppModule.AppModule, {
      bodyParser: true,
    });

    app.setGlobalPrefix('api');

    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept, Authorization',
      credentials: true,
    });

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
    return app;
  } catch (error) {
    console.error('Bootstrap error:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const appInstance = await bootstrap();
    return appInstance.getHttpAdapter().getInstance()(req, res);
  } catch (error) {
    console.error('Request handler error:', error);
    res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
};

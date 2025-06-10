const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

// Importar o AppModule compilado
const { AppModule } = require('../dist/app.module');

let server;

async function createNestServer() {
  const app = await NestFactory.create(AppModule.AppModule, {
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
}

module.exports = async (req, res) => {
  if (!server) {
    server = await createNestServer();
  }

  return server.getHttpAdapter().getInstance()(req, res);
};

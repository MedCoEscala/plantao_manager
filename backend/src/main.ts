import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { networkInterfaces } from 'os';

import { AppModule } from './app.module';

function getNetworkIP(): string {
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    const networkList = nets[name];
    if (!networkList) continue;

    for (const net of networkList) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  return 'localhost';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
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

  const port = process.env.PORT || 3000;
  const networkIP = getNetworkIP();

  await app.listen(port, '0.0.0.0');
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`🌐 Servidor acessível em:`);
  console.log(`   - Local: http://localhost:${port}/api`);
  console.log(`   - Rede: http://${networkIP}:${port}/api`);
}
bootstrap();

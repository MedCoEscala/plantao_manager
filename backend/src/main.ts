import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { networkInterfaces } from 'os';

import { AppModule } from './app.module';

let app: any;

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

async function createApp() {
  if (app) return app;

  app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:8081',
      'https://medescalaapp.com.br',
      'https://www.medescalaapp.com.br',
      /expo-dev-client/,
    ],
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

async function bootstrap() {
  const appInstance = await createApp();
  const port = process.env.PORT || 3000;
  const networkIP = getNetworkIP();

  await appInstance.listen(port, '0.0.0.0');
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📋 Política de privacidade disponível em: /privacy`);
  console.log(`🌐 Servidor acessível em:`);
  console.log(`   - Local: http://localhost:${port}/api`);
  console.log(`   - Rede: http://${networkIP}:${port}/api`);
}

export default async (req: any, res: any) => {
  const appInstance = await createApp();
  return appInstance.getHttpAdapter().getInstance()(req, res);
};

if (require.main === module) {
  bootstrap();
}

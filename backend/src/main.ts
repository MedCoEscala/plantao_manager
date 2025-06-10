import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { networkInterfaces } from 'os';
import { AppModule } from './app.module';

// Cache da aplicação para serverless
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

  app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Só adicionar prefixo /api em desenvolvimento local
  // No Vercel, as rotas já vêm com /api
  if (process.env.NODE_ENV !== 'production') {
    app.setGlobalPrefix('api');
  }

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

// Para desenvolvimento local
async function bootstrap() {
  const appInstance = await createApp();
  const port = process.env.PORT || 3000;
  const networkIP = getNetworkIP();

  await appInstance.listen(port, '0.0.0.0');
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`🌐 Servidor acessível em:`);
  console.log(`   - Local: http://localhost:${port}/api`);
  console.log(`   - Rede: http://${networkIP}:${port}/api`);
}

// Para Vercel serverless
export default async (req: any, res: any) => {
  const appInstance = await createApp();
  return appInstance.getHttpAdapter().getInstance()(req, res);
};

// Se rodando localmente (não no Vercel)
if (require.main === module) {
  bootstrap();
}

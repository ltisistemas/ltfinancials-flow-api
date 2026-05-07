import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  configureApp(app);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  Logger.log(`HTTP server listening on port ${port}`, 'Bootstrap');
}

void bootstrap();

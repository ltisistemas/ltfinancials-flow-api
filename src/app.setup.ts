import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

function resolveCorsOrigin(origin: string | undefined): string[] | boolean {
  if (!origin || origin === '*') {
    return true;
  }

  return origin
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function configureApp(app: INestApplication): void {
  app.enableCors({
    origin: resolveCorsOrigin(process.env.CORS_ORIGIN),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('LT Financials Flow API')
    .setDescription(
      'API financeira pessoal com autenticação JWT, Prisma e processamento de texto com Gemini.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT emitido pelos endpoints de autenticação da API.',
      },
      'bearer',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsEnv = process.env.CORS_ORIGIN;
  let corsOrigin: boolean | string | (string | RegExp)[];
  if (corsEnv && corsEnv.trim().length > 0) {
    const v = corsEnv.trim();
    if (v === '*') {
      corsOrigin = true;
    } else if (v.includes(',')) {
      corsOrigin = v.split(',').map((s) => s.trim());
    } else {
      corsOrigin = v;
    }
  } else {
    corsOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Antly API')
    .setDescription('API de gestión de presupuestos personales')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();

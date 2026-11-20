import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TraceIdMiddleware } from './common/middleware/trace-id.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Global pipes: validation + transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  // Global filters & interceptors (PII-redacted logging, problem+json errors)
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Trust proxy (important for rate limiting by real IP behind reverse proxy)
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  const traceMiddleware = new TraceIdMiddleware();
  app.use(traceMiddleware.use.bind(traceMiddleware));
  ((app as any).set)('trust proxy', 1);

  // Swagger OpenAPI (file 02: generated OpenAPI 3.1)
  const config = new DocumentBuilder()
    .setTitle('AmarID API')
    .setDescription('Privacy-first biometric-backed Universal ID platform for Bangladesh')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'OTP, passkeys, sessions')
    .addTag('identity', 'Universal ID lifecycle')
    .addTag('enrollment', 'Onboarding state machine')
    .addTag('biometrics', 'Template protection & dedup')
    .addTag('oidc', 'OpenID Connect provider')
    .addTag('consent', 'Attribute sharing grants')
    .addTag('ekyc', 'Bank/MFS e-KYC')
    .addTag('proof-of-life', 'Periodic re-verification')
    .addTag('admin', 'Partner & fraud management')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  logger.log(`AmarID API listening on http://localhost:${port}`);
  logger.log(`OpenAPI docs at http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});

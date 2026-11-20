"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const trace_id_middleware_1 = require("./common/middleware/trace-id.middleware");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });
    // Global pipes: validation + transformation
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
    }));
    // Global filters & interceptors (PII-redacted logging, problem+json errors)
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new transform_interceptor_1.TransformInterceptor());
    // Trust proxy (important for rate limiting by real IP behind reverse proxy)
    app.enableCors({
        origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });
    app.use(new trace_id_middleware_1.TraceIdMiddleware());
    (app.set)('trust proxy', 1);
    // Swagger OpenAPI (file 02: generated OpenAPI 3.1)
    const config = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = Number(process.env.PORT) || 4000;
    await app.listen(port);
    logger.log(`AmarID API listening on http://localhost:${port}`);
    logger.log(`OpenAPI docs at http://localhost:${port}/docs`);
}
bootstrap().catch((err) => {
    console.error('Failed to start API:', err);
    process.exit(1);
});

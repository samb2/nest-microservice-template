import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import {
  INestApplication,
  INestApplicationContext,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  HttpExceptionFilter,
  ResponseInterceptor,
  winstonLogger,
} from '@samb2/nest-microservice';

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());

  app.useLogger(winstonLogger);

  const moduleRef: INestApplicationContext = app.select(AppModule);
  const reflector: Reflector = moduleRef.get(Reflector);
  // Using ResponseInterceptor as global Response
  app.useGlobalInterceptors(new ResponseInterceptor(reflector, configService));
  // Using HttpExceptionFilter as global Error handler
  app.useGlobalFilters(new HttpExceptionFilter(configService));
  app.enableCors(configService.get<object>('cors.origin'));

  app.setGlobalPrefix('/api');
  if (process.env.NODE_ENV !== 'production') {
    const options = new DocumentBuilder()
      .setTitle('AUTH-SERVICE Template')
      .setDescription('The Authentication & Authorization API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api-docs', app, document);
  }

  // ┏━━━━━ 🎯 Connect to RabbitMQ Microservice  🎯 ━━━┓
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        `amqp://${configService.get<string>(
          'rabbitMq.username',
        )}:${configService.get<string>(
          'rabbitMq.password',
        )}@${configService.get<string>(
          'rabbitMq.host',
        )}:${configService.get<string>('rabbitMq.port')}`,
      ],
      queue: `${configService.get<string>('rabbitMq.auth_queue')}`,
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });
  await app.startAllMicroservices();
  // 🌐 Start the NestJS application by listening on port 3000 🌐
  const port: number = configService.get('server.port');
  await app.listen(port, () => {
    Logger.log(`Server running on port ${port}`);
  });
}

bootstrap();

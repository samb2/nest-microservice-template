import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as process from 'process';
import configuration from './config/configuration';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { FileModule } from './file/file.module';
import { MinioModule } from './minio/minio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      load: [configuration],
      cache: true,
    }),
    TerminusModule,
    DatabaseModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('rateLimit.THROTTLE_TTL'),
          limit: configService.get<number>('rateLimit.THROTTLE_LIMIT'),
        },
      ],
    }),
    FileModule,
    MinioModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

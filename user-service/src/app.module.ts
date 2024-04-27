import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as process from 'process';
import configuration from './config/configuration';
import { HealthController } from './health/health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { UserModule } from './user/user.module';
import { LoggerMiddleware } from '@irole/microservices';
import { ProfileModule } from './profile/profile.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenStrategy } from './utils/passport/accessToken.strategy';
import { RedisHealthIndicator, RedisModule } from './redis';
import { PrismaModule } from 'nestjs-prisma';
import { MicroserviceModule } from './microservice/microservice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      load: [configuration],
      cache: true,
    }),
    TerminusModule,
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
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
    UserModule,
    ProfileModule,
    MicroserviceModule,
  ],
  controllers: [HealthController],
  providers: [
    RedisHealthIndicator,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AccessTokenStrategy,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

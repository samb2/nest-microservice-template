import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const redisCommonFactory: FactoryProvider<Redis> = {
  provide: 'RedisCommon',
  useFactory: (configService: ConfigService) => {
    const redisInstance: Redis = new Redis({
      host: configService.get('redis.host_common'),
      port: configService.get('redis.port_common'),
      password: configService.get('redis.password_common'),
    });

    redisInstance.on('error', (e) => {
      throw new Error(`Redis connection failed: ${e}`);
    });

    return redisInstance;
  },
  inject: [ConfigService],
};

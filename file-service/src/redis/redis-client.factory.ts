import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const redisCommonFactory: FactoryProvider<Redis> = {
  provide: 'RedisCommon',
  useFactory: (configService: ConfigService) => {
    const redisInstance = new Redis({
      host: configService.get('redis.host_common'),
      port: configService.get('redis.port_common'),
    });

    redisInstance.on('error', (e) => {
      throw new Error(`Redis connection failed: ${e}`);
    });

    return redisInstance;
  },
  inject: [ConfigService],
};

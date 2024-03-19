import { FactoryProvider } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

export const redisCommon: FactoryProvider<Redis> = {
  provide: 'RedisCommon',
  useFactory: () => {
    const redisInstance = new Redis({
      host: process.env.REDIS_HOST_COMMON,
      port: Number(process.env.REDIS_PORT_COMMON),
    });

    redisInstance.on('error', (e) => {
      throw new Error(`Redis connection failed: ${e}`);
    });

    return redisInstance;
  },
  inject: [ConfigService],
};

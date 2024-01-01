import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const store = await redisStore({
      url: `redis://${configService.get<string>(
        'REDIS_HOST',
      )}:${configService.get<string>('REDIS_PORT')}`,
    });
    return {
      store: () => store,
    };
  },
  inject: [ConfigService],
};

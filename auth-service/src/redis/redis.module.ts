import { Module, Global } from '@nestjs/common';
import {
  redisCommonFactory,
  redisRefreshFactory,
} from './redis-client.factory';

@Global()
@Module({
  providers: [redisRefreshFactory, redisCommonFactory],
  exports: [redisRefreshFactory, redisCommonFactory],
})
export class RedisModule {}

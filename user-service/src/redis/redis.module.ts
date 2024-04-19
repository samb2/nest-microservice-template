import { Module, Global } from '@nestjs/common';
import { redisCommonFactory } from './redis-client.factory';

@Global()
@Module({
  providers: [redisCommonFactory],
  exports: [redisCommonFactory],
})
export class RedisModule {}

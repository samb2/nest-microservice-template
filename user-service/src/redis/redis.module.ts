import { Module, Global } from '@nestjs/common';
import { redisCommonFactory } from './redis-client.factory';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [redisCommonFactory, RedisService],
  exports: [RedisService],
})
export class RedisModule {}

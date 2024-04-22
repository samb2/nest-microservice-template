import { Module, Global } from '@nestjs/common';
import { redisCommonFactory, redisAuthFactory } from './redis-client.factory';
import { RedisAuthService } from './redis-auth.service';
import { RedisCommonService } from './redis-common.service';

@Global()
@Module({
  providers: [
    redisAuthFactory,
    redisCommonFactory,
    RedisAuthService,
    RedisCommonService,
  ],
  exports: [RedisAuthService, RedisCommonService],
})
export class RedisModule {}

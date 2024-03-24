import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject('RedisRefresh') private readonly redisRefresh: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = !!(await this.redisRefresh.ping());
    const result = this.getStatus(key, isHealthy, {});
    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('redis check failed', result);
  }
}

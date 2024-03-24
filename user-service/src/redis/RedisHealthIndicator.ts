import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject('RedisCommon') private readonly redisCommon: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy: boolean = !!(await this.redisCommon.ping());
    const result = this.getStatus(key, isHealthy, {});
    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('redis check failed', result);
  }
}

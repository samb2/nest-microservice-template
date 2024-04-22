import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisAuthService } from './redis-auth.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(RedisAuthService)
    private readonly redisAuthService: RedisAuthService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy: boolean = !!(await this.redisAuthService.ping());
    const result: HealthIndicatorResult = this.getStatus(key, isHealthy, {});
    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('redis check failed', result);
  }
}

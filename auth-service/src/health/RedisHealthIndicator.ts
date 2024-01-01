import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache, Store } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const store: Store = this.cacheManager.store;
    const keys = await store.keys();
    const isHealthy: boolean = keys.length >= 0;
    const result = this.getStatus(key, isHealthy, {});
    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('redis check failed', result);
  }
}

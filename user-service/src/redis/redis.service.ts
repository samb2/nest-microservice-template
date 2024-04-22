import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('RedisCommon') private readonly redisCommon: Redis) {}

  async get(key: string): Promise<string> {
    return this.redisCommon.get(key);
  }

  async set(key: string, value: string): Promise<'OK'> {
    return this.redisCommon.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.redisCommon.del(key);
  }

  // Other Redis operations
  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redisCommon.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.redisCommon.hget(key, field);
  }

  async ping(): Promise<'PONG'> {
    return this.redisCommon.ping();
  }
}

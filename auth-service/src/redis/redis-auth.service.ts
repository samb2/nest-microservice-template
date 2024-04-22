import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisAuthService {
  constructor(@Inject('RedisAuth') private readonly redisAuth: Redis) {}

  async get(key: string): Promise<string> {
    return this.redisAuth.get(key);
  }

  async set(key: string, value: string): Promise<'OK'> {
    return this.redisAuth.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.redisAuth.del(key);
  }

  // Other Redis operations
  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redisAuth.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.redisAuth.hget(key, field);
  }

  async ping(): Promise<'PONG'> {
    return this.redisAuth.ping();
  }
}

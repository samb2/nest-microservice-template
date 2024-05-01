import { Inject, Injectable } from '@nestjs/common';
import { RedisKeyEnum } from '@samb2/nest-microservice';
import Redis, { RedisKey } from 'ioredis';
import { IRedisAuthServiceInterface } from './interface/IRedisAuthService.interface';

@Injectable()
export class RedisAuthService implements IRedisAuthServiceInterface {
  constructor(@Inject('RedisAuth') private readonly redisAuth: Redis) {}

  async get(key: RedisKey): Promise<string | null> {
    return this.redisAuth.get(key);
  }

  async set(
    key: RedisKey,
    value: string | number | Buffer,
    expiration?: number,
  ): Promise<void> {
    if (expiration) {
      await this.redisAuth.set(key, value, 'EX', expiration);
    }
    await this.redisAuth.set(key, value);
  }

  async delete(key: RedisKey): Promise<number> {
    return this.redisAuth.del(key);
  }

  // Other Redis operations
  async hSet(
    key: RedisKey,
    field: string | Buffer | number,
    value: string | Buffer | number,
  ): Promise<number> {
    return this.redisAuth.hset(key, field, value);
  }

  async hGet(key: RedisKey, field: string | Buffer): Promise<string | null> {
    return this.redisAuth.hget(key, field);
  }

  async setEx(
    key: RedisKey,
    second: string | number,
    value: string | number | Buffer,
  ): Promise<void> {
    await this.redisAuth.setex(key, second, value);
  }

  async getEx(key: RedisKey): Promise<string | null> {
    return this.redisAuth.getex(key);
  }

  async ping(): Promise<string> {
    return this.redisAuth.ping();
  }

  generateRefreshKey(value: string): string {
    return `${RedisKeyEnum.REFRESH}-${value}`;
  }
}

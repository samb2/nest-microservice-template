import * as dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});
import { rateLimit } from './rateLimit.config';
import { cors } from './cors.config';
import { server } from './server.config';
import { rabbitMq } from './rabbitMq.config';
import { jwt } from './jwt.config';
import { database } from './database.config';
import { minio } from './minio.config';
import { redis } from './redis.config';

export default () => ({
  server,
  database,
  redis,
  rabbitMq,
  jwt,
  rateLimit,
  cors,
  minio,
});

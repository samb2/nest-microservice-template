import * as dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});
import { rateLimit } from './rateLimit.config';
import { cors } from './cors.config';
import { server } from './server.config';
import { rabbitMq } from './rabbitMq.config';
import { email } from './email.config';

export default () => ({
  server,
  rabbitMq,
  rateLimit,
  cors,
  email,
});

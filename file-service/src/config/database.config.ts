import * as process from 'process';

import * as dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

const databaseConfig: object = {
  uri: process.env.DATABASE_URL,
};

export { databaseConfig as database };

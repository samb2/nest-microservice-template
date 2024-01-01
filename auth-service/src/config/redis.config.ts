const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

export { redisConfig as redis };

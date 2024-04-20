const redisConfig = {
  host_common: process.env.REDIS_HOST_COMMON,
  port_common: process.env.REDIS_PORT_COMMON,
  password_common: process.env.REDIS_PASSWORD_COMMON,
};

export { redisConfig as redis };

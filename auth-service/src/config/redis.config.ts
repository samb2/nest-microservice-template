const redisConfig: object = {
  host_refresh: process.env.REDIS_HOST_REFRESH,
  port_refresh: process.env.REDIS_PORT_REFRESH,
  host_common: process.env.REDIS_HOST_COMMON,
  port_common: process.env.REDIS_PORT_COMMON,
};

export { redisConfig as redis };

const redisConfig: object = {
  host_auth: process.env.REDIS_HOST_AUTH,
  port_auth: process.env.REDIS_PORT_AUTH,
  password_auth: process.env.REDIS_PASSWORD_AUTH,
  host_common: process.env.REDIS_HOST_COMMON,
  port_common: process.env.REDIS_PORT_COMMON,
  password_common: process.env.REDIS_PASSWORD_COMMON,
};

export { redisConfig as redis };

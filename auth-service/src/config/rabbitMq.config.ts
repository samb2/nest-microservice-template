const rabbitMqConfig = {
  host: process.env.RMQ_HOST,
  port: process.env.RMQ_PORT,
  username: process.env.RMQ_USERNAME,
  password: process.env.RMQ_PASSWORD,
  file_queue: process.env.RMQ_FILE_QUEUE,
  auth_queue: process.env.RMQ_AUTH_QUEUE,
  user_queue: process.env.RMQ_USER_QUEUE,
};

export { rabbitMqConfig as rabbitMq };

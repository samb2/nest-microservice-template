import { Module } from '@nestjs/common';
import { RabbitMqService } from './rabbitMq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule], // Import ConfigModule to use ConfigService
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              `amqp://${configService.get<string>(
                'rabbitMq.username',
              )}:${configService.get<string>(
                'rabbitMq.password',
              )}@${configService.get<string>(
                'rabbitMq.host',
              )}:${configService.get<string>('rabbitMq.port')}`,
            ], // Use configuration values
            queue: configService.get<string>('rabbitMq.user_queue'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [RabbitMqService],
  exports: [RabbitMqService],
})
export class RabbitMqCustomModule {}

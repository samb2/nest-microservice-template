import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService], // Inject the ConfigService
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('database.uri'),
      }),
    }),
  ],
})
export class DatabaseModule {}

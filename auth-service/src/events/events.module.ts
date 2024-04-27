import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MicroserviceModule } from '../microservice/microservice.module';

@Module({
  imports: [EventEmitterModule.forRoot(), MicroserviceModule],
  providers: [EventsService],
})
export class EventsModule {}

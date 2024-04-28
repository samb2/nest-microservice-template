import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForgotPasswordEvent, UserRegisteredEvent } from './dto';
import { EventEnum } from './enum/event.enum';
import { MicroserviceService } from '../microservice/microservice.service';
import { PatternEnum } from '@samb2/nest-microservice';

@Injectable()
export class EventsService implements OnModuleInit {
  constructor(
    private eventEmitter: EventEmitter2,
    private readonly microserviceService: MicroserviceService,
  ) {}

  onModuleInit(): any {
    // user-registered
    this.eventEmitter.on(
      EventEnum.USER_REGISTERED,
      (event: UserRegisteredEvent) => {
        Logger.log(event);
        // Here you can add logic to send an email or perform other actions
      },
    );

    // forgot-password
    this.eventEmitter.on(
      EventEnum.FORGOT_PASSWORD,
      async (event: ForgotPasswordEvent) => {
        // Here you can add logic to send a password reset email

        const payload = {
          email: event.email,
          subject: 'Forgot Password',
          text: `Your token is : ${event.token}`,
        };
        await this.microserviceService.sendToEmailService(
          PatternEnum.EMAIL_FORGOT_PASSWORD,
          payload,
        );
      },
    );
  }
}

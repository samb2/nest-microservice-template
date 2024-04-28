import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { EmailService } from './email.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern(PatternEnum.EMAIL_FORGOT_PASSWORD)
  sendEmail(
    @Payload() createEmailDto: CreateEmailDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.emailService.sendEmail(createEmailDto, context);
  }
}

import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UserMicroserviceService } from './user-microservice.service';

@Controller('user')
export class UserMicroserviceController {
  constructor(
    private readonly userMicroserviceService: UserMicroserviceService,
  ) {}

  @MessagePattern(PatternEnum.USER_REGISTERED)
  createUser(
    @Payload() createUserDto: CreateUserDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.userMicroserviceService.create(createUserDto, context);
  }
}

import { Controller } from '@nestjs/common';
import { MicroserviceService } from './microservice.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';
import { UpdateUserDto, UpdateUserPasswordDto } from './dto';

@Controller()
export class MicroserviceController {
  constructor(private readonly microserviceService: MicroserviceService) {}

  @MessagePattern(PatternEnum.AUTH_UPDATE_USER)
  updateUser(
    @Payload() updateUserDto: UpdateUserDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.microserviceService.updateUser(updateUserDto, context);
  }

  @MessagePattern(PatternEnum.AUTH_UPDATE_PASSWORD)
  updatePassword(
    @Payload() updatePasswordUserDto: UpdateUserPasswordDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.microserviceService.updatePassword(
      updatePasswordUserDto,
      context,
    );
  }

  @MessagePattern(PatternEnum.AUTH_VERIFY_TOKEN)
  public async getUserById(
    @Payload() payload: MicroResInterface,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.microserviceService.verifyToken(payload, context);
  }
}

import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { AuthMicroserviceService } from './auth-microservice.service';

@Controller()
export class AuthMicroserviceController {
  constructor(
    private readonly authMicroserviceService: AuthMicroserviceService,
  ) {}

  @MessagePattern(PatternEnum.AUTH_UPDATE_USER)
  updateUser(
    @Payload() updateUserDto: UpdateUserDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.authMicroserviceService.updateUser(updateUserDto, context);
  }

  @MessagePattern(PatternEnum.AUTH_UPDATE_PASSWORD)
  updatePassword(
    @Payload() updatePasswordUserDto: UpdateUserPasswordDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.authMicroserviceService.updatePassword(
      updatePasswordUserDto,
      context,
    );
  }

  @MessagePattern(PatternEnum.AUTH_VERIFY_TOKEN)
  public async getUserById(
    @Payload() payload: MicroResInterface,
    @Ctx() context: RmqContext,
  ): Promise<any> {
    return this.authMicroserviceService.verifyToken(payload, context);
  }
}
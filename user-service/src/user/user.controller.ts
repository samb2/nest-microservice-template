import { Controller, Get, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { AccessTokenGuard } from '../utils/passport/jwt-access.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PatternEnum } from '@irole/microservices';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(PatternEnum.USER_REGISTERED)
  create(@Payload() createUserDto: CreateUserDto, @Ctx() context: RmqContext) {
    return this.userService.create(createUserDto, context);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  @ApiBearerAuth()
  findAll(@Req() req: any) {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}

import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { RegisterResDto } from './dto/response/registerRes.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResDto } from './dto/response/loginRes.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ForgotPasswordResDto } from './dto/response/forgotPasswordRes.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ResetPasswordResDto } from './dto/response/resetPasswordRes.dto';
import { ApiOkResponseSuccess } from '../utils/ApiOkResponseSuccess.util';
import { RefreshResDto } from './dto/response/refreshRes.dto';

import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { RefreshTokenGuard } from '../utils/guard/jwt-refresh.guard';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('auth service')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(PatternEnum.AUTH_UPDATE_USER)
  createUser(
    @Payload() updateUserDto: UpdateUserDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.authService.updateUser(updateUserDto, context);
  }

  @Post('register')
  @HttpCode(201)
  @ApiBody({ type: RegisterDto })
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiResponse({ status: 409, description: 'This user registered before!' })
  @ApiOkResponseSuccess(RegisterResDto, 201)
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiBody({ type: LoginDto })
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiResponse({ status: 401, description: 'username or password is wrong!' })
  @ApiOkResponseSuccess(LoginResDto, 200)
  @UseInterceptors(ClassSerializerInterceptor)
  async login(@Body() loginDto: LoginDto): Promise<LoginResDto> {
    return this.authService.login(loginDto);
  }

  @Post('forgotPassword')
  @HttpCode(200)
  @ApiResponse({ status: 400, description: 'Bad Request!' })
  @ApiResponse({ status: 401, description: 'username or password is wrong!' })
  @ApiResponse({ status: 403, description: 'your account is not active!' })
  @ApiOkResponseSuccess(ForgotPasswordResDto, 200)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('resetPassword')
  @HttpCode(200)
  @ApiResponse({ status: 400, description: 'Bad Request!' })
  @ApiResponse({ status: 403, description: 'This Token Expired' })
  @ApiOkResponseSuccess(ResetPasswordResDto, 200)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponseSuccess(RefreshResDto, 200)
  refresh(@Req() req: any): RefreshResDto {
    return this.authService.refresh(req.user);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async logout(@Req() req: any): Promise<object> {
    return this.authService.logout(req.user);
  }

  @MessagePattern(PatternEnum.AUTH_VERIFY_TOKEN)
  public async getUserById(
    @Payload() payload: MicroResInterface,
    @Ctx() context: RmqContext,
  ): Promise<any> {
    return this.authService.verifyToken(payload, context);
  }
}

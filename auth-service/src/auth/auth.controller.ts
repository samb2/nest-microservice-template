import {
  Controller,
  Post,
  Body,
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
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { RegisterResDto } from './dto/response/register-res.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResDto } from './dto/response/login-res.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ForgotPasswordResDto } from './dto/response/forgot-password-res.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordResDto } from './dto/response/reset-password-res.dto';
import { ApiOkResponseSuccess } from '../utils/ApiOkResponseSuccess.util';
import { RefreshResDto } from './dto/response/refresh-res.dto';
import { RefreshTokenGuard } from '../utils/guard/jwt-refresh.guard';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { LogoutResDto } from './dto/response/logout-res.dto';

@ApiTags('auth service')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiOkResponseSuccess(RegisterResDto, 201)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiConflictResponse({ description: 'This user registered before!' })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponseSuccess(LoginResDto)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiUnauthorizedResponse({ description: 'username or password is wrong!' })
  @ApiForbiddenResponse({ description: 'Your account is not active!' })
  @UseInterceptors(ClassSerializerInterceptor)
  async login(@Body() loginDto: LoginDto): Promise<LoginResDto> {
    return this.authService.login(loginDto);
  }

  @Post('forgotPassword')
  @ApiOkResponseSuccess(ForgotPasswordResDto)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiUnauthorizedResponse({ description: 'username or password is wrong!' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('resetPassword')
  @ApiOkResponseSuccess(ResetPasswordResDto)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiForbiddenResponse({ description: 'This Token Expired' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiBearerAuth()
  @ApiOkResponseSuccess(RefreshResDto)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  refresh(@Req() req: any): RefreshResDto {
    return this.authService.refresh(req.user);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOkResponseSuccess(RefreshResDto)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async logout(@Req() req: any): Promise<LogoutResDto> {
    return this.authService.logout(req.user);
  }
}

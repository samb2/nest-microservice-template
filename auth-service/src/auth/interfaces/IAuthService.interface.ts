import { User } from '../entities/user.entity';
import { RefreshResDto } from '../dto/response/refresh-res.dto';
import { RegisterDto } from '../dto/register.dto';
import { RegisterResDto } from '../dto/response/register-res.dto';
import { LoginResDto } from '../dto/response/login-res.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ForgotPasswordResDto } from '../dto/response/forgot-password-res.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ResetPasswordResDto } from '../dto/response/reset-password-res.dto';

export interface IAuthServiceInterface {
  register(registerDto: RegisterDto): Promise<RegisterResDto>;

  login(loginDto: LoginDto): Promise<LoginResDto>;

  forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResDto>;

  resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResDto>;

  refresh(email: string): RefreshResDto;

  logout(user: User): Promise<object>;

  validateUserByAuthId(id: string): Promise<User | undefined>;
}

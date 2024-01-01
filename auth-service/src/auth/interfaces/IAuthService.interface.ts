import { User } from '../entities/user.entity';
import { TokenTypeEnum } from '../enum/token-type.enum';
import { RefreshResDto } from '../dto/response/refreshRes.dto';
import { RegisterDto } from '../dto/register.dto';
import { RegisterResDto } from '../dto/response/registerRes.dto';
import { LoginResDto } from '../dto/response/loginRes.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgotPassword.dto';
import { ForgotPasswordResDto } from '../dto/response/forgotPasswordRes.dto';
import { ResetPasswordDto } from '../dto/resetPassword.dto';
import { ResetPasswordResDto } from '../dto/response/resetPasswordRes.dto';

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

  userExists(email: string): Promise<boolean>;

  validateUserByEmail(email: string): Promise<User | undefined>;

  generateToken(payload: object, type: TokenTypeEnum): string;
}

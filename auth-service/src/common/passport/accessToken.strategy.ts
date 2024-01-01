import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../auth/entities/user.entity';

export interface JwtAccessPayload {
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.access_key'),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<User> {
    const user: User = await this.authService.validateUserByEmail(
      payload.email,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

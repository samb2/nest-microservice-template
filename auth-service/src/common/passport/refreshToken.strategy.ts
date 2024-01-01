import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/auth.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface JwtRefreshPayload {
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.refresh_key'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtRefreshPayload): Promise<any> {
    // get refresh token
    const token = req.headers.authorization.split(' ')[1];
    const redisRefreshToken = await this.cacheManager.get(payload.email);
    if (token === redisRefreshToken) {
      req.email = payload.email;
      return payload.email;
    }
    throw new UnauthorizedException();
  }
}

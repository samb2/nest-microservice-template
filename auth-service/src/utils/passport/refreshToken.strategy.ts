import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisAuthService } from '../../redis';
import { JwtRefreshPayload } from '@samb2/nest-microservice';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    @Inject(RedisAuthService)
    private readonly redisAuthService: RedisAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.refresh_key'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload): Promise<string> {
    // get refresh token
    const token: string = req.headers.authorization.split(' ')[1];
    const key: string = this.redisAuthService.generateRefreshKey(
      payload.authId,
    );
    const redisRefreshToken: string = await this.redisAuthService.get(key);
    if (token !== redisRefreshToken) {
      throw new UnauthorizedException();
    }
    return payload.authId;
  }
}

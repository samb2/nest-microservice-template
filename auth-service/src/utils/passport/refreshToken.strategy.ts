import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayload } from '@irole/microservices';
import Redis from 'ioredis';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    @Inject('RedisRefresh') private readonly redisRefresh: Redis,
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
    const redisRefreshToken = await this.redisRefresh.get(payload.authId);
    if (token === redisRefreshToken) {
      return payload.authId;
    }
    throw new UnauthorizedException();
  }
}

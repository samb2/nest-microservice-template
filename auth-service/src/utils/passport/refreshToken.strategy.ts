import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisAuthService } from '../../redis';
import { JwtRefreshPayload } from "@samb2/nest-microservice";

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

  async validate(req: any, payload: JwtRefreshPayload): Promise<string> {
    // get refresh token
    const token = req.headers.authorization.split(' ')[1];
    const redisRefreshToken: string = await this.redisAuthService.get(
      `REFRESH-${payload.authId}`,
    );
    if (token !== redisRefreshToken) {
      throw new UnauthorizedException();
    }
    return payload.authId;
  }
}

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JwtAccessPayload,
  MicroResInterface,
  PatternEnum,
} from '@irole/microservices';
import { FileMicroserviceService } from '../../file/microservice/file-microservice.service';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private configService: ConfigService,
    @Inject(FileMicroserviceService)
    private readonly fileMicroserviceService: FileMicroserviceService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.access_key'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtAccessPayload): Promise<any> {
    const microPayload = {
      authId: payload.authId,
    };

    const result: MicroResInterface =
      await this.fileMicroserviceService.sendToAuthService(
        PatternEnum.AUTH_VERIFY_TOKEN,
        microPayload,
      );

    if (result.error) {
      throw new UnauthorizedException(result.reason.message);
    }
    req.roles = payload.roles;
    return result.data;
  }
}

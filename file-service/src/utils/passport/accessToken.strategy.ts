import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAccessPayload } from '../../common/interfaces/jwt-access-payload.interface';
import { ServiceNameEnum } from '../../common/enum/service-name.enum';
import { ClientProxy } from '@nestjs/microservices';
import {
  MicroResInterface,
  MicroSendInterface,
} from '../../common/interfaces/micro-res.interface';
import {
  generateMessage,
  sendMicroMessage,
} from '../../common/utils/microservice-message.util';
import { PatternEnum } from '../../common/enum/pattern.enum';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private configService: ConfigService,
    @Inject(ServiceNameEnum.AUTH) private readonly authClient: ClientProxy,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.access_key'),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<any> {
    const message: MicroSendInterface = generateMessage(
      ServiceNameEnum.FILE,
      ServiceNameEnum.AUTH,
      {
        authId: payload.authId,
      },
    );
    // todo add enum for pattern
    const result: MicroResInterface = await sendMicroMessage(
      this.authClient,
      PatternEnum.AUTH_VERIFY_TOKEN,
      message,
    );
    if (result.error) {
      throw new UnauthorizedException(result.reason.message);
    }
    return result.data;
  }
}

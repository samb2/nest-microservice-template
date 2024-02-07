import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { User } from '../../user/entities/user.entity';
import { JwtAccessPayload } from '../../common/interfaces/jwt-access-payload.interface';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.access_key'),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<any> {
    const user: User = await this.userService.validateUserByAuthId(
      payload.authId,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../auth/entities';
import { UserService } from '../../auth/user.service';
import { JwtAccessPayload } from "@samb2/nest-microservice";

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
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtAccessPayload): Promise<User> {
    const user: User = await this.userService.validateUserByAuthId(
      payload.authId,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    req.roles = payload.roles;
    return user;
  }
}

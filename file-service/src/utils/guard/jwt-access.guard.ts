import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@samb2/nest-microservice';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt-access') {
  handleRequest<TUser = User>(err: object, user: TUser | boolean): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user as TUser;
  }
}

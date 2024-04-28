import { ServiceNameEnum } from '@samb2/nest-microservice';

export class CreateUserDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: UserInfo;
  ttl: number;
}

class UserInfo {
  email: string;
  authId: string;
}

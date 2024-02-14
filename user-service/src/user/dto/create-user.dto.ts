import { ServiceNameEnum } from '@irole/microservices';

export class CreateUserDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: UserInfo;
}

class UserInfo {
  email: string;
  authId: string;
}

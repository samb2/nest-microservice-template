import { ServiceNameEnum } from '@irole/microservices';

export class UpdateUserDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: any;
  ttl: number;
}

class UserInfo {
  email: string;
  authId: string;
}

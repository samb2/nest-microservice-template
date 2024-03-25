import { ServiceNameEnum } from '@irole/microservices';

export class UpdateAvatarDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: UserInfo;
  ttl: number;
}

class UserInfo {
  authId: string;
  avatar: string;
}

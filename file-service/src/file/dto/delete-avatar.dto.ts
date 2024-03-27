import { ServiceNameEnum } from '@irole/microservices';

export class DeleteAvatarDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: UserInfo;
  ttl: number;
}

class UserInfo {
  avatar: string;
}

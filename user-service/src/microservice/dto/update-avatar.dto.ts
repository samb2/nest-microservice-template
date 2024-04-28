import { ServiceNameEnum } from '@samb2/nest-microservice';

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

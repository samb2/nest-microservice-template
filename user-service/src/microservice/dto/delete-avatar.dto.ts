import { ServiceNameEnum } from '@samb2/nest-microservice';

export class DeleteAvatarDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: UserInfo;
  ttl: number;
}

class UserInfo {
  authId: string;
}

import { ServiceNameEnum } from '../../common/enum/service-name.enum';

export class CreateUserDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: UserInfo;
}

class UserInfo {
  email: string;
  authId: string;
}

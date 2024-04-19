import { ServiceNameEnum } from '@irole/microservices';

export class UpdateUserPasswordDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: PayloadInfo;
  ttl: number;
}

class PayloadInfo {
  oldPassword: string;
  newPassword: string;
  authId: string;
}

import { ServiceNameEnum } from '@samb2/nest-microservice';

export class UpdateUserPasswordDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: PayloadInfo;
  ttl: number;
}

export class PayloadInfo {
  oldPassword: string;
  newPassword: string;
  authId: string;
}

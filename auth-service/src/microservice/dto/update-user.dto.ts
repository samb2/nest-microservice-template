import { ServiceNameEnum } from '@samb2/nest-microservice';

export class UpdateUserDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: object;
  ttl: number;
}

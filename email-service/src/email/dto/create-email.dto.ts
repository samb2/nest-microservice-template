import { ServiceNameEnum } from '@samb2/nest-microservice';

export class CreateEmailDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: object;
  ttl?: number;
}

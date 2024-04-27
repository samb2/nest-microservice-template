import { ServiceNameEnum } from '@irole/microservices';

export class CreateEmailDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: any;
  ttl?: number;
}

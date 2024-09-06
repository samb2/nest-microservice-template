import { ServiceNameEnum } from '@samb2/nest-microservice';

interface IData {
  email: string;
  subject: string;
  text: string;
}

export class CreateEmailDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: IData;
  ttl?: number;
}

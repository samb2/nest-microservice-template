import { ServiceNameEnum } from '@samb2/nest-microservice';

interface IData {
  authId: string;
  updateUserDto: object;
}

export class UpdateUserDto {
  from: ServiceNameEnum;
  to: ServiceNameEnum;
  data: IData;
  ttl: number;
}

import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';

export interface IMicroservice {
  sendToUserService(
    pattern: PatternEnum,
    payload: any,
    timeOut: string | number,
  ): Promise<MicroResInterface>;

  sendToEmailService(
    pattern: PatternEnum,
    payload: any,
    timeOut?: string | number,
  ): Promise<MicroResInterface>;
}

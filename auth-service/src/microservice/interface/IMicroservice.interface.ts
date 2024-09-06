import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';

export interface IMicroservice {
  sendToUserService(
    pattern: PatternEnum,
    payload: object,
    timeOut: string | number,
  ): Promise<MicroResInterface>;

  sendToEmailService(
    pattern: PatternEnum,
    payload: object,
    timeOut?: string | number,
  ): Promise<MicroResInterface>;
}

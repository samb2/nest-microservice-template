import { MicroResInterface, PatternEnum } from '@irole/microservices';

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

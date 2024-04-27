import { MicroResInterface, PatternEnum } from '@irole/microservices';

export interface IMicroservice {
  sendToAuthService(
    pattern: PatternEnum,
    payload: any,
  ): Promise<MicroResInterface>;

  sendToUserService(
    pattern: PatternEnum,
    payload: any,
  ): Promise<MicroResInterface>;
}

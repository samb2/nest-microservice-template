import { MicroResInterface, PatternEnum } from '@irole/microservices';

export interface IMicroservice {
  sendToAuthService(
    pattern: PatternEnum,
    payload: any,
  ): Promise<MicroResInterface>;

  sendToFileService(
    pattern: PatternEnum,
    payload: any,
  ): Promise<MicroResInterface>;
}

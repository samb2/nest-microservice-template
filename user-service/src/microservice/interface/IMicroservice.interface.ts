import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';

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

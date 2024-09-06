import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';

export interface IMicroservice {
  sendToAuthService(
    pattern: PatternEnum,
    payload: object,
  ): Promise<MicroResInterface>;

  sendToFileService(
    pattern: PatternEnum,
    payload: object,
  ): Promise<MicroResInterface>;
}

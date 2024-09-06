import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';

export interface IMicroservice {
  sendToAuthService(
    pattern: PatternEnum,
    payload: object,
  ): Promise<MicroResInterface>;

  sendToUserService(
    pattern: PatternEnum,
    payload: object,
  ): Promise<MicroResInterface>;
}

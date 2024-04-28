import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';

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

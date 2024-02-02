import { ServiceNameEnum } from '../enum/service-name.enum';
import { MicroResInterface, Reason } from '../interfaces/micro-res.interface';

export class MicroserviceMessageUtil {
  private static from: ServiceNameEnum = ServiceNameEnum.AUTH;

  public static generateMessage(
    to: ServiceNameEnum,
    data: any,
  ): MicroResInterface {
    return {
      from: this.from,
      to: to,
      data,
    };
  }

  public static generateResMessage(
    to: ServiceNameEnum,
    data: any,
    error: boolean = false,
    reason?: Reason,
  ): MicroResInterface {
    if (reason) {
      return {
        from: this.from,
        to,
        data,
        error,
        reason,
      };
    } else {
      return {
        from: this.from,
        to,
        data,
      };
    }
  }
}

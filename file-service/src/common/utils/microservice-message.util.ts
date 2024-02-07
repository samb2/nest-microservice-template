import { ServiceNameEnum } from '../enum/service-name.enum';
import { MicroResInterface, Reason } from '../interfaces/micro-res.interface';

export class MicroserviceMessageUtil {
  private static from: ServiceNameEnum = ServiceNameEnum.USER;

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
    const message: MicroResInterface = {
      from: this.from,
      to,
      data,
      error,
      reason,
    };

    if (reason) {
      message.reason = reason;
    }

    return message;
  }
}

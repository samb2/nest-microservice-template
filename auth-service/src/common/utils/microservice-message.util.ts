import { ServiceNameEnum } from '../enum/service-name.enum';
import {
  MicroResInterface,
  MicroSendInterface,
  Reason,
} from '../interfaces/micro-res.interface';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { PatternEnum } from '../enum/pattern.enum';

export function generateMessage(
  from: ServiceNameEnum,
  to: ServiceNameEnum,
  data: any,
): MicroSendInterface {
  return {
    from,
    to,
    data,
  };
}

export function generateResMessage(
  from: ServiceNameEnum,
  to: ServiceNameEnum,
  data: any,
  error: boolean = false,
  reason?: Reason,
): MicroResInterface {
  const message: MicroResInterface = {
    from,
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

export async function sendMicroMessage(
  client: ClientProxy,
  pattern: PatternEnum,
  message: MicroSendInterface,
): Promise<MicroResInterface> {
  return firstValueFrom(client.send(pattern, message));
}

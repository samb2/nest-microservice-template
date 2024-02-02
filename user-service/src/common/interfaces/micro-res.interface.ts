import { ServiceNameEnum } from '../enum/service-name.enum';

export interface MicroResInterface {
  error?: boolean;
  reason?: Reason;
  data?: string;
  from: ServiceNameEnum;
  to: ServiceNameEnum;
}

export interface Reason {
  status?: number;
  message: string;
}

import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RabbitMqService {
  constructor(
    @Inject('USER_SERVICE')
    private readonly userClient: ClientProxy,
  ) {
    this.userClient.connect().then().catch();
  }

  async userCreated(messagePattern: string, data: any): Promise<any> {
    try {
      return await firstValueFrom(this.userClient.send(messagePattern, data));
    } catch (e) {
      return e;
    }
  }
}

import { Injectable } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { RmqContext } from '@nestjs/microservices';
import { generateResMessage, MicroResInterface } from '@irole/microservices';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { SentMessageInfo, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter<SentMessageInfo>;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('email.smtp.host'),
      port: 2525,
      auth: {
        user: configService.get<string>('email.smtp.auth.user'),
        pass: configService.get<string>('email.smtp.auth.pass'),
      },
    });
  }

  async sendEmail(
    payload: CreateEmailDto,
    context: RmqContext,
  ): Promise<MicroResInterface> {
    // Get the channel and original message from the RabbitMQ context
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('email.smtp.email'),
        to: payload.data.email,
        subject: payload.data.subject,
        text: payload.data.text,
      });
      // Acknowledge the message in the RabbitMQ channel
      channel.ack(originalMsg);

      // Return response message
      return generateResMessage(
        payload.from,
        payload.to,
        'email send successfully',
        false,
      );
    } catch (e) {
      // If an error occurs, reject the message in the RabbitMQ channel
      await channel.reject(originalMsg, false);

      // Return error response message
      return generateResMessage(payload.from, payload.to, null, true, {
        message: e.message,
        status: 500,
      });
    }
  }
}

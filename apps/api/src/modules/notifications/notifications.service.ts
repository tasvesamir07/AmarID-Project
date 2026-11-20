import { Injectable, Inject } from '@nestjs/common';
import { MAILER, SMS_GATEWAY } from '../../adapters/adapters.module';
import type { Mailer, SmsGateway } from '@amarid/shared';

@Injectable()
export class NotificationsService {
  constructor(@Inject(MAILER) private readonly mailer: Mailer, @Inject(SMS_GATEWAY) private readonly sms: SmsGateway) {}

  async email(to: string, subject: string, html: string, text: string) {
    return this.mailer.send({ to, subject, html, text });
  }

  async sendSms(to: string, text: string) {
    return this.sms.send(to, text);
  }
}

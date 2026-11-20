import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly s: NotificationsService) {}

  @Post('email')
  async email(@Body() body: { to: string; subject: string; html: string; text: string }) {
    return this.s.email(body.to, body.subject, body.html, body.text);
  }

  @Post('sms')
  async sms(@Body() body: { to: string; text: string }) {
    return this.s.sendSms(body.to, body.text);
  }
}

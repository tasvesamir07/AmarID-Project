import type { Mailer, SmsGateway } from '@amarid/shared';
export declare class NotificationsService {
    private readonly mailer;
    private readonly sms;
    constructor(mailer: Mailer, sms: SmsGateway);
    email(to: string, subject: string, html: string, text: string): Promise<any>;
    sendSms(to: string, text: string): Promise<any>;
}

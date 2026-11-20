import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly s;
    constructor(s: NotificationsService);
    email(body: {
        to: string;
        subject: string;
        html: string;
        text: string;
    }): Promise<any>;
    sms(body: {
        to: string;
        text: string;
    }): Promise<any>;
}

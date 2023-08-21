import Mailgun from 'mailgun.js';
const formData = require('form-data');

const env = {
    username: process.env.MAILGUN_API_ENDPOINT as string,
    key: process.env.MAILGUN_API_KEY as string,
    domain: process.env.MAILGUN_API_DOMAIN as string,
    emailFrom: process.env.EMAIL_FROM as string
}

export class MailgunClientService {

    public static async sendEmail(organizationId: string, emailSentTo: string[], csvData: any) {
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: env.username, key: env.key });

        let messageParams = {
            from: env.emailFrom,
            to: emailSentTo,
            subject: "Subscriber Summary Report",
            text: "Please find the subscriber summary report as an attachment to this email.",
            attachment: {
                filename: organizationId + ".csv",
                data: csvData
            }
        }

        return await mg.messages.create(env.domain, messageParams);
    }
}
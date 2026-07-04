console.log('[BOOT] mailer.js início', Date.now());
import nodemailer from 'nodemailer';
import logger from './logger.js';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error(
        'GMAIL_USER ou GMAIL_APP_PASSWORD não estão definidos nas variáveis de ambiente'
    );
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
    },
});

console.log('[BOOT] mailer.js fim', Date.now());

export async function sendMail({ to, subject, html }) {
    try {
        await transporter.sendMail({
            from: GMAIL_USER,
            to,
            subject,
            html,
        });
    } catch (err) {
        logger.error(`Falha ao enviar email para ${to}: ${err.message}`);
        throw err;
    }
}

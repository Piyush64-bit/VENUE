const logger = require('../config/logger');
const nodemailer = require('nodemailer');

// Mock email service for now, but structured to be swapped easily.
// In production, use SendGrid, AWS SES, or just SMTP.

// For development, we can just log to console or use Ethereal.
// Let's us simple console logging for "Stub/Mock".

class EmailService {
    constructor() {
        this.transporter = null;
        // If we configure nodemailer later:
        // this.transporter = nodemailer.createTransport({...});
    }

    async sendEmail(to, subject, html) {
        logger.info(`[EmailService] Sending email`, { to, subject });
        // logger.debug(`[EmailService] Body: ${html.substring(0, 100)}...`);

        // Mock success
        return Promise.resolve(true);
    }

    async sendBookingConfirmation(user, booking, slot, parent) {
        const subject = `Booking Confirmed: ${parent.title}`;
        const html = `
            <h1>Booking Confirmed!</h1>
            <p>Hi ${user.name},</p>
            <p>Your booking for <strong>${parent.title}</strong> is confirmed.</p>
            <p>Date: ${new Date(slot.startTime).toDateString()}</p>
            <p>Time: ${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}</p>
            <p>Seats: ${booking.seats.map(s => s.label).join(', ')}</p>
            <p>Quantity: ${booking.quantity}</p>
            <br/>
            <p>Thank you for choosing VENUE.</p>
        `;

        return this.sendEmail(user.email, subject, html);
    }
}

module.exports = new EmailService();

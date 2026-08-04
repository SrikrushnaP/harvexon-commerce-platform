import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config';

interface OrderData {
  orderNumber: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  total: number;
  deliveryAddress: {
    line1: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    // Only create transporter if SMTP credentials are configured
    if (!config.email.user && config.nodeEnv === 'production') {
      console.warn('[EmailService] SMTP not configured — emails will not be sent.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: config.email.user
          ? {
              user: config.email.user,
              pass: config.email.pass,
            }
          : undefined,
      });
    } catch (error) {
      console.error('[EmailService] Failed to create transporter:', error);
    }
  }

  private wrapHtml(title: string, body: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#2e7d32; padding:24px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">HrFressh</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f9f9; padding:20px 32px; text-align:center; border-top:1px solid #e0e0e0;">
              <p style="margin:0; font-size:12px; color:#888;">
                &copy; ${new Date().getFullYear()} HrFressh. All rights reserved.<br/>
                This is an automated message. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      if (config.nodeEnv === 'development') {
        console.log(`[EmailService] (dev) Would send to ${to}: "${subject}"`);
      }
      return;
    }

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
      });
      console.log(`[EmailService] Sent "${subject}" to ${to}`);
    } catch (error) {
      console.error(`[EmailService] Failed to send "${subject}" to ${to}:`, error);
    }
  }

  /**
   * Send order confirmation email
   */
  sendOrderConfirmation(to: string, orderData: OrderData): void {
    const itemsHtml = orderData.items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px 0; border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:right;">₹${item.total.toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const addressParts = [
      orderData.deliveryAddress.line1,
      orderData.deliveryAddress.line2,
      orderData.deliveryAddress.city,
      orderData.deliveryAddress.state,
      orderData.deliveryAddress.pincode,
    ].filter(Boolean);

    const body = `
      <h2 style="margin:0 0 16px; color:#2e7d32; font-size:20px;">Order Confirmed! 🎉</h2>
      <p style="color:#333; line-height:1.6;">
        Thank you for your order. Here's a summary:
      </p>
      <p style="margin:16px 0 8px; font-weight:600; color:#333;">
        Order #${orderData.orderNumber}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <thead>
          <tr style="border-bottom:2px solid #2e7d32;">
            <th style="padding:8px 0; text-align:left; color:#555; font-size:13px;">Item</th>
            <th style="padding:8px 0; text-align:center; color:#555; font-size:13px;">Qty</th>
            <th style="padding:8px 0; text-align:right; color:#555; font-size:13px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 0; font-weight:700; font-size:16px;">Total</td>
            <td style="padding:12px 0; text-align:right; font-weight:700; font-size:16px; color:#2e7d32;">₹${orderData.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="background-color:#f5f5f5; border-radius:6px; padding:16px; margin-top:16px;">
        <p style="margin:0 0 4px; font-weight:600; color:#333; font-size:13px;">Delivery Address</p>
        <p style="margin:0; color:#555; line-height:1.5;">${addressParts.join(', ')}</p>
      </div>
      <p style="color:#666; font-size:13px; margin-top:20px;">
        We'll notify you when your order status changes.
      </p>`;

    const html = this.wrapHtml('Order Confirmation', body);
    this.send(to, `Order Confirmed - #${orderData.orderNumber}`, html);
  }

  /**
   * Send order status update email
   */
  sendOrderStatusUpdate(to: string, orderNumber: string, newStatus: string, message?: string): void {
    const statusColors: Record<string, string> = {
      confirmed: '#2e7d32',
      processing: '#f57c00',
      packed: '#1565c0',
      out_for_delivery: '#6a1b9a',
      delivered: '#2e7d32',
      cancelled: '#c62828',
    };

    const statusLabels: Record<string, string> = {
      confirmed: 'Confirmed',
      processing: 'Processing',
      packed: 'Packed',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    const color = statusColors[newStatus] || '#333';
    const label = statusLabels[newStatus] || newStatus;

    const body = `
      <h2 style="margin:0 0 16px; color:#333; font-size:20px;">Order Status Update</h2>
      <p style="color:#333; line-height:1.6;">
        Your order <strong>#${orderNumber}</strong> has been updated:
      </p>
      <div style="text-align:center; margin:24px 0;">
        <span style="display:inline-block; background-color:${color}; color:#fff; padding:10px 24px; border-radius:20px; font-weight:600; font-size:16px;">
          ${label}
        </span>
      </div>
      ${message ? `<p style="color:#555; line-height:1.6; text-align:center;">${message}</p>` : ''}
      <p style="color:#888; font-size:13px; margin-top:24px; text-align:center;">
        Thank you for shopping with HrFressh!
      </p>`;

    const html = this.wrapHtml('Order Status Update', body);
    this.send(to, `Order #${orderNumber} - ${label}`, html);
  }

  /**
   * Send password reset email
   */
  sendPasswordReset(to: string, resetToken: string, userName: string): void {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:4300'}/reset-password?token=${resetToken}`;

    const body = `
      <h2 style="margin:0 0 16px; color:#333; font-size:20px;">Password Reset Request</h2>
      <p style="color:#333; line-height:1.6;">
        Hi ${userName},
      </p>
      <p style="color:#333; line-height:1.6;">
        We received a request to reset your password. Click the button below to set a new password:
      </p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${resetLink}" style="display:inline-block; background-color:#2e7d32; color:#ffffff; padding:14px 32px; border-radius:6px; text-decoration:none; font-weight:600; font-size:16px;">
          Reset Password
        </a>
      </div>
      <p style="color:#666; line-height:1.6; font-size:13px;">
        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
      <div style="background-color:#f5f5f5; border-radius:6px; padding:12px 16px; margin-top:20px;">
        <p style="margin:0; font-size:12px; color:#888;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${resetLink}" style="color:#2e7d32; word-break:break-all;">${resetLink}</a>
        </p>
      </div>`;

    const html = this.wrapHtml('Password Reset', body);
    this.send(to, 'Reset Your Password - HrFressh', html);
  }

  /**
   * Send welcome email after registration
   */
  sendWelcome(to: string, userName: string): void {
    const body = `
      <h2 style="margin:0 0 16px; color:#2e7d32; font-size:20px;">Welcome to HrFressh! 🌿</h2>
      <p style="color:#333; line-height:1.6;">
        Hi ${userName},
      </p>
      <p style="color:#333; line-height:1.6;">
        Welcome aboard! Your account has been created successfully. You can now browse our fresh produce catalog, place orders, and enjoy doorstep delivery.
      </p>
      <div style="background-color:#e8f5e9; border-radius:6px; padding:20px; margin:24px 0; text-align:center;">
        <p style="margin:0 0 8px; font-weight:600; color:#2e7d32; font-size:16px;">What you can do:</p>
        <p style="margin:0; color:#555; line-height:1.8;">
          🛒 Browse fresh produce &amp; groceries<br/>
          📦 Place orders with easy checkout<br/>
          🚚 Track your deliveries in real-time
        </p>
      </div>
      <div style="text-align:center; margin:24px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:4300'}" style="display:inline-block; background-color:#2e7d32; color:#ffffff; padding:14px 32px; border-radius:6px; text-decoration:none; font-weight:600; font-size:16px;">
          Start Shopping
        </a>
      </div>
      <p style="color:#666; font-size:13px; margin-top:20px;">
        If you have any questions, feel free to reach out. Happy shopping!
      </p>`;

    const html = this.wrapHtml('Welcome to HrFressh', body);
    this.send(to, 'Welcome to HrFressh! 🌿', html);
  }
}

export const emailService = new EmailService();

import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_PASS !== 'your_smtp_api_key_here') {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 465,
    secure: (env.SMTP_PORT || 465) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });
} else if (env.NODE_ENV === 'development') {
  nodemailer.createTestAccount().then((account) => {
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    });
    console.log('\n✉️  [MAIL SERVICE - ETHEREAL SEED] Test mailbox provisioned successfully!');
    console.log(`   User: ${account.user}`);
    console.log(`   Pass: ${account.pass}`);
    console.log('✉️  All outgoing emails will be rendered visually in Ethereal.\n');
  }).catch((err) => {
    console.error('⚠️ [MAIL SERVICE] Failed to provision Ethereal test mailbox:', err);
  });
}

// Shared HTML wrapper for all branded emails
function brandedEmail(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:#01019d;padding:28px 40px;text-align:center;">
                  <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Invoi<span style="color:#818cf8;">con</span></span>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  ${body}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Invoicon. Professional Invoice Management.</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">If you did not request this email, please disregard it.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    console.log('\n✉️  [MAIL SERVICE - DEV MODE] Email queued (no transporter):');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    return;
  }

  const info = await transporter.sendMail({
    from: `"Invoicon" <${env.EMAIL_FROM || 'noreply@invoicon.com'}>`,
    to,
    subject,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('\n✉️  [MAIL SERVICE] Email delivered successfully!');
    console.log(`   Preview: ${previewUrl}\n`);
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Welcome to Invoicon, ${name.split(' ')[0]}! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Your professional invoice workspace is ready. Create beautiful, client-ready invoices in seconds.
    </p>
    <a href="${env.CLIENT_URL}/dashboard" style="display:inline-block;background:#01019d;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.3px;">
      Open Dashboard →
    </a>
    <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;">Questions? Reply to this email and we'll help right away.</p>
  `;
  await sendMail(to, 'Welcome to Invoicon — Your workspace is ready!', brandedEmail('Welcome', body));
}

export async function sendResetPasswordEmail(to: string, resetUrl: string): Promise<void> {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Reset Your Password</h1>
    <p style="margin:0 0 8px;font-size:15px;color:#475569;line-height:1.6;">
      We received a request to reset your Invoicon password. Click the button below to set a new password.
    </p>
    <p style="margin:0 0 28px;font-size:13px;color:#94a3b8;">
      This link expires in <strong style="color:#ef4444;">1 hour</strong>. If you didn't request this, you can safely ignore this email.
    </p>
    <a href="${resetUrl}" style="display:inline-block;background:#01019d;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.3px;">
      Reset Password →
    </a>
    <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;">
      Or copy and paste this link into your browser:<br/>
      <span style="color:#6366f1;word-break:break-all;">${resetUrl}</span>
    </p>
  `;
  await sendMail(to, 'Reset your Invoicon password', brandedEmail('Password Reset', body));
}

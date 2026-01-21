import nodemailer from 'nodemailer';

// QQ 邮箱 SMTP 配置
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASS,
  },
});

// 验证邮件配置
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[Email] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[Email] SMTP connection failed:', error);
    return false;
  }
}

// 发送验证码邮件
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const mailOptions = {
    from: `"Sanctuary" <${process.env.EMAIL_USER}>`,
    to,
    subject: '【Sanctuary】登录验证码',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #fdf8f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <span style="font-size: 32px;">💕</span>
              <h1 style="margin: 10px 0 0 0; font-size: 24px; color: #4a2b2b; font-weight: 600;">Sanctuary</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #8c5a5a;">A space just for the two of you</p>
            </td>
          </tr>
          <tr>
            <td style="background: white; border-radius: 24px; padding: 40px 30px; box-shadow: 0 4px 20px rgba(172, 57, 96, 0.08);">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #2c1818; text-align: center;">Your Verification Code</h2>
              <p style="margin: 0 0 25px 0; font-size: 14px; color: #666; text-align: center;">Enter this code to sign in to your account</p>
              <div style="background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%); border-radius: 16px; padding: 25px; text-align: center;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ac3960;">${code}</span>
              </div>
              <p style="margin: 25px 0 0 0; font-size: 13px; color: #999; text-align: center;">
                This code expires in <strong>5 minutes</strong>.<br>
                If you didn't request this, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; padding-top: 30px;">
              <p style="margin: 0; font-size: 12px; color: #aaa;">
                © ${new Date().getFullYear()} Sanctuary · Made with ❤️
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Your Sanctuary verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
}

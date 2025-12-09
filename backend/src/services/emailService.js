import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'MicroSOC Command Center <onboarding@resend.dev>';

const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);

let EMAIL_DISABLED = process.env.DISABLE_EMAIL === 'true';

// Auto-disable email if provider is resend but key missing
if (EMAIL_PROVIDER === 'resend' && !RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY missing – email will be disabled');
  EMAIL_DISABLED = true;
}

// Auto-disable if SMTP creds missing for gmail/smtp
if ((EMAIL_PROVIDER === 'gmail' || EMAIL_PROVIDER === 'smtp') &&
    (!EMAIL_USER || !EMAIL_PASSWORD)) {
  console.warn('⚠️  EMAIL_USER/EMAIL_PASSWORD missing – email will be disabled');
  EMAIL_DISABLED = true;
}

console.log(`📧 Email provider: ${EMAIL_PROVIDER}${EMAIL_DISABLED ? ' (DISABLED)' : ''}`);

let resendClient = null;

if (!EMAIL_DISABLED && EMAIL_PROVIDER === 'resend') {
  resendClient = new Resend(RESEND_API_KEY);
}

/**
 * Nodemailer transporter factory (only used for gmail/smtp fallback)
 */
const createSMTPTransporter = () => {
  if (EMAIL_DISABLED) return null;

  const secure = SMTP_PORT === 465;

  if (EMAIL_SERVICE === 'gmail') {
    console.log(`📧 Mailer (fallback): Gmail for ${EMAIL_USER}`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
  }

  console.log(`📧 Mailer (fallback): SMTP ${SMTP_HOST}:${SMTP_PORT} (secure: ${secure})`);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
};

/**
 * Generate 6-digit OTP
 */
export const generateOTP = () =>
  crypto.randomInt(100000, 999999).toString();

/**
 * HTML template for OTP email
 */
const buildOtpHtml = (otp, userName = 'User') => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      }
      .header {
        background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
        color: #ffffff;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 1px;
      }
      .header p {
        margin: 8px 0 0 0;
        font-size: 14px;
        opacity: 0.95;
      }
      .content {
        padding: 40px 30px;
        color: #333333;
      }
      .greeting {
        font-size: 18px;
        color: #1e293b;
        margin-bottom: 20px;
      }
      .message {
        font-size: 15px;
        line-height: 1.6;
        color: #475569;
        margin-bottom: 30px;
      }
      .otp-container {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 2px dashed #06b6d4;
        border-radius: 10px;
        padding: 25px;
        text-align: center;
        margin: 30px 0;
      }
      .otp-label {
        font-size: 13px;
        color: #64748b;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
      }
      .otp-code {
        font-size: 42px;
        font-weight: 800;
        color: #06b6d4;
        letter-spacing: 8px;
        font-family: 'Courier New', monospace;
        margin: 10px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
      }
      .otp-validity {
        font-size: 13px;
        color: #ef4444;
        margin-top: 10px;
        font-weight: 500;
      }
      .warning {
        background: #fef2f2;
        border-left: 4px solid #ef4444;
        padding: 15px;
        margin: 25px 0;
        border-radius: 4px;
      }
      .warning-title {
        font-weight: 600;
        color: #991b1b;
        margin-bottom: 5px;
        font-size: 14px;
      }
      .warning-text {
        font-size: 13px;
        color: #7f1d1d;
        line-height: 1.5;
      }
      .footer {
        background: #f8fafc;
        padding: 25px 30px;
        text-align: center;
        border-top: 1px solid #e2e8f0;
      }
      .footer-text {
        font-size: 13px;
        color: #64748b;
        line-height: 1.6;
        margin: 0;
      }
      .badge {
        display: inline-block;
        background: #dbeafe;
        color: #1e40af;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 15px;
      }
      @media only screen and (max-width: 600px) {
        .container {
          margin: 20px;
        }
        .content {
          padding: 30px 20px;
        }
        .otp-code {
          font-size: 36px;
          letter-spacing: 6px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🛡️ MicroSOC COMMAND CENTER</h1>
        <p>Security Operations Center Platform</p>
      </div>
      
      <div class="content">
        <div class="greeting">Hello ${userName},</div>
        
        <div class="message">
          Thank you for signing up for MicroSOC Command Center! To complete your registration and verify your email address, please use the verification code below.
        </div>
        
        <div class="otp-container">
          <div class="otp-label">Your Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-validity">⏱️ Valid for 10 minutes</div>
        </div>
        
        <div class="message">
          Enter this code on the verification page to activate your account and gain access to our advanced threat detection and security analytics platform.
        </div>
        
        <div class="warning">
          <div class="warning-title">🔒 Security Notice</div>
          <div class="warning-text">
            • Never share this code with anyone<br>
            • MicroSOC staff will never ask for your verification code<br>
            • If you didn't request this code, please ignore this email
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <span class="badge">✓ Secure Email Verification</span>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          © ${new Date().getFullYear()} MicroSOC Command Center. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
`;

/**
 * HTML template for welcome email
 */
const buildWelcomeHtml = (userName = 'User') => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #ffffff; padding: 30px; text-align: center; }
      .content { padding: 40px 30px; }
      .button { display: inline-block; background: #06b6d4; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
      .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🛡️ Welcome to MicroSOC!</h1>
      </div>
      <div class="content">
        <h2>Hi ${userName},</h2>
        <p>Your account has been successfully verified! You now have access to our enterprise-grade Security Operations Center platform.</p>
        
        <h3>🚀 What's Next?</h3>
        <ul>
          <li><strong>Dashboard</strong>: Monitor real-time security events</li>
          <li><strong>Threat Detection</strong>: 7 advanced detection rules</li>
          <li><strong>AI Remediation</strong>: Get intelligent remediation guidance</li>
          <li><strong>Analytics</strong>: Comprehensive security visualizations</li>
          <li><strong>Attack Simulator</strong>: Test your SOC capabilities</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login to Dashboard</a>
        </div>
        
        <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
          Need help getting started? Check out our documentation or contact support.
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} MicroSOC Command Center. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

/**
 * Send OTP email (provider-aware)
 */
export const sendOTPEmail = async (email, otp, userName = 'User') => {
  if (EMAIL_DISABLED) {
    console.log(`📧 [EMAIL DISABLED] OTP for ${email}: ${otp}`);
    return { success: true, messageId: 'disabled', otp };
  }

  try {
    if (EMAIL_PROVIDER === 'resend') {
      const { data, error } = await resendClient.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: '🛡️ MicroSOC - Email Verification Code',
        html: buildOtpHtml(otp, userName),
      });

      if (error) throw error;

      console.log('✅ OTP email sent via Resend:', data?.id);
      return { success: true, messageId: data?.id };
    }

    // Fallback: SMTP/Gmail
    const transporter = createSMTPTransporter();
    const info = await transporter.sendMail({
      from: EMAIL_FROM || EMAIL_USER,
      to: email,
      subject: '🛡️ MicroSOC - Email Verification Code',
      html: buildOtpHtml(otp, userName),
    });

    console.log('✅ OTP email sent via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Failed to send OTP email:', err);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send welcome email (non-critical)
 */
export const sendWelcomeEmail = async (email, userName = 'User') => {
  if (EMAIL_DISABLED) {
    console.log(`📧 [EMAIL DISABLED] Welcome email skipped for ${email}`);
    return { success: true };
  }

  try {
    if (EMAIL_PROVIDER === 'resend') {
      const { data, error } = await resendClient.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: '🎉 Welcome to MicroSOC Command Center!',
        html: buildWelcomeHtml(userName),
      });

      if (error) throw error;

      console.log('✅ Welcome email sent via Resend:', data?.id);
      return { success: true, messageId: data?.id };
    }

    // Fallback SMTP/Gmail
    const transporter = createSMTPTransporter();
    const info = await transporter.sendMail({
      from: EMAIL_FROM || EMAIL_USER,
      to: email,
      subject: '🎉 Welcome to MicroSOC Command Center!',
      html: buildWelcomeHtml(userName),
    });

    console.log('✅ Welcome email sent via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Failed to send welcome email:', err);
    // Do not throw – non-critical
    return { success: false };
  }
};

/**
 * Test email configuration
 */
export const testEmailConfig = async () => {
  if (EMAIL_DISABLED) {
    console.log('⚠️ Email disabled, skipping test');
    return false;
  }

  try {
    if (EMAIL_PROVIDER === 'resend') {
      // Resend doesn't have a public verify endpoint, so just check if client exists
      if (resendClient && RESEND_API_KEY) {
        console.log('✅ Resend API key is configured');
        return true;
      }
      return false;
    }

    // SMTP verify
    const transporter = createSMTPTransporter();
    await transporter.verify();
    console.log('✅ SMTP server is ready');
    return true;
  } catch (err) {
    console.error('❌ Email server configuration error:', err.message);
    return false;
  }
};

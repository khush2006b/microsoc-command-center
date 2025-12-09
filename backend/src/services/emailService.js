import nodemailer from 'nodemailer';
import crypto from 'crypto';

const NODE_ENV = process.env.NODE_ENV || 'development';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = process.env.EMAIL_USER || process.env.MAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || process.env.MAIL_PASS;
const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587');
const EMAIL_DISABLED = process.env.DISABLE_EMAIL === 'true' || (!EMAIL_USER || !EMAIL_PASSWORD);

// Validate email configuration on startup
if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.warn('⚠️  Email configuration missing: EMAIL_USER and EMAIL_PASSWORD not set');
  console.warn('⚠️  Email functionality will be disabled. Set DISABLE_EMAIL=true to suppress this warning.');
} else {
  console.log('✅ Email service configured');
}

// Email transporter configuration
const createTransporter = () => {
  if (EMAIL_DISABLED) {
    console.warn('⚠️  Email is disabled - returning mock transporter');
    return null;
  }
  
  const SMTP_SECURE = SMTP_PORT === 465;
  
  if (EMAIL_SERVICE === 'gmail') {
    console.log(`📧 Mailer: Using Gmail for ${EMAIL_USER}`);
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD // Use App Password for Gmail
      }
    });
  }
  
  // Default: Use custom SMTP
  console.log(`📧 Mailer: Using SMTP ${SMTP_HOST}:${SMTP_PORT} (Secure: ${SMTP_SECURE})`);
  return nodemailer.createTransporter({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // For self-signed certificates
    }
  });
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp, userName = 'User') => {
  // If email is disabled, just log the OTP and return success
  if (EMAIL_DISABLED) {
    console.log(`📧 [EMAIL DISABLED] OTP for ${email}: ${otp}`);
    console.log(`⚠️  To enable email, set EMAIL_USER and EMAIL_PASSWORD environment variables`);
    return { success: true, messageId: 'disabled', otp }; // Return OTP for testing
  }
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"MicroSOC Command Center" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🛡️ MicroSOC - Email Verification Code',
      html: `
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
            .footer-link {
              color: #06b6d4;
              text-decoration: none;
              font-weight: 500;
            }
            .footer-link:hover {
              text-decoration: underline;
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
                This email was sent by <strong>MicroSOC Command Center</strong><br>
                Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" class="footer-link">${process.env.EMAIL_USER}</a>
              </p>
              <p class="footer-text" style="margin-top: 15px; font-size: 12px; color: #94a3b8;">
                © 2024 MicroSOC Command Center. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send welcome email after successful verification
export const sendWelcomeEmail = async (email, userName = 'User') => {
  // If email is disabled, just log and return success
  if (EMAIL_DISABLED) {
    console.log(`📧 [EMAIL DISABLED] Welcome email skipped for ${email}`);
    return { success: true };
  }
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"MicroSOC Command Center" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to MicroSOC Command Center!',
      html: `
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
              <p>© 2024 MicroSOC Command Center. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', email);
    
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // Don't throw error for welcome email - it's not critical
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server configuration error:', error.message);
    return false;
  }
};

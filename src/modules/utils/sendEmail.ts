import nodemailer from 'nodemailer';
import config from '../../config/config';
export interface EmailOptions {
  email: string;
  subject: string;
  type: 'verify' | 'reset';
  name: string;
  otp: number;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: Number(config.smtp.port),
    secure: true,
    auth: {
      user: config.smtp.auth.user,
      pass: config.smtp.auth.pass,
    },
  });

  const mailOptions = {
    from: `Iqbal Hossen <${config.smtp.auth.user}>`,
    to: options.email,
    subject: options.subject,
    html: genarateHtml(options.name, options.otp, options.type),
  };

  await transporter.sendMail(mailOptions);
};

const genarateHtml = (name: string, otp: number, type: 'verify' | 'reset'): string => {
  return `<html>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f6f9fc;
      font-family: sans-serif;
    "
  >
    <table
      cellpadding="0"
      cellspacing="0"
      style="width: 100%; max-width: 600px; margin: 0 auto; padding: 45px 20px"
    >
      <tr>
        <td
          style="
            background-color: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          "
        >
          <table cellpadding="0" cellspacing="0" style="width: 100%">
            <!-- Logo -->
            <tr>
              <td style="padding-bottom: 32px">
                <div style="display: flex; justify-content: center">
                  <img
                    src="https://www.shothik.ai/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fshothik_light_logo.1343d9b2.png&w=128&q=75"
                    alt="Stripe"
                    style="width: 150px"
                  />
                </div>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding-bottom: 24px">
                <h3>${type === 'reset' ? 'Forgot Password' : 'Email Varification'}</h3>
                <p>Hi, ${name}</p>
                <p
                  style="
                    margin: 0;
                    font-size: 16px;
                    line-height: 24px;
                    color: #525f7f;
                  "
                >
                  Your ${type === 'verify' ? 'email verification code' : 'reset password'} is <strong>${otp}</strong>.
                </p>
              </td>
            </tr>

            

            <!-- Help Text -->
            <tr>
              <td style="padding-bottom: 32px">
                <p
                  style="
                    margin: 0;
                    font-size: 14px;
                    line-height: 20px;
                    color: #525f7f;
                  "
                >
                  If you did not request this, please ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="border-top: 1px solid #e6ebf1; padding-top: 24px">
                <p
                  style="
                    margin: 0 0 8px;
                    font-size: 12px;
                    line-height: 16px;
                    color: #8898aa;
                  "
                >
                  Best regards, <br />
                  Shothik AI Team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export default sendEmail;

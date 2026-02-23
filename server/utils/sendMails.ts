import nodemailer, { Transporter } from "nodemailer";
import path from "path";
import ejs from "ejs";
import { MailOptions } from "nodemailer/lib/sendmail-transport";
require("dotenv").config();

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: {
    [key: string]: any;
  };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smpt.gmail.com",
    port: Number(process.env.SMTP_PORT),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, data, subject, template } = options;

  const templateUrl = path.join(__dirname, "../mails", template);

  const html: string = await ejs.renderFile(template, data);

  const mailOptions: MailOptions = {
    from: process.env.SMPT_MAIL,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendMail;

import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';

type SendNodemailSchema = {
  filepath: string;
  email: string;
  subject: string;
  replacements: any;
};

const sendNodemail = async ({
  filepath,
  email,
  subject,
  replacements,
}: SendNodemailSchema) => {
  const filePath = path.join(__dirname, filepath);
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);

  const htmlToSend = template(replacements);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GOOGLE_EMAIL,
      pass: process.env.GOOGLE_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.GOOGLE_EMAIL,
    to: email,
    subject,
    html: htmlToSend,
  };

  await transporter.sendMail(mailOptions);
};

export default sendNodemail;

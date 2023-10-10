import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async function (email, subject, message) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'immanuel49@ethereal.email',
        pass: 'hZkxXm2F5cHF4kKx8z'
    },
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: '"shashank 👻" <shashank@gmail.com>', // sender address
    to: email, // user email
    subject: subject, // Subject line
    html: message, // html body
  });
};

export default sendEmail;

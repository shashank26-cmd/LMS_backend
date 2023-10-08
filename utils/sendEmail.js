import nodemailer from "nodemailer";

//async..await is not allowed in global scope,must use a wrapper

const sendEmail=async function (email,subject,message){

//create reusable transporter object using default smtp transport

let transport = nodemailer.createTransport({ //.trnasport ke through app kuch cheese send karskte ho 
    host:process.env.SMTP_HOST,
    port:process.env.SMTP_PORT,
    secure:false,//true for 465,false for other ports
    auth:{
        //username password app koi mail send karrahe toh authentication chahiye
        user:process.env.SMTP_USERNAME,
        pass:process.env.SMTP_PASSWORD,
    },
});
//send mail  with defined transport object
await transport.sendEmail({
    from:process.env.SMTP_FROM_EMAIL,// sender address
    to:email,// user email
    subject:subject,//subject line
        html:message,//html body
});
};
 export  default sendEmail

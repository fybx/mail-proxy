const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const morgan = require("morgan");

require("dotenv").config();
const ENV = process.env.ENVIRONMENT || "TEST";
const SENDER_EMAIL = process.env.EMAIL;
const USERNAME = process.env.USERNAME || SENDER_EMAIL;
const SENDER_PASS = process.env.EMAIL_PASSWORD;
const SERV_HOST = process.env.EMAIL_HOST;
const SERV_PORT = process.env.EMAIL_PORT;

const allowedIPs = process.env.ALLOWED_IPS.split(",");

const app = express();
app.enable("trust proxy");
app.disable("x-powered-by");
app.use(express.json());
app.use(helmet());
app.use(
  morgan(
    "[ :method :url ] ~:status | :date[web] | :total-time[digits] ms | IP :remote-addr | :user-agent"
  )
);

// 10 requests per minute
const rootLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});
app.use("/", rootLimiter);

// Middleware function to check IP address
const ipFilter = (req, res, next) => {
  if (ENV === "TEST" || ENV === "TEST-MAIL") next();

  const clientIp = req.ip;

  if (allowedIPs.includes(clientIp)) {
    next();
  } else {
    res.status(403).send("Access denied");
  }
};

const transporter = nodemailer.createTransport({
  host: SERV_HOST,
  port: SERV_PORT,
  secure: true,
  auth: {
    user: USERNAME,
    pass: SENDER_PASS,
  },
});

// 1 request per minute
const mailRouteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1,
  message: "Please wait at least 1 minute before sending another request!",
});

const promiseSendingAMail = async (mail) => {
  await new Promise((resolve, reject) => {
    transporter.sendMail(mail, (err, info) => {
      if (err)  reject(err);
      else      resolve(info);
    });
  });
}

app.post("/api/mail", ipFilter, mailRouteLimiter, async (req, res) => {
  const { subject, text, recipient } = req.body;

  const mail = {
    from: `"Arbeit Mail Service" <${SENDER_EMAIL}>`,
    to: recipient,
    replyTo: "noreply@arbeit.studio",
    subject,
    text,
  };

  await new Promise((resolve, reject) => {
    transporter.verify((err, success) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.info("Server is ready to receive mails.");
        resolve(success);
      }
    })
  })

  if (ENV === "PROD") {
    try {
      const info = await promiseSendingAMail(mail);
      console.info("Sent something:", mail);
      res.status(200).json({ success: true, message: "Mail sent successfully!" });
    } catch (err) {
      console.error("Failed to send:", mail, err);
      res.status(500).json({ success: false, message: "Mail could not be sent!" });
    }
  } else {
    console.log(mail);
    if (ENV === "TEST-MAIL") {
      try {
        await promiseSendingAMail(mail);
      } catch (err) {
        console.error("Failed to send test mail:", mail, err);
      }
    }
  }
});

app.get("/api/hello", (req, res) => {
  res.status(200).json({
    message: "Close the world, .txen eht nepO",
    author: "Yigid BALABAN <fyb@fybx.dev>",
    authorHomepage: "https://fybx.dev/",
  });
});

app.listen(3313, () => {
  console.log("Server up on 3313");
});

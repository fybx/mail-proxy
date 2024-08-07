const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const morgan = require("morgan");

require("dotenv").config();
const ENV = process.env.ENVIRONMENT || "TEST";
const SENDER_EMAIL = process.env.EMAIL;
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
    user: SENDER_EMAIL,
    pass: SENDER_PASS,
  },
});

// 1 request per minute
const mailRouteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1,
  message: "Please wait at least 1 minute before sending another request!",
});

app.post("/api/mail", ipFilter, mailRouteLimiter, (req, res) => {
  const { subject, text, recipient } = req.body;

  const mail = {
    from: `"Arbeit Mail Hizmeti" <${SENDER_EMAIL}>`,
    to: recipient,
    replyTo: "noreply@arbeit.studio",
    subject,
    text,
  };

  if (ENV === "PROD") {
    if (transporter.sendMail(mail)) {
      console.info("Sent something:", mail);
      res
        .status(200)
        .json({ success: true, message: "Mail sent successfully!" });
    } else {
      console.error("Failed to send:", mail);
      res
        .status(500)
        .json({ success: false, message: "Mail could not be sent!" });
    }
  } else {
    console.log(mail);
    if (ENV === "TEST-MAIL") transporter.sendMail(mail);
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

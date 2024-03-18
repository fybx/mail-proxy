const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const ENV = process.env.ENVIRONMENT || 'TEST';
const SENDER_EMAIL = process.env.EMAIL;
const SENDER_PASS = process.env.EMAIL_PASSWORD;
const SERV_HOST = process.env.EMAIL_HOST;
const SERV_PORT = process.env.EMAIL_PORT;

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

app.enable('trust proxy');
app.disable('x-powered-by');
app.use(express.json());
app.use(helmet());

// 10 requests per minute
const rootLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
});

app.use('/', rootLimiter);

app.use(
	cors({
		origin: function (origin, callback) {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error(`Origin ${origin} is not allowed by CORS!`));
			}
		},
	})
);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        next();
    } else {
        res.status(403).json({ success: false, message: `Origin ${origin} is not allowed` });
		console.warn(`Connection refused: origin ${origin} is not allowed`);
	}
});

const transporter = nodemailer.createTransport({
	host: SERV_HOST,
	port: SERV_PORT,
	secure: true,
	auth: {
		user: SENDER_EMAIL,
		pass: SENDER_PASS,
	},
});

// 2 requests per 5 minutes
const mailRouteLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 2,
});

app.post('/api/mail', mailRouteLimiter, (req, res) => {
	const { to, subject, text } = req.body;

	const mail = {
		from: `"Arbeit Mail Hizmeti" <${SENDER_EMAIL}>`,
		to,
		replyTo: 'noreply@arbeit.studio',
		subject,
		text,
	};

	if (ENV === 'PROD') {
		if (transporter.sendMail(mail)) {
			console.info('Sent something:', mail);
			res.status(200).json({ success: true, message: 'Mail sent successfully!' });
		} else {
			console.error('Failed to send:', mail);
			res.status(500).json({ success: false, message: 'Mail could not be sent!' });
		};
	} else res.status(200).json(mail);
});

app.get('/api/hello', (req, res) => {
	res.status(200).json({ message: 'Hello, World!' });
});

app.listen(3313, () => {
	console.log('Server up on 3313');
});

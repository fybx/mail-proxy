# mail-proxy

... is a simple and secure mail service deployed at [mailer.fybx.dev](https://mailer.fybx.dev/). Provides a REST API endpoint for sending emails with built-in rate limiting and IP filtering.

## Environment Variables

```env
ENVIRONMENT=PROD|TEST|TEST-MAIL
EMAIL=sender@example.com
EMAIL_PASSWORD=your_password
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
ALLOWED_IPS=ip1,ip2,ip3
```

## POST /api/mail

Sends an email. Limited to 1 request per minute.

```json
{
  "subject": "Email Subject",
  "text": "Email Body",
  "recipient": "recipient@example.com"
}
```

## Security Features
- IP whitelist filtering
- Rate limiting (10 requests/min globally, 1 request/min for mail endpoint)
- Helmet security headers
- Trust proxy enabled

## credits

Feel free to contact me for collaboration on anything!

Yiğid BALABAN, <[fyb@fybx.dev][llmail]>

[My Website][llwebsite] • [My Bento][llbento] • [X][llx] • [LinkedIn][lllinkedin]

2024

[llmail]: mailto:fyb@fybx.dev
[llwebsite]: https://fybx.dev
[llbento]: https://bento.me/balaban
[llx]: https://x.com/fybalaban
[lllinkedin]: https://linkedin.com/in/fybx

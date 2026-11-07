# SendGrid setup

The server uses SendGrid's Mail Send API when `SENDGRID_API_KEY` is configured. If it is absent, delivery continues through the existing SMTP configuration. A configured SendGrid request that fails is recorded as failed and is not silently retried through SMTP.

## Configure

1. Create a SendGrid API key with permission to send mail.
2. Verify the sender address/domain in SendGrid.
3. Set these server environment variables in the hosting provider:
   - `SENDGRID_API_KEY`: secret API key.
   - `FROM_EMAIL`: verified sender address.
   - `FROM_NAME`: optional sender display name.
   - `ADMIN_EMAIL`: address for administrative reports and review messages.
4. Keep `SENDGRID_API_KEY` out of source control and frontend environment variables. `.env.example` contains no live credential.
5. Redeploy/restart the server and send a test only to an address you control. Check SendGrid Email Activity for delivery, opens, clicks, and bounces; tracking metrics depend on SendGrid settings and recipient behavior.

SendGrid delivery supports the existing plain-text/HTML messages, reply-to addresses, and file attachments. Email logs retain delivery metadata only, not message bodies or attachment contents. The recipient address and subject are part of the existing metadata log.

Do not configure `SENDGRID_API_KEY` until the sender is verified and the key is available in the hosting secret store. If SendGrid returns an error, the application records the failed attempt and reports the error to the caller; it does not switch providers implicitly.

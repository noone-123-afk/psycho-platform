const nodemailer = require('nodemailer');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const EmailLog = require('../models/EmailLog');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function emailLayout({ language = 'ar', title, body, settingsUrl }) {
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    const brand = language === 'ar' ? 'بوصلة النفس' : 'Soul Compass';
    const settingsText = language === 'ar'
        ? 'إدارة تفضيلات البريد الإلكتروني'
        : 'Manage email preferences';
    return `<!doctype html>
<html lang="${language}" dir="${direction}">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="margin:0;padding:24px;background:#f5f3ee;font-family:Arial,Tahoma,sans-serif;color:#24312b">
    <main style="max-width:600px;margin:auto;padding:32px;background:#fff;border:1px solid #e6e2d9;border-radius:16px">
      <p style="color:#547863;font-weight:bold">${brand}</p>
      <h1 style="color:#253b31;font-size:24px">${title}</h1>
      <div style="font-size:16px;line-height:1.9">${body}</div>
      ${settingsUrl ? `<p style="margin-top:28px;font-size:13px"><a href="${escapeHtml(settingsUrl)}" style="color:#547863">${settingsText}</a></p>` : ''}
    </main>
  </body>
</html>`;
}

function createTransporter() {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER?.trim();
    const password = process.env.SMTP_PASSWORD;
    const from = process.env.FROM_EMAIL?.trim() || user;
    const fromName = process.env.FROM_NAME?.trim() || 'بوصلة النفس';

    if (
        !host || !Number.isInteger(port) || port < 1 || port > 65535 ||
        !user || !password || !from || !EMAIL_PATTERN.test(from) ||
        /[\r\n]/.test(fromName)
    ) {
        throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and valid sender settings are required');
    }

    return {
        transporter: nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            requireTLS: port !== 465,
            auth: { user, pass: password }
        }),
        from: `"${fromName.replace(/["\\]/g, '')}" <${from}>`
    };
}

function getSendGridSender() {
    const apiKey = process.env.SENDGRID_API_KEY?.trim();
    const from = process.env.FROM_EMAIL?.trim().toLowerCase();
    const fromName = process.env.FROM_NAME?.trim() || 'بوصلة النفس';
    if (!apiKey || !from || !EMAIL_PATTERN.test(from) || /[\r\n]/.test(fromName)) {
        throw new Error('SENDGRID_API_KEY and a valid verified FROM_EMAIL are required');
    }
    return { apiKey, from, fromName };
}

async function sendWithSendGrid({ to, subject, ...message }) {
    const { apiKey, from, fromName } = getSendGridSender();
    const content = [];
    if (typeof message.text === 'string' && message.text) {
        content.push({ type: 'text/plain', value: message.text });
    }
    if (typeof message.html === 'string' && message.html) {
        content.push({ type: 'text/html', value: message.html });
    }
    if (content.length === 0) {
        throw new Error('Email must include plain-text or HTML content');
    }

    const attachments = [];
    for (const attachment of message.attachments || []) {
        let data;
        if (typeof attachment.content === 'string' || Buffer.isBuffer(attachment.content)) {
            data = Buffer.from(attachment.content);
        } else if (attachment.path) {
            data = await fs.readFile(attachment.path);
        } else {
            throw new Error('Email attachment must provide content or a file path');
        }
        attachments.push({
            content: data.toString('base64'),
            filename: attachment.filename || 'attachment',
            type: attachment.contentType || attachment.type || 'application/octet-stream',
            disposition: attachment.disposition || 'attachment'
        });
    }

    const payload = {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: fromName },
        subject,
        content,
        ...(message.replyTo ? { reply_to: { email: message.replyTo } } : {}),
        ...(attachments.length ? { attachments } : {})
    };
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
        const error = new Error(`SendGrid request failed with status ${response.status}`);
        error.code = `SENDGRID_HTTP_${response.status}`;
        throw error;
    }
}

async function logDelivery({ to, subject, kind, status, error, userId, idempotencyKey }) {
    await EmailLog.create({
        toEmail: to,
        subject,
        kind,
        idempotencyKey,
        status,
        errorCode: String(error?.code || error?.name || 'EmailError').slice(0, 100),
        user: userId || null
    });
}

async function sendTrackedEmail({ to, subject, kind, userId, idempotencyKey, ...message }) {
    const recipient = typeof to === 'string' ? to.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(recipient)) {
        throw new Error('A valid recipient email address is required');
    }
    if (typeof subject !== 'string' || !subject.trim() || /[\r\n]/.test(subject)) {
        throw new Error('Email subject must be a non-empty single line');
    }
    if (idempotencyKey) {
        const alreadySent = await EmailLog.findOne({
            idempotencyKey,
            status: 'sent'
        }).lean();
        if (alreadySent) {
            return;
        }
    }

    try {
        if (process.env.SENDGRID_API_KEY?.trim()) {
            await sendWithSendGrid({ ...message, to: recipient, subject });
        } else {
            const { transporter, from } = createTransporter();
            await transporter.sendMail({ ...message, from, to: recipient, subject });
        }
    } catch (error) {
        try {
            await logDelivery({
                to: recipient,
                subject,
                kind,
                status: 'failed',
                error,
                userId,
                idempotencyKey
            });
        } catch (loggingError) {
            console.error('Failed to record email delivery failure:', loggingError.message);
        }
        throw error;
    }

    await logDelivery({ to: recipient, subject, kind, status: 'sent', userId, idempotencyKey });
}

function getFrontendPath(pathname) {
    const frontendUrl = process.env.FRONTEND_URL?.trim();
    if (!frontendUrl || !/^https?:\/\/[^/]+/i.test(frontendUrl)) {
        throw new Error('FRONTEND_URL must be an absolute HTTP(S) URL');
    }
    const parsedUrl = new URL(frontendUrl);
    if (parsedUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
        throw new Error('FRONTEND_URL must use HTTPS outside local development');
    }
    return new URL(pathname, parsedUrl).toString();
}

function getSettingsUrl() {
    return getFrontendPath('/settings');
}

function buildVerificationUrl(token) {
    const verificationUrl = new URL(getFrontendPath('/verify-email'));
    verificationUrl.searchParams.set('token', token);
    return verificationUrl.toString();
}

async function sendVerificationEmail(toEmail, userName, userId, verificationUrl, language = 'ar') {
    const english = language === 'en';
    const parsedUrl = new URL(verificationUrl);
    if (
        !['http:', 'https:'].includes(parsedUrl.protocol) ||
        (parsedUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) ||
        parsedUrl.pathname !== '/verify-email'
    ) {
        throw new Error('Verification link must use the configured frontend HTTPS origin');
    }
    const safeUrl = escapeHtml(parsedUrl.toString());
    const safeName = escapeHtml(userName);
    const title = english ? `Verify your email, ${safeName}` : `تأكيد بريدك الإلكتروني يا ${safeName}`;
    const body = english
        ? `<p>Use this link to verify your email and activate your account:</p><p><a href="${safeUrl}" style="color:#547863">Verify email address</a></p><p>This link expires in 24 hours.</p>`
        : `<p>استخدم الرابط التالي لتأكيد بريدك وتفعيل حسابك:</p><p><a href="${safeUrl}" style="color:#547863">تأكيد البريد الإلكتروني</a></p><p>تنتهي صلاحية الرابط خلال 24 ساعة.</p>`;
    await sendTrackedEmail({
        to: toEmail,
        subject: english ? 'Verify your Soul Compass email' : 'أكد بريدك الإلكتروني في بوصلة النفس',
        kind: 'email_verification',
        userId,
        idempotencyKey: `verification-${userId}-${crypto.createHash('sha256').update(parsedUrl.searchParams.get('token') || '').digest('hex')}`,
        html: emailLayout({ language: english ? 'en' : 'ar', title, body }),
        text: english
            ? `Hello ${userName}, verify your account: ${parsedUrl.toString()}`
            : `مرحباً ${userName}، أكد حسابك من الرابط: ${parsedUrl.toString()}`
    });
}

async function sendWelcomeEmail(toEmail, userName, userId, language = 'ar') {
    const english = language === 'en';
    const title = english ? `Welcome, ${escapeHtml(userName)}` : `مرحباً، ${escapeHtml(userName)}`;
    const assessmentUrl = escapeHtml(getFrontendPath('/assessment'));
    const body = english
        ? `<p>Thank you for joining Soul Compass. You can start your self-reflection assessment whenever you are ready.</p><p><a href="${assessmentUrl}" style="color:#547863">Start your assessment</a></p>`
        : `<p>شكراً لانضمامك إلى بوصلة النفس. يمكنك بدء التقييم التأملي متى كنت مستعداً.</p><p><a href="${assessmentUrl}" style="color:#547863">ابدأ التقييم</a></p>`;
    await sendTrackedEmail({
        to: toEmail,
        subject: english ? 'Welcome to Soul Compass' : 'مرحباً بك في بوصلة النفس',
        kind: 'welcome',
        userId,
        idempotencyKey: `welcome-${userId}`,
        html: emailLayout({ language: english ? 'en' : 'ar', title, body, settingsUrl: getSettingsUrl() }),
        text: english
            ? `Welcome, ${userName}. Thank you for joining Soul Compass.`
            : `مرحباً ${userName}. شكراً لانضمامك إلى بوصلة النفس.`
    });
}

async function sendFollowUpEmail(toEmail, userName, userId, language = 'ar', assessmentId) {
    const english = language === 'en';
    const title = english ? `How is your journey going, ${escapeHtml(userName)}?` : `كيف تسير رحلتك يا ${escapeHtml(userName)}؟`;
    const body = english
        ? '<p>We are checking in after your report. Remember, meaningful change can begin with one small step.</p>'
        : '<p>نطمئن عليك بعد استلام تقريرك. تذكّر أن التغيير الهادف يمكن أن يبدأ بخطوة صغيرة.</p>';
    await sendTrackedEmail({
        to: toEmail,
        subject: english ? 'A check-in from Soul Compass' : 'متابعة بعد استلام تقريرك',
        kind: 'follow_up',
        userId,
        idempotencyKey: assessmentId ? `follow-up-${assessmentId}` : undefined,
        html: emailLayout({ language: english ? 'en' : 'ar', title, body, settingsUrl: getSettingsUrl() }),
        text: english
            ? `Hello ${userName}, we are checking in after your report.`
            : `مرحباً ${userName}، نطمئن عليك بعد استلام تقريرك.`
    });
}

async function sendScheduledFollowupReminderEmail({
    email,
    name,
    userId,
    language = 'ar',
    followupNumber,
    followupId
}) {
    const english = language === 'en';
    const title = english
        ? `Your follow-up assessment is ready, ${escapeHtml(name)}`
        : `حان موعد تقييم المتابعة يا ${escapeHtml(name)}`;
    const followupUrl = escapeHtml(getFrontendPath('/followup'));
    const body = english
        ? `<p>Follow-up assessment ${followupNumber} of 3 is now available. You can complete it whenever you are ready.</p><p><a href="${followupUrl}" style="color:#547863">Open follow-up assessments</a></p>`
        : `<p>أصبح تقييم المتابعة رقم ${followupNumber} متاحاً الآن. يمكنك إكماله عندما تكون مستعداً.</p><p><a href="${followupUrl}" style="color:#547863">عرض التقييمات الدورية</a></p>`;

    await sendTrackedEmail({
        to: email,
        subject: english ? 'Your follow-up assessment is ready' : 'حان موعد تقييم المتابعة',
        kind: 'followup_assessment_reminder',
        userId,
        idempotencyKey: `followup-reminder-${followupId}`,
        html: emailLayout({
            language: english ? 'en' : 'ar',
            title,
            body,
            settingsUrl: getSettingsUrl()
        }),
        text: english
            ? `Hello ${name}, follow-up assessment ${followupNumber} is now available: ${getFrontendPath('/followup')}`
            : `مرحباً ${name}، تقييم المتابعة رقم ${followupNumber} متاح الآن: ${getFrontendPath('/followup')}`
    });
}

async function sendFeedbackToAdmin(userEmail, subject, message) {
    if (!ADMIN_EMAIL || !EMAIL_PATTERN.test(ADMIN_EMAIL)) {
        throw new Error('ADMIN_EMAIL must be configured to receive feedback');
    }
    const visitorEmail = typeof userEmail === 'string' && EMAIL_PATTERN.test(userEmail)
        ? userEmail
        : undefined;
    const text = `رسالة جديدة من الموقع:\n\nالبريد الإلكتروني للزائر: ${visitorEmail || 'غير معروف'}\n\nالرسالة:\n${message}`;
    await sendTrackedEmail({
        to: ADMIN_EMAIL,
        subject: `رسالة من زائر: ${String(subject || 'ملاحظة عامة').slice(0, 400)}`,
        kind: 'feedback',
        replyTo: visitorEmail,
        text
    });
}

async function sendStatsReport(period, statsData) {
    if (!ADMIN_EMAIL || !EMAIL_PATTERN.test(ADMIN_EMAIL)) {
        throw new Error('ADMIN_EMAIL must be configured to receive reports');
    }
    await sendTrackedEmail({
        to: ADMIN_EMAIL,
        subject: `تقرير إحصائيات الموقع - ${period}`,
        kind: 'stats_report',
        text: `تقرير ${period} للموقع:\n\n${JSON.stringify(statsData, null, 2)}`
    });
}

async function sendBookForAdminReview(assessmentId, userEmail, pdfPath, userId) {
    if (!ADMIN_EMAIL || !EMAIL_PATTERN.test(ADMIN_EMAIL)) {
        throw new Error('ADMIN_EMAIL must be configured to receive book reviews');
    }
    await sendTrackedEmail({
        to: ADMIN_EMAIL,
        subject: `مراجعة كتاب جديد - ${assessmentId}`,
        kind: 'book_review',
        userId,
        text: `تم تجهيز مسودة كتاب لمراجعتها. رقم التقييم: ${assessmentId}.\nبريد المستخدم: ${userEmail}`,
        attachments: [{ filename: 'Draft_Book_For_Review.pdf', path: pdfPath }]
    });
}

async function sendFinalBookToUser(userEmail, userName, pdfPath, userId, language = 'ar', assessmentId) {
    const english = language === 'en';
    const title = english ? `Your report is ready, ${escapeHtml(userName)}` : `تقريرك جاهز يا ${escapeHtml(userName)}`;
    const body = english
        ? '<p>Your personalized PDF report is attached to this email.</p>'
        : '<p>أرفقنا تقريرك الشخصي بصيغة PDF بهذه الرسالة.</p>';
    await sendTrackedEmail({
        to: userEmail,
        subject: english ? 'Your self-reflection report is ready' : 'تقريرك الشخصي جاهز',
        kind: 'book_ready',
        userId,
        idempotencyKey: assessmentId ? `book-ready-${assessmentId}` : undefined,
        html: emailLayout({ language: english ? 'en' : 'ar', title, body, settingsUrl: getSettingsUrl() }),
        text: english
            ? `Hello ${userName}, your personalized PDF report is attached.`
            : `مرحباً ${userName}، أرفقنا تقريرك الشخصي بصيغة PDF.`,
        attachments: [{ filename: 'Your_Personalized_Report.pdf', path: pdfPath }]
    });
}

module.exports = {
    sendFeedbackToAdmin,
    sendStatsReport,
    sendFollowUpEmail,
    sendScheduledFollowupReminderEmail,
    sendBookForAdminReview,
    sendFinalBookToUser,
    sendTrackedEmail,
    sendWithSendGrid,
    sendVerificationEmail,
    buildVerificationUrl,
    escapeHtml
};

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    return res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? 'ok' : 'unavailable'
    });
});

// Routes
const paymentRoutes = require('./routes/payment');
const assessmentRoutes = require('./routes/assessment');
const feedbackRoutes = require('./routes/feedback');
const userFeaturesRoutes = require('./routes/userFeatures');
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const crisisReportRoutes = require('./routes/crisisReports');
const adminRoutes = require('./routes/admin');
const followupRoutes = require('./routes/followups');
const paypalWebhookRoutes = require('./routes/webhooks');

app.use('/api/webhooks', paypalWebhookRoutes);
app.use('/api/auth', authRoutes);
app.post('/api/register', authRoutes.registerUser);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/user', userFeaturesRoutes);
app.use('/api/crisis-reports', crisisReportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/followup', followupRoutes);

const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'temp'))) {
    fs.mkdirSync(path.join(__dirname, 'temp'));
}

// إعداد الخادم ليعمل مع ملفات الواجهة الأمامية (React) في بيئة الإنتاج أو التطوير المحلي
app.use(express.static(path.join(__dirname, 'client/dist')));

// تحويل أي مسار غير موجود في الـ API إلى واجهة React
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
});

// إعداد مهمة المتابعة، مع احترام تفضيلات كل مستخدم وتسجيل كل رسالة.
const cron = require('node-cron');
const Assessment = require('./models/Assessment');
const { sendFollowUpEmail } = require('./services/emailService');
const { processDueFollowupReminders } = require('./services/followupReminderService');
const { seedQuestionCatalog } = require('./services/questionCatalog');
const User = require('./models/User');
const { hashPassword } = require('./utils/passwords');

async function provisionAdministrator() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        console.warn('Administrator account was not provisioned; set ADMIN_EMAIL and ADMIN_PASSWORD');
        return;
    }
    if (password.length < 12 || Buffer.byteLength(process.env.AUTH_TOKEN_SECRET || '', 'utf8') < 32) {
        throw new Error('ADMIN_PASSWORD must be at least 12 characters and AUTH_TOKEN_SECRET at least 32 bytes');
    }
    await User.updateMany(
        { adminRole: 'owner', email: { $ne: email } },
        { $set: { isAdmin: false, adminRole: null } }
    );
    await User.findOneAndUpdate(
        { email },
        {
            $set: {
                isAdmin: true,
                adminRole: 'owner',
                emailVerified: true,
                passwordHash: await hashPassword(password)
            },
            $setOnInsert: {
                name: 'Administrator',
                language: 'ar'
            }
        },
        { upsert: true, new: true, runValidators: true }
    );
}

cron.schedule('0 12 * * *', async () => {
    try {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const assessments = await Assessment.find({
            isPaid: true,
            status: { $in: ['approved', 'delivered'] },
            followUp7DaysSent: false,
            paidAt: { $lte: cutoff }
        }).populate('user', 'name email language notificationPreferences');

        for (const assessment of assessments) {
            const user = assessment.user;
            const staleClaim = new Date(Date.now() - 30 * 60 * 1000);
            const claimedAssessment = await Assessment.findOneAndUpdate(
                {
                    _id: assessment.id,
                    followUp7DaysSent: false,
                    $or: [
                        { followUp7DaysSendingAt: { $exists: false } },
                        { followUp7DaysSendingAt: { $lt: staleClaim } }
                    ]
                },
                { $set: { followUp7DaysSendingAt: new Date() } },
                { new: true }
            );
            if (!claimedAssessment) {
                continue;
            }
            if (!user || user.notificationPreferences?.followUpEmails === false) {
                if (user) {
                    await Assessment.updateOne(
                        { _id: claimedAssessment.id },
                        { $set: { followUp7DaysSent: true }, $unset: { followUp7DaysSendingAt: 1 } }
                    );
                } else {
                    await Assessment.updateOne(
                        { _id: claimedAssessment.id },
                        { $unset: { followUp7DaysSendingAt: 1 } }
                    );
                }
                continue;
            }
            try {
                await sendFollowUpEmail(user.email, user.name, user.id, user.language, claimedAssessment.id);
                await Assessment.updateOne(
                    { _id: claimedAssessment.id },
                    { $set: { followUp7DaysSent: true }, $unset: { followUp7DaysSendingAt: 1 } }
                );
            } catch (error) {
                await Assessment.updateOne(
                    { _id: claimedAssessment.id },
                    { $unset: { followUp7DaysSendingAt: 1 } }
                );
                console.error(`Follow-up email failed for assessment ${assessment.id}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Follow-up email job failed:', error.message);
    }
});

cron.schedule('*/15 * * * *', async () => {
    try {
        await processDueFollowupReminders();
    } catch (error) {
        console.error('Scheduled follow-up reminder job failed:', error.message);
    }
});

// تحديد المنفذ ورابط قاعدة البيانات
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/psycho_platform';

// 1. تشغيل الخادم وفتح المنفذ فوراً لكي تستجيب منصة Render ولا يحدث Timeout
app.listen(PORT, () => {
    console.log(`الخادم يعمل بنجاح على المنفذ ${PORT}`);
});

// 2. الاتصال بقاعدة البيانات MongoDB في الخلفية
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
    const seedResult = await seedQuestionCatalog();
    console.log(`تم تجهيز بنك الأسئلة: ${seedResult.questionCount} سؤالاً.`);
    await Promise.all([
        require('./models/CrisisReport').createIndexes(),
        require('./models/AdminAction').createIndexes(),
        require('./models/FollowupAssessment').createIndexes(),
        require('./models/FollowupReminder').createIndexes(),
        require('./models/WebhookEvent').createIndexes()
    ]);
    await provisionAdministrator();
  })
  .catch((error) => {
    console.error('Application startup initialization failed:', error.message);
  });
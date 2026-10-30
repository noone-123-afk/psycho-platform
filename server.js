const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const paymentRoutes = require('./routes/payment');
const assessmentRoutes = require('./routes/assessment');
const feedbackRoutes = require('./routes/feedback');
const userFeaturesRoutes = require('./routes/userFeatures');

app.use('/api/payment', paymentRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/user', userFeaturesRoutes);

// إعداد الخادم ليعمل مع ملفات الواجهة الأمامية (React) في بيئة الإنتاج
if (process.env.NODE_ENV === 'production') {
    // تحديد مجلد البناء الخاص بـ React
    app.use(express.static(path.join(__dirname, 'client/dist')));

    // تحويل أي مسار غير موجود في الـ API إلى واجهة React
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('مرحباً بك في منصة التحليل النفسي والاجتماعي (بيئة التطوير)');
    });
}

// إعداد مهام مجدولة (Cron Jobs) لإرسال التقارير للإدارة
const cron = require('node-cron');
const { sendStatsReport, sendFollowUpEmail } = require('./services/emailService');

// تقرير يومي (يعمل الساعة 11:59 مساءً كل يوم)
cron.schedule('59 23 * * *', async () => {
    // في الواقع، ستقوم بجلب هذه البيانات من قاعدة البيانات
    const mockStats = { visitors: 150, booksGenerated: 12, topSection: 'اختبار القلق' };
    await sendStatsReport('اليومي', mockStats);
});

// تقرير شهري (يعمل يوم 1 من كل شهر)
cron.schedule('0 0 1 * *', async () => {
    const mockStats = { visitors: 4500, booksGenerated: 320, topSection: 'تحليل الشخصية الشامل' };
    await sendStatsReport('الشهري', mockStats);
});

// إرسال إيميل متابعة آلي بعد 7 أيام من شراء الكتاب
cron.schedule('0 12 * * *', async () => {
    console.log("جاري فحص المستخدمين الذين أتموا 7 أيام لإرسال إيميل المتابعة...");
    // هنا يتم جلب المستخدمين من قاعدة البيانات:
    // Assessment.find({ createdAt: { $lte: sevenDaysAgo }, followUp7DaysSent: false, paymentType: { $ne: 'none' } })
    // ومن ثم استخدام دالة sendFollowUpEmail الموجودة في emailService
});

// الاتصال بقاعدة البيانات وبدء الخادم
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/psycho_platform';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
    app.listen(PORT, () => {
      console.log(`الخادم يعمل على المنفذ ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('خطأ في الاتصال بقاعدة البيانات:', error.message);
  });

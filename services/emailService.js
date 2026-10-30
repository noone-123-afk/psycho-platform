const nodemailer = require('nodemailer');

// إعداد خدمة البريد الإلكتروني
// ملاحظة: يجب وضع بيانات المرور الخاصة بالإيميل في ملف .env
// باستخدام كلمات مرور التطبيقات (App Passwords) من حساب جوجل
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your_email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_app_password'
    }
});

const ADMIN_EMAIL = 'one497303@gmail.com';

// دالة لإرسال رسائل الملاحظات والتقييمات للإدارة
async function sendFeedbackToAdmin(userEmail, subject, message) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ADMIN_EMAIL,
            replyTo: userEmail,
            subject: `رسالة من زائر: ${subject}`,
            text: `رسالة جديدة من الموقع:\n\nالبريد الإلكتروني للزائر: ${userEmail}\n\nالرسالة:\n${message}`
        };
        await transporter.sendMail(mailOptions);
        console.log('تم إرسال رسالة الزائر إلى الإدارة');
    } catch (error) {
        console.error('خطأ في إرسال البريد:', error);
    }
}

// دالة لإرسال تقارير الإحصائيات (يومية/شهرية/سنوية)
async function sendStatsReport(period, statsData) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ADMIN_EMAIL,
            subject: `تقرير إحصائيات الموقع - ${period}`,
            text: `مرحباً،\n\nإليك التقرير ${period} للموقع:\n\n${JSON.stringify(statsData, null, 2)}\n\nبالتوفيق!`
        };
        await transporter.sendMail(mailOptions);
        console.log(`تم إرسال تقرير الإحصائيات (${period}) للإدارة`);
    } catch (error) {
        console.error('خطأ في إرسال تقرير الإحصائيات:', error);
    }
}

// دالة لإرسال إيميل المتابعة (بعد 7 أيام)
async function sendFollowUpEmail(userEmail, userName) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `كيف تسير رحلتك يا ${userName}؟`,
            text: `مرحباً ${userName}،\n\nلقد مر أسبوع منذ أن استلمت كتابك المخصص. أردنا فقط أن نطمئن عليك ونسألك: هل بدأت بتطبيق النصائح الموجودة في فصل "خارطة الطريق"؟\n\nتذكر دائماً أن التغيير يبدأ بخطوة صغيرة.\n\nنتمنى لك يوماً مليئاً بالسلام الداخلي.`
        };
        await transporter.sendMail(mailOptions);
        console.log(`تم إرسال إيميل المتابعة بنجاح إلى ${userEmail}`);
    } catch (error) {
        console.error('خطأ في إرسال إيميل المتابعة:', error);
    }
}

// دالة لإرسال الكتاب المبدئي للإدارة للمراجعة والجودة
async function sendBookForAdminReview(assessmentId, userEmail, pdfPath) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ADMIN_EMAIL,
            subject: `مراجعة كتاب جديد - التقييم رقم: ${assessmentId}`,
            text: `مرحباً،\n\nتم توليد كتاب جديد للمستخدم (${userEmail}).\nالرجاء مراجعة المرفق للتأكد من جودة المحتوى ومطابقته للمعايير.\n\nلتعديل الكتاب، يرجى الدخول إلى لوحة تحكم الإدارة وتعديل التقييم رقم: ${assessmentId}\nبعد الاعتماد سيتم إرساله تلقائياً للعميل.`,
            attachments: [{ filename: 'Draft_Book_For_Review.pdf', path: pdfPath }]
        };
        await transporter.sendMail(mailOptions);
        console.log('تم إرسال الكتاب للمراجعة إلى الإدارة');
    } catch (error) {
        console.error('خطأ في إرسال كتاب المراجعة:', error);
    }
}

// دالة لإرسال الكتاب النهائي المعتمد للعميل
async function sendFinalBookToUser(userEmail, userName, pdfPath) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `كتابك المخصص جاهز الآن يا ${userName}!`,
            text: `مرحباً ${userName}،\n\nلقد أتم خبراؤنا مراجعة وتجهيز كتابك المخصص بعناية لضمان أعلى جودة ممكنة.\nتجد نسختك الرقمية مرفقة في هذا الإيميل.\n\nنتمنى لك قراءة ممتعة ورحلة موفقة نحو التغيير الإيجابي.`,
            attachments: [{ filename: 'Your_Personalized_Book.pdf', path: pdfPath }]
        };
        await transporter.sendMail(mailOptions);
        console.log('تم إرسال الكتاب النهائي للمستخدم');
    } catch (error) {
        console.error('خطأ في إرسال الكتاب النهائي:', error);
    }
}

module.exports = { 
    sendFeedbackToAdmin, 
    sendStatsReport, 
    sendFollowUpEmail, 
    sendBookForAdminReview, 
    sendFinalBookToUser 
};

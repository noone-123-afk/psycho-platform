const express = require('express');
const router = express.Router();
const { sendFeedbackToAdmin } = require('../services/emailService');

// مسار لاستقبال رسائل الزوار والملاحظات
router.post('/submit', async (req, res) => {
    const { email, subject, message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: 'نص الرسالة مطلوب' });
    }

    try {
        // إرسال الرسالة إلى بريد الإدارة (one497303@gmail.com)
        await sendFeedbackToAdmin(email || 'غير معروف', subject || 'ملاحظة عامة', message);
        
        res.json({ success: true, message: 'تم إرسال رسالتك بنجاح، شكراً لتواصلك معنا.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال الرسالة' });
    }
});

module.exports = router;

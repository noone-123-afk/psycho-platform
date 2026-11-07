const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const EmailLog = require('../models/EmailLog');
const CrisisReport = require('../models/CrisisReport');
const FollowupAssessment = require('../models/FollowupAssessment');
const FollowupReminder = require('../models/FollowupReminder');
const { requireAuth } = require('../middleware/auth');
const fs = require('node:fs/promises');
const path = require('node:path');

// مسار 1: "التدمير الذاتي للبيانات"
router.delete('/self-destruct/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;
    if (userId !== req.authUser.id) {
        return res.status(403).json({ success: false, message: 'يمكنك حذف حسابك وبياناتك فقط.' });
    }

    try {
        const assessments = await Assessment.find({ user: userId }).select('_id').lean();
        const generatedFiles = assessments.flatMap(({ _id }) => [
            `draft_${_id}.pdf`,
            `draft_rel_${_id}.pdf`,
            `final_${_id}.pdf`
        ]);
        await Promise.all(generatedFiles.map((fileName) =>
            fs.rm(path.join(__dirname, '..', 'temp', fileName), { force: true })
        ));
        await Assessment.deleteMany({ user: userId });
        await CrisisReport.deleteMany({ user: userId });
        await FollowupAssessment.deleteMany({ user: userId });
        await FollowupReminder.deleteMany({ user: userId });
        await EmailLog.updateMany(
            { user: userId },
            { $set: { user: null, toEmail: 'deleted@redacted.invalid' } }
        );

        await User.findByIdAndDelete(userId);

        res.json({ 
            success: true, 
            message: "تم تنفيذ التدمير الذاتي. لقد تم محو جميع بياناتك، حسابك، واختباراتك من خوادمنا بشكل نهائي ولا رجعة فيه." 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "حدث خطأ أثناء محاولة مسح البيانات." });
    }
});

// مسار 2: شراء "كود هدية" لصديق
router.post('/buy-gift', async (req, res) => {
    // يحاكي هذا المسار قيام شخص بالدفع وإصدار رابط/كود لصديقه
    const { buyerName, buyerEmail, giftMessage } = req.body;
    
    // إنشاء كود هدية فريد (يتم التحقق منه لاحقاً عند استخدام الصديق للموقع)
    const giftCode = 'GIFT-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // هنا يتم الاتصال بـ PayPal للدفع (تم تجاوز هذه الخطوة هنا للتبسيط)

    res.json({
        success: true,
        message: "تم شراء الهدية بنجاح!",
        giftCode: giftCode,
        giftLink: `https://your-website.com/start?giftCode=${giftCode}`,
        instructions: "أرسل هذا الرابط لصديقك. بمجرد إتمامه للاختبار، سيحصل على كتابه المخصص مجاناً!"
    });
});

module.exports = router;

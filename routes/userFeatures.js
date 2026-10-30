const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Assessment = require('../models/Assessment');

// مسار 1: "التدمير الذاتي للبيانات"
router.delete('/self-destruct/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // 1. حذف جميع تقييمات وكتب المستخدم من قاعدة البيانات
        await Assessment.deleteMany({ user: userId });
        
        // ملاحظة: في بيئة الإنتاج الفعلية يجب مسح ملفات الـ PDF المرتبطة به من مجلد /temp أو /uploads أيضاً
        // باستخدام fs.unlinkSync(filePath)

        // 2. حذف حساب المستخدم نفسه
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

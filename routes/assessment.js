const express = require('express');
const router = express.Router();
const { generateBookletContent, generateRelationshipBookletContent } = require('../services/aiEngine');
const { createPDFBooklet } = require('../utils/pdfGenerator');
const { sendBookForAdminReview, sendFinalBookToUser } = require('../services/emailService');
const Assessment = require('../models/Assessment');
const path = require('path');
const fs = require('node:fs/promises');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validateAssessmentAnswers } = require('../services/assessmentProfile');

async function prepareAdminReviewCopy(assessment, userEmail, userName, userId, language) {
    try {
        const outputPath = path.join(__dirname, '..', 'temp', `draft_${assessment.id}.pdf`);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await createPDFBooklet(assessment.bookContentRaw, userName, outputPath, language);
        await sendBookForAdminReview(assessment.id, userEmail, outputPath, userId);
    } catch (error) {
        console.error(`Assessment ${assessment.id} was saved, but admin review delivery failed:`, error.message);
    }
}

router.post('/generate-book', requireAuth, async (req, res) => {
    const { answers } = req.body;
    const { id: userId, name: userName, email: userEmail } = req.authUser;
    const validation = validateAssessmentAnswers(answers);
    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            message: req.authUser.language === 'en'
                ? validation.message
                : 'يرجى الإجابة عن جميع أسئلة التقييم واستخدام إجابات صالحة.'
        });
    }

    try {
        const language = req.authUser.language === 'en' ? 'en' : 'ar';
        const bookContent = await generateBookletContent({ name: userName, language }, answers);

        const newAssessment = new Assessment({
            user: userId,
            answers: answers,
            bookContentRaw: bookContent,
            status: 'pending_review'
        });
        await newAssessment.save();

        void prepareAdminReviewCopy(newAssessment, userEmail, userName, userId, language);

        return res.json({
            success: true,
            assessmentId: newAssessment.id,
            message: language === 'en'
                ? 'Your responses were saved and your personalized reflection is ready.'
                : 'تم حفظ إجاباتك وتجهيز قراءتك التأملية المخصصة.',
            freePreview: bookContent.free_preview
        });

    } catch (error) {
        console.error('Assessment generation failed:', error.message);
        return res.status(500).json({
            success: false,
            message: req.authUser.language === 'en'
                ? 'We could not save your assessment. Your answers are still on this page; please try again.'
                : 'تعذر حفظ التقييم. إجاباتك ما زالت محفوظة في الصفحة، يرجى المحاولة مرة أخرى.'
        });
    }
});

// مسار للإدارة: تعديل نص الكتاب قبل الاعتماد
router.put('/admin/edit-book/:assessmentId', requireAuth, requireAdmin, async (req, res) => {
    const { assessmentId } = req.params;
    const { updatedBookContent } = req.body; // كائن يحتوي على الفصول المعدلة

    try {
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) return res.status(404).send("التقييم غير موجود");
        if (assessment.isPaid) {
            return res.status(409).json({ message: 'A paid report can no longer be edited' });
        }

        assessment.bookContentRaw = updatedBookContent;
        await assessment.save();

        res.json({ success: true, message: "تم تحديث محتوى الكتاب بنجاح" });
    } catch (error) {
        console.error(error);
        res.status(500).send("خطأ في تحديث الكتاب");
    }
});

// مسار للإدارة: اعتماد الكتاب وإرساله للعميل
router.post('/admin/approve-book/:assessmentId', requireAuth, requireAdmin, async (req, res) => {
    const { assessmentId } = req.params;

    try {
        const assessment = await Assessment.findById(assessmentId).populate('user');
        if (!assessment) return res.status(404).send("التقييم غير موجود");
        if (!assessment.isPaid) {
            return res.status(409).json({ message: 'The report cannot be delivered before payment' });
        }
        if (assessment.deliveryComplete) {
            return res.status(409).json({ message: 'The report has already been delivered' });
        }

        const user = assessment.user;
        const bookContent = assessment.bookContentRaw;
        const userName = user.name || "عزيزي العميل";
        const userEmail = user.email;

        // توليد ملف الـ PDF النهائي المعتمد
        const fileName = `final_${assessmentId}.pdf`;
        const outputPath = path.join(__dirname, '..', 'temp', fileName);
        await createPDFBooklet(bookContent, userName, outputPath, user.language);

        // إرساله للعميل
        if (user.notificationPreferences?.bookReadyEmail !== false) {
            await sendFinalBookToUser(userEmail, userName, outputPath, user.id, user.language, assessment.id);
            assessment.deliveryEmailSent = true;
        }

        // تحديث حالة الكتاب إلى "معتمد وتم الإرسال"
        assessment.status = 'delivered';
        assessment.deliveryComplete = true;
        await assessment.save();

        res.json({ success: true, message: "تم الاعتماد وإرسال الكتاب للعميل بنجاح" });
    } catch (error) {
        console.error(error);
        res.status(500).send("خطأ أثناء اعتماد الكتاب");
    }
});

// مسار لإنهاء اختبار "العلاقات الثنائية" وتوليد الكتاب المبدئي
router.post('/generate-relationship-book', requireAuth, async (req, res) => {
    const { partnerName, relationshipType, user1Answers, user2Answers } = req.body;
    const { id: userId, name: userName, email: userEmail } = req.authUser;

    try {
        // 1. توليد محتوى كتاب العلاقات
        const relationshipData = { type: relationshipType, user1Name: userName, user2Name: partnerName };
        const bookContent = await generateRelationshipBookletContent(relationshipData, user1Answers, user2Answers);

        // 2. إنشاء تقييم ثنائي في قاعدة البيانات
        const newAssessment = new Assessment({
            user: userId,
            assessmentType: 'relationship',
            relationshipType: relationshipType,
            partnerName: partnerName,
            answers: user1Answers, // إجابات الشخص الأول
            partnerAnswers: user2Answers, // إجابات الشخص الثاني
            bookContentRaw: bookContent,
            status: 'pending_review'
        });
        await newAssessment.save();

        // 3. توليد نسخة PDF
        const fileName = `draft_rel_${newAssessment._id}.pdf`;
        const outputPath = path.join(__dirname, '..', 'temp', fileName);
        await createPDFBooklet(bookContent, `${userName} & ${partnerName}`, outputPath, user.language);

        // 4. إرسال للإدارة
        await sendBookForAdminReview(newAssessment._id, userEmail, outputPath, userId);

        res.json({ 
            success: true, 
            assessmentId: newAssessment.id,
            message: "تم تجهيز كتاب تحليل العلاقة وهو الآن قيد المراجعة العلمية لضمان جودته.", 
            freePreview: bookContent.free_preview 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "حدث خطأ أثناء معالجة طلب تحليل العلاقة" });
    }
});

router.get('/:assessmentId/download', requireAuth, async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.assessmentId)) {
        return res.status(404).json({ message: 'Report not found' });
    }
    try {
        const assessment = await Assessment.findOne({
            _id: req.params.assessmentId,
            user: req.authUser.id,
            isPaid: true,
            deliveryComplete: true
        });
        if (!assessment) {
            return res.status(404).json({ message: 'Report not found' });
        }
        const filePath = path.join(__dirname, '..', 'temp', `final_${assessment.id}.pdf`);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Report file not found' });
        }
        return res.download(filePath, `personal-report-${assessment.id}.pdf`, {
            headers: {
                'Cache-Control': 'no-store',
                'Referrer-Policy': 'no-referrer'
            }
        });
    } catch (error) {
        console.error('Paid report download failed:', error.message);
        return res.status(500).json({ message: 'Unable to download report' });
    }
});

module.exports = router;

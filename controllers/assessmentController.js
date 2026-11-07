const Assessment = require('../models/Assessment');
const CrisisReport = require('../models/CrisisReport');
const { detectCrisis } = require('../services/crisisDetector');

exports.saveAssessmentProgress = async (req, res) => {
  try {
    const { userId, narrativeData, bigFiveScores, healthScreening } = req.body;
    
    // 1. فحص النصوص المفتوحة للكشف عن الأزمات
    let crisisDetected = false;
    let crisisData = null;

    if (narrativeData && narrativeData.current_challenges) {
      // نفترض أن اللغة العربية هي الافتراضية، يمكن تمريرها من الـ Frontend
      crisisData = detectCrisis(narrativeData.current_challenges, 'ar');
      
      if (crisisData.riskLevel === 'critical' || crisisData.riskLevel === 'high') {
        crisisDetected = true;
        
        // إنشاء سجل أزمة في قاعدة البيانات
        const newCrisisReport = new CrisisReport({
          userId,
          riskLevel: crisisData.riskLevel,
          riskScore: crisisData.score,
          categoriesDetected: crisisData.categories,
          keywordsFound: crisisData.keywordsFound,
          analyzedText: narrativeData.current_challenges,
          analyzedField: 'current_challenges'
        });
        const savedCrisis = await newCrisisReport.save();
        
        // ربط الأزمة بالتقييم
        req.body.crisisReportId = savedCrisis._id;
        req.body.status = 'flagged_crisis';
      }
    }

    // 2. حفظ أو تحديث التقييم
    let assessment = await Assessment.findOne({ userId, status: { $in: ['in_progress', 'flagged_crisis'] } });
    
    if (!assessment) {
      assessment = new Assessment({ userId, ...req.body });
    } else {
      assessment.set(req.body);
    }

    await assessment.save();

    res.status(200).json({
      success: true,
      message: crisisDetected ? 'تم الحفظ، لكننا قلقون عليك. يرجى مراجعة قسم المساعدة.' : 'تم حفظ التقدم بنجاح',
      crisisDetected,
      crisisData: crisisDetected ? crisisData : null,
      assessmentId: assessment._id
    });

  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({ success: false, message: 'فشل في حفظ البيانات' });
  }
};

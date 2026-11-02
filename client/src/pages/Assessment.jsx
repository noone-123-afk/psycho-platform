import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ChevronLeft, CreditCard, Gift, FileText, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

const Assessment = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const isCoupleTest = searchParams.get('type') === 'couple';

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textAnswer, setTextAnswer] = useState("");
  const [isFinished, setIsFinished] = useState(false); // حالة إنهاء الاختبار

  // ... (بقية الكود الخاص بالأسئلة)
  const mockQuestions = [
    { id: 1, text: "كيف تصف شعورك العام خلال الأسبوع الماضي؟", type: "multiple_choice", options: ["مرهق ومضغوط", "هادئ ومستقر", "قلق ومتوتر", "متحمس وحيوي"] },
    { id: 2, text: "عندما تواجه مشكلة معقدة، كيف تتصرف عادة؟", type: "multiple_choice", options: ["أطلب المساعدة فوراً", "أحاول حلها بنفسي بهدوء", "أشعر بالتوتر وأتوقف", "أقوم بتجزئتها لخطوات"] },
    { id: 3, text: "صِف لنا بكلماتك الخاصة، ماذا يعني لك مصطلح 'الراحة النفسية'؟", type: "text" },
  ];

  const question = mockQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === mockQuestions.length - 1;

  const handleOptionSelect = (option) => {
    setAnswers({ ...answers, [question.id]: option });
    setTimeout(() => goToNext(), 400);
  };

  const goToNext = () => {
    if (question.type === "text" && textAnswer.trim() !== "") {
        setAnswers({ ...answers, [question.id]: textAnswer });
        setTextAnswer("");
    }
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
        // إنهاء الاختبار وعرض شاشة الدفع
        setIsFinished(true);
    }
  };

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // شاشة إنهاء الاختبار وعرض خيارات الدفع
  if (isFinished) {
    return (
      <div style={containerStyle}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={cardStyle}
        >
          <CheckCircle2 color="#8b7355" size={60} style={{ margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ textAlign: 'center', color: '#333' }}>لقد أتممت الاختبار بنجاح!</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
            نحن الآن نقوم بتحليل إجاباتك العميقة. 
            <br />
            <strong>لمحة سريعة:</strong> يبدو أنك شخص يميل إلى التفكير التحليلي العميق وتتحمل مسؤوليات تفوق طاقتك أحياناً.
          </p>

          <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>اختر باقتك للحصول على كتابك المخصص الكامل:</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* باقة PDF */}
            <div style={pricingCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <FileText color="#8b7355" size={30} />
                <div>
                  <h3 style={{ margin: 0 }}>النسخة الرقمية (PDF)</h3>
                  <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>كتاب إلكتروني بتصميم فني أنيق</p>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px', color: '#8b7355' }}>$10</h3>
                <button style={payButtonStyle}><CreditCard size={16}/> شراء عبر PayPal</button>
              </div>
            </div>

            {/* باقة الصوت */}
            <div style={pricingCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Headphones color="#8b7355" size={30} />
                <div>
                  <h3 style={{ margin: 0 }}>الباقة الشاملة (PDF + كتاب صوتي)</h3>
                  <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>استمع لتحليلك بصوت هادئ ومريح</p>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px', color: '#8b7355' }}>$25</h3>
                <button style={payButtonStyle}><CreditCard size={16}/> شراء عبر PayPal</button>
              </div>
            </div>

            {/* باقة الهدايا */}
            <div style={{ ...pricingCardStyle, backgroundColor: '#fdfbf7', border: '1px dashed #8b7355' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Gift color="#8b7355" size={30} />
                <div>
                  <h3 style={{ margin: 0 }}>أهدِ هذا الاختبار لصديق</h3>
                  <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>احصل على كود هدية ترسله لمن تحب</p>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px', color: '#8b7355' }}>$10</h3>
                <button style={{ ...payButtonStyle, backgroundColor: '#fff', color: '#8b7355', border: '1px solid #8b7355' }}>
                  شراء كود هدية
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    );
  }

  // --- واجهة عرض الأسئلة الأصلية تبقى هنا ---
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        
        {/* شريط التقدم */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            <span>{isCoupleTest ? 'اختبار العلاقات' : 'الاختبار الفردي'} - سؤال {currentQuestionIndex + 1} من {mockQuestions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
              style={{ height: '100%', backgroundColor: '#8b7355', borderRadius: '3px' }}
            />
          </div>
        </div>

        {/* عرض السؤال */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: i18n.language === 'ar' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: i18n.language === 'ar' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            style={{ minHeight: '200px' }}
          >
            <h3 style={{ fontSize: '1.4rem', color: '#333', marginBottom: '30px', lineHeight: '1.6' }}>
              {question.text}
            </h3>

            {question.type === "multiple_choice" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {question.options.map((option, idx) => {
                  const isSelected = answers[question.id] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      style={{
                        padding: '15px 20px',
                        textAlign: i18n.language === 'ar' ? 'right' : 'left',
                        backgroundColor: isSelected ? '#f5f0e6' : '#ffffff',
                        border: `2px solid ${isSelected ? '#8b7355' : '#e0e0e0'}`,
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                        color: '#333'
                      }}
                    >
                      {option}
                      {isSelected && <CheckCircle2 color="#8b7355" size={20} />}
                    </button>
                  );
                })}
              </div>
            )}

            {question.type === "text" && (
                <textarea 
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="اكتب إجابتك هنا بحرية تامة..."
                    style={{
                        width: '100%', minHeight: '150px', padding: '15px', borderRadius: '12px',
                        border: '2px solid #e0e0e0', fontSize: '1.1rem', fontFamily: 'inherit',
                        resize: 'vertical', outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b7355'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
            )}
          </motion.div>
        </AnimatePresence>

        {/* أزرار التنقل */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <button 
            onClick={goToPrev} disabled={currentQuestionIndex === 0}
            style={{ padding: '10px 20px', backgroundColor: 'transparent', border: 'none', color: currentQuestionIndex === 0 ? '#ccc' : '#666', cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            {i18n.language === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            السابق
          </button>
          <button 
            onClick={goToNext}
            style={{ padding: '12px 30px', backgroundColor: '#8b7355', color: '#fff', border: 'none', borderRadius: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
          >
            {isLastQuestion ? "إنهاء الاختبار" : "التالي"}
            {i18n.language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// تنسيقات مساعدة
const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ffffff 0%, #fdfbf7 50%, #f5f0e6 100%)',
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px'
};

const cardStyle = {
    maxWidth: '700px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
    padding: '40px',
    marginTop: '20px'
};

const pricingCardStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
};

const payButtonStyle = {
    padding: '10px 15px',
    backgroundColor: '#003087', // لون PayPal
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 'bold'
};

export default Assessment;
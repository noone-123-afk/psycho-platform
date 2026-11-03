import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ChevronLeft, FileText, Headphones, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from 'axios';
import CrisisSupportNotice from '../components/CrisisSupportNotice';
import { hasPotentialCrisisSignal } from '../utils/crisisSignals';
import { hasAuthToken } from '../utils/auth';

const Assessment = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isCoupleTest = searchParams.get('type') === 'couple';

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textAnswer, setTextAnswer] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [assessmentId, setAssessmentId] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [freePreview, setFreePreview] = useState("");
  const [showCrisisNotice, setShowCrisisNotice] = useState(false);
  const [deliveryPending, setDeliveryPending] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    if (!hasAuthToken()) {
      navigate('/account?next=/assessment', { replace: true });
      return;
    }
    axios.get('/api/payment/config')
      .then((response) => setPaypalClientId(response.data.clientId))
      .catch(() => setPaymentMessage(
        i18n.language === 'ar' ? 'تعذر تحميل إعدادات الدفع.' : 'Unable to load payment settings.'
      ));
  }, [i18n.language, navigate]);

  // الأسئلة العلمية المرتبطة بالترجمة
  const questions = [
    { id: 'q1', type: "multiple_choice", options: ["q1_o1", "q1_o2", "q1_o3", "q1_o4"] },
    { id: 'q2', type: "multiple_choice", options: ["q2_o1", "q2_o2", "q2_o3", "q2_o4"] },
    { id: 'q3', type: "multiple_choice", options: ["q3_o1", "q3_o2", "q3_o3", "q3_o4"] },
    { id: 'q4', type: "multiple_choice", options: ["q4_o1", "q4_o2", "q4_o3", "q4_o4"] },
    { id: 'q5', type: "text" },
  ];

  const question = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleOptionSelect = (optionKey) => {
    setAnswers({ ...answers, [question.id]: t(optionKey) });
    setTimeout(() => goToNext(), 400);
  };

  const goToNext = async () => {
    const answerText = textAnswer.trim();
    const submittedAnswers = question.type === "text" && answerText
      ? { ...answers, [question.id]: answerText }
      : answers;

    if (currentQuestionIndex < questions.length - 1) {
      if (question.type === "text" && answerText) {
        setAnswers(submittedAnswers);
        setTextAnswer("");
      }
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
        if (question.type === "text" && hasPotentialCrisisSignal(answerText)) {
            setShowCrisisNotice(true);
            return;
        }

        if (question.type === "text" && answerText) {
          setAnswers(submittedAnswers);
          setTextAnswer("");
        }

        // إنهاء الاختبار وإرسال البيانات للخادم
        setIsFinished(true);
        setIsGenerating(true);
        try {
            const response = await axios.post('/api/assessment/generate-book', {
                answers: submittedAnswers
            });
            
            if(response.data.success) {
                setAssessmentId(response.data.assessmentId);
                setFreePreview(response.data.freePreview || t('testFinished'));
            }
        } catch (error) {
            console.error("خطأ في توليد الكتاب", error);
            setPaymentMessage(error.response?.data?.message || t('testFinished'));
            setIsFinished(false);
        } finally {
            setIsGenerating(false);
        }
    }
  };

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleApprove = async (data) => {
      try {
          const res = await axios.post('/api/payment/capture-order', {
              orderID: data.orderID,
              assessmentId
          });
          if(res.data.status === 'success') {
              const file = await axios.get(res.data.downloadUrl, { responseType: 'blob' });
              setDownloadUrl(URL.createObjectURL(file.data));
          }
      } catch (err) {
          console.error("Payment Capture Error", err);
          if (['paid_delivery_pending', 'delivery_in_progress'].includes(err.response?.data?.status)) {
              setDeliveryPending(true);
              setAssessmentId(err.response.data.assessmentId || assessmentId);
              setPaymentMessage(err.response.data.message);
          } else {
              setPaymentMessage(err.response?.data?.message || "حدث خطأ أثناء معالجة الدفع.");
          }
      }
  };

  const retryReportDelivery = async () => {
      setPaymentMessage('');
      try {
          const response = await axios.post('/api/payment/retry-delivery', { assessmentId });
          const file = await axios.get(response.data.downloadUrl, { responseType: 'blob' });
          setDownloadUrl(URL.createObjectURL(file.data));
          setDeliveryPending(false);
      } catch (error) {
          setPaymentMessage(error.response?.data?.message || (
            i18n.language === 'ar' ? 'تعذر إعادة إرسال التقرير.' : 'Unable to retry report delivery.'
          ));
      }
  };

  // ----------------------------------------------------
  // شاشة إنهاء الاختبار وعرض خيارات الدفع (أزرار PayPal الفعّالة)
  // ----------------------------------------------------
  if (isFinished) {
    return (
      <div style={containerStyle(i18n.language)}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={cardStyle}>
          
          {isGenerating ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                  <div className="loader" style={loaderStyle}></div>
                  <h3 style={{ marginTop: '20px', color: '#8b7355' }}>{t('processingAnswers')}</h3>
                  <p>{t('generating')}</p>
              </div>
          ) : downloadUrl ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                  <CheckCircle2 color="#2ecc71" size={60} style={{ margin: '0 auto 20px', display: 'block' }} />
                  <h2>{t('testFinished')}</h2>
                  <a href={downloadUrl} target="_blank" rel="noreferrer" style={{...payButtonStyle, display: 'inline-flex', marginTop: '20px', backgroundColor: '#8b7355', textDecoration: 'none'}}>
                      <Download size={20} /> {t('downloadReady')}
                  </a>
              </div>
          ) : deliveryPending ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                  <h2>{i18n.language === 'ar' ? 'تم تأكيد الدفع' : 'Payment confirmed'}</h2>
                  <p role="status">{paymentMessage}</p>
                  <button type="button" onClick={retryReportDelivery} style={{ ...payButtonStyle, marginTop: '20px' }}>
                      {i18n.language === 'ar' ? 'إعادة محاولة إرسال التقرير' : 'Retry report delivery'}
                  </button>
              </div>
          ) : (
              <>
                  <CheckCircle2 color="#8b7355" size={60} style={{ margin: '0 auto 20px', display: 'block' }} />
                  <h2 style={{ textAlign: 'center', color: '#333' }}>{t('testFinished')}</h2>
                  <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', padding: '15px', backgroundColor: '#fdfbf7', borderRadius: '10px', border: '1px solid #eee' }}>
                    <strong>{t('freePreview')}:</strong> {freePreview}
                  </p>

                  <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>{t('choosePackage')}</h4>
                  
                  {/* PayPal Provider (يجب وضع الـ Client ID الحقيقي الخاص بك هنا بدلاً من test) */}
                  {paymentMessage && <p role="alert" style={{ color: '#b91c1c' }}>{paymentMessage}</p>}
                  {!paypalClientId ? (
                    <p role="status" style={{ color: '#8b5e34' }}>
                      {i18n.language === 'ar' ? 'الدفع غير متاح حالياً. يرجى المحاولة لاحقاً.' : 'Payments are not configured yet. Please try again later.'}
                    </p>
                  ) : <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: "USD" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          {/* باقة PDF */}
                          <div style={pricingCardStyle(i18n.language)}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                  <FileText color="#8b7355" size={30} />
                                  <div>
                                      <h3 style={{ margin: 0 }}>{t('pdfPackage')}</h3>
                                      <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>{t('pdfDesc')}</p>
                                  </div>
                              </div>
                              <div style={{ width: '200px' }}>
                                  <h3 style={{ margin: '0 0 10px', color: '#8b7355', textAlign: 'center' }}>$10</h3>
                                  <PayPalButtons 
                                      style={{ layout: "horizontal", height: 35 }} 
                                      createOrder={() => axios.post('/api/payment/create-order/pdf', { assessmentId }).then(res => res.data.id)}
                                      onApprove={handleApprove}
                                  />
                              </div>
                          </div>

                          {/* الباقة الشاملة */}
                          <div style={pricingCardStyle(i18n.language)}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                  <Headphones color="#8b7355" size={30} />
                                  <div>
                                      <h3 style={{ margin: 0 }}>{t('audioPackage')}</h3>
                                      <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>{t('audioDesc')}</p>
                                  </div>
                              </div>
                              <div style={{ width: '200px' }}>
                                  <h3 style={{ margin: '0 0 10px', color: '#8b7355', textAlign: 'center' }}>$25</h3>
                                  <p style={{ color: '#777', textAlign: 'center', fontSize: '13px' }}>
                                      {i18n.language === 'ar' ? 'غير متاحة حالياً' : 'Not available yet'}
                                  </p>
                              </div>
                          </div>
                      </div>
                  </PayPalScriptProvider>}
              </>
          )}
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // واجهة عرض الأسئلة الأصلية
  // ----------------------------------------------------
  return (
    <div style={containerStyle(i18n.language)}>
      {paymentMessage && <p role="alert" style={{ ...cardStyle, color: '#b91c1c' }}>{paymentMessage}</p>}
      {showCrisisNotice && (
        <CrisisSupportNotice onClose={() => setShowCrisisNotice(false)} />
      )}
      <div style={cardStyle}>
        
        {/* شريط التقدم */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            <span>{isCoupleTest ? t('coupleTest') : t('individualTest')} - {t('questionOf', {current: currentQuestionIndex + 1, total: questions.length})}</span>
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
            style={{ minHeight: '250px' }}
          >
            <h3 style={{ fontSize: '1.4rem', color: '#333', marginBottom: '30px', lineHeight: '1.6' }}>
              {t(question.id)}
            </h3>

            {question.type === "multiple_choice" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {question.options.map((optionKey, idx) => {
                  const optionText = t(optionKey);
                  const isSelected = answers[question.id] === optionText;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(optionKey)}
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
                      {optionText}
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
            {t('prevBtn')}
          </button>
          <button 
            onClick={goToNext}
            style={{ padding: '12px 30px', backgroundColor: '#8b7355', color: '#fff', border: 'none', borderRadius: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
          >
            {isLastQuestion ? t('finishBtn') : t('nextBtn')}
            {i18n.language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// تنسيقات مساعدة
const containerStyle = (lang) => ({
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ffffff 0%, #fdfbf7 50%, #f5f0e6 100%)',
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    fontFamily: lang === 'ar' ? '"Tajawal", sans-serif' : '"Segoe UI", sans-serif',
    direction: lang === 'ar' ? 'rtl' : 'ltr'
});

const cardStyle = {
    maxWidth: '700px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
    padding: '40px',
    marginTop: '20px'
};

const pricingCardStyle = () => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    flexDirection: 'row',
    gap: '20px',
    flexWrap: 'wrap'
});

const payButtonStyle = {
    padding: '10px 15px',
    backgroundColor: '#003087',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '100%'
};

const loaderStyle = {
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #8b7355',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
};

export default Assessment;
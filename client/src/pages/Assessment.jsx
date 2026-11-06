import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Headphones, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from 'axios';
import AssessmentQuestionnaire from '../components/AssessmentQuestionnaire';
import { hasAuthToken } from '../utils/auth';

const Assessment = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [isFinished, setIsFinished] = useState(false);
  const [assessmentId, setAssessmentId] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [freePreview, setFreePreview] = useState("");
  const [healthScores, setHealthScores] = useState([]);
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

  const handleAssessmentComplete = ({ response, healthScores: localHealthScores }) => {
    setAssessmentId(response.assessmentId);
    setFreePreview(response.freePreview || t('testFinished'));
    setHealthScores(localHealthScores);
    setIsFinished(true);
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
          
          {downloadUrl ? (
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
          {healthScores.length > 0 && (
            <aside className="health-score-summary" aria-live="polite">
                  <h3>{i18n.language === 'ar' ? 'نتيجة الفحص الاختياري' : 'Optional screening results'}</h3>
                  {healthScores.map(({ scale, score, max }) => (
                    <p key={scale}>
                      {scale}: {score}/{max}
                    </p>
                  ))}
                  <p>
                    {i18n.language === 'ar'
                      ? 'مجموع وصفي فقط، وليس تشخيصاً. حُسب في ذاكرة المتصفح ولم يُرسل أو يُحفظ، وسيختفي عند مغادرة الصفحة.'
                      : 'Descriptive totals only, not diagnoses. Calculated in browser memory, never sent or saved, and cleared when you leave this page.'}
                  </p>
            </aside>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div style={containerStyle(i18n.language)}>
      {location.state?.preferencesSaved && (
        <p role="status" style={{ ...cardStyle, color: '#547863' }}>
          {i18n.language === 'ar' ? 'تم حفظ تفضيلات البريد الإلكتروني.' : 'Email preferences saved.'}
        </p>
      )}
      <AssessmentQuestionnaire onComplete={handleAssessmentComplete} />
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

export default Assessment;
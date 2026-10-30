import React, { useRef } from 'react';

export const SocialShareCard = ({ userName, traits, websiteUrl = "https://your-website.com" }) => {
  // traits: مصفوفة تحتوي على 3 صفات مثل ['العمق', 'السعي للكمال', 'الحكمة']
  const cardRef = useRef(null);

  const shareText = `لقد اكتشفت ملامح شخصيتي عبر منصة التحليل النفسي! صفتي الأبرز هي: ${traits[0]}. اكتشف شخصيتك أنت أيضاً!`;
  
  // دوال المشاركة
  const shareOnWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + websiteUrl)}`, '_blank');
  };

  const shareOnX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(websiteUrl)}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
  };

  // سناب شات وإنستغرام يعتمدان عادة على مشاركة الصور من التطبيق نفسه
  // لذلك نوفر زراً لنسخ الرابط مع تعليمات بسيطة
  const copyLink = () => {
    navigator.clipboard.writeText(`${shareText} ${websiteUrl}`);
    alert('تم نسخ الرابط والنص بنجاح! يمكنك لصقه الآن في إنستغرام أو سناب شات.');
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h3 style={{ color: '#333' }}>شارك نتيجتك مع العالم 🌍</h3>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
        لن نشارك إجاباتك السرية أبداً، لكن يمكنك مشاركة أجمل ما في شخصيتك!
      </p>
      
      {/* البطاقة القابلة للمشاركة */}
      <div id="shareable-card" ref={cardRef} style={{
        width: '300px',
        height: '400px',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        borderRadius: '15px',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        textAlign: 'center',
        position: 'relative',
        marginBottom: '20px'
      }}>
        <div style={{ position: 'absolute', top: '20px', fontSize: '12px', color: '#1565c0', fontWeight: 'bold' }}>
          منصة التحليل النفسي
        </div>
        
        <h4 style={{ color: '#333', marginBottom: '30px' }}>ملامح من شخصية {userName}</h4>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
          {traits.map((trait, index) => (
            <span key={index} style={{
              background: 'white',
              color: '#1976d2',
              padding: '8px 15px',
              borderRadius: '20px',
              fontWeight: 'bold',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              {trait}
            </span>
          ))}
        </div>
        
        <div style={{ position: 'absolute', bottom: '20px', fontSize: '10px', color: '#666' }}>
          اكتشف شخصيتك أنت أيضاً: {websiteUrl}
        </div>
      </div>

      {/* أزرار المشاركة */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        <button onClick={shareOnWhatsApp} style={btnStyle('#25D366')}>واتساب</button>
        <button onClick={shareOnX} style={btnStyle('#000000')}>منصة X</button>
        <button onClick={shareOnFacebook} style={btnStyle('#1877F2')}>فيسبوك</button>
        <button onClick={copyLink} style={btnStyle('#fffc00', '#000')}>سناب / إنستغرام (نسخ)</button>
        <button onClick={copyLink} style={btnStyle('#607d8b')}>🔗 نسخ الرابط</button>
      </div>
    </div>
  );
};

// تصميم مساعد للأزرار
const btnStyle = (bg, color = 'white') => ({
  padding: '10px 15px',
  backgroundColor: bg,
  color: color,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px'
});

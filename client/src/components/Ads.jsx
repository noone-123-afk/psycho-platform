import React from 'react';

// مكون إعلانات جوجل AdSense
export const AdSenseBanner = () => {
  return (
    <div style={{ padding: '20px', margin: '20px 0', border: '1px dashed #ccc', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
      <p style={{ color: '#888', fontSize: '12px' }}>-- مساحة إعلانية (Google AdSense) --</p>
      {/* هنا سيتم إدراج كود <ins> الخاص بجوجل أدسنس */}
    </div>
  );
};

// مكون إعلانات الرعايات (العيادات النفسية والاستشارات)
export const ClinicSponsorshipAd = () => {
  return (
    <div style={{ padding: '20px', margin: '20px 0', borderRadius: '8px', backgroundColor: '#e3f2fd', border: '1px solid #90caf9', textAlign: 'center' }}>
      <h3 style={{ color: '#1565c0', margin: '0 0 10px 0' }}>هل تبحث عن استشارة شخصية مباشرة؟</h3>
      <p style={{ color: '#333', fontSize: '14px' }}>تواصل الآن مع نخبة من أفضل الأطباء النفسيين عبر عيادات (اسم العيادة الراعية). سرية تامة وراحة تامة من منزلك.</p>
      <button style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        احجز جلستك الآن
      </button>
      <p style={{ color: '#888', fontSize: '10px', marginTop: '10px' }}>-- إعلان مدعوم --</p>
    </div>
  );
};

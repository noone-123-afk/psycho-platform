import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, BookOpen, Users, Brain, Lightbulb, Heart, Feather } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #fdfbf7 50%, #f5f0e6 100%)', // خلفية هادئة متدرجة بين الأبيض والبيج
      fontFamily: i18n.language === 'ar' ? '"Tajawal", sans-serif' : '"Segoe UI", sans-serif',
      color: '#000000', // نص باللون الأسود كما طلبت
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* شريط التنقل (Header) */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #eaeaea' }}>
        <h1 style={{ margin: 0, color: '#000000', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={28} color="#8b7355" /> {/* أيقونة بلون بيج غامق متناسق */}
          {t('appName')}
        </h1>
        <button 
          onClick={toggleLanguage}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid #8b7355', borderRadius: '20px', background: 'transparent', color: '#8b7355', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Globe size={18} />
          {t('language')}
        </button>
      </header>

      {/* المحتوى الرئيسي (Hero Section) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ fontSize: '3rem', color: '#000000', marginBottom: '20px' }}
        >
          {t('homeTitle')}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          style={{ maxWidth: '600px', fontSize: '1.2rem', lineHeight: '1.8', color: '#333333', marginBottom: '50px' }}
        >
          {t('homeSubtitle')}
        </motion.p>

        {/* أزرار البدء */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <button 
            onClick={() => document.getElementById('assessment-foundation')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
            padding: '15px 40px',
            fontSize: '1.1rem',
            backgroundColor: '#8b7355', // لون بيج/بني هادئ للأزرار
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3)',
            transition: 'transform 0.2s',
          }}>
            {t('exploreFoundation')}
          </button>
          
          <button 
            disabled
            style={{
            padding: '15px 40px',
            fontSize: '1.1rem',
            backgroundColor: '#f5f5f5',
            color: '#777',
            border: '2px solid #ddd',
            borderRadius: '30px',
            cursor: 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: 0.75,
          }}>
            <Users size={20} />
            {t('relationshipComingSoon')}
          </button>
        </motion.div>

        <section id="assessment-foundation" className="assessment-foundation" aria-labelledby="foundation-title">
          <div className="foundation-heading">
            <span className="foundation-eyebrow">{t('foundationEyebrow')}</span>
            <h2 id="foundation-title">{t('foundationTitle')}</h2>
            <p>{t('foundationIntro')}</p>
          </div>
          <div className="foundation-grid">
            {[
              { icon: Brain, title: 'foundationPersonalityTitle', description: 'foundationPersonalityDescription', reference: 'foundationPersonalityReference' },
              { icon: Lightbulb, title: 'foundationAbilitiesTitle', description: 'foundationAbilitiesDescription', reference: 'foundationAbilitiesReference' },
              { icon: Heart, title: 'foundationStrengthsTitle', description: 'foundationStrengthsDescription', reference: 'foundationStrengthsReference' },
              { icon: Feather, title: 'foundationNarrativeTitle', description: 'foundationNarrativeDescription', reference: 'foundationNarrativeReference' },
            ].map(({ icon: Icon, title, description, reference }) => (
              <article className="foundation-card" key={title}>
                <span className="foundation-icon"><Icon size={22} aria-hidden="true" /></span>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
                <span className="foundation-reference">{t(reference)}</span>
              </article>
            ))}
          </div>
          <p className="foundation-note">{t('foundationNote')}</p>
          <aside className="medical-disclaimer" role="note">
            <strong>{t('medicalDisclaimerTitle')}</strong>
            <p>{t('medicalDisclaimer')}</p>
          </aside>
        </section>

      </main>

      {/* التذييل (Footer) */}
      <footer style={{ padding: '20px', textAlign: 'center', color: '#555555', fontSize: '0.9rem', backgroundColor: 'transparent' }}>
        {t('footer')}
      </footer>

    </div>
  );
};

export default Home;
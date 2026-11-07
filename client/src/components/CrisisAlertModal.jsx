import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, Heart } from 'lucide-react';

const CrisisAlertModal = ({ isOpen, onClose, helplineNumber = "911 / 999" }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-red-600"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="text-center mb-6">
          <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('assessment.crisis_alert.title')}</h2>
          <p className="text-gray-600">{t('assessment.crisis_alert.message')}</p>
        </div>

        <div className="space-y-4">
          <a 
            href={`tel:${helplineNumber}`}
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            <Phone className="w-5 h-5" />
            {t('assessment.crisis_alert.call_now')}: {helplineNumber}
          </a>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <p className="text-sm text-blue-800 font-medium">
                {t('assessment.crisis_alert.you_are_not_alone')}
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 text-gray-500 hover:text-gray-700 font-medium py-2"
        >
          {isRTL ? 'إغلاق المتابعة بحذر' : 'Close and continue with caution'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default CrisisAlertModal;

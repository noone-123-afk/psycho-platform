import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Settings, Users, BookOpen, MessageSquare, CheckCircle } from 'lucide-react';

// محاكاة لبيانات قادمة من الخادم (Backend)
const mockAssessments = [
  { id: '1', userName: 'أحمد', status: 'pending_review', type: 'individual', date: '2026-11-02' },
  { id: '2', userName: 'سارة', status: 'approved', type: 'individual', date: '2026-11-01' },
];

const mockMessages = [
  { id: '1', from: 'khaled@example.com', subject: 'استفسار عن الدفع', text: 'هل يمكنني الدفع عبر مدى؟' },
];

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('books'); // books, messages, stats

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa', direction: 'rtl', fontFamily: '"Tajawal", sans-serif' }}>
      
      {/* القائمة الجانبية (Sidebar) */}
      <div style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '20px' }}>
        <h2 style={{ borderBottom: '1px solid #34495e', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>لوحة الإدارة</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab('books')} style={sidebarBtnStyle(activeTab === 'books')}>
            <BookOpen size={20} /> مراجعة الكتب
          </button>
          <button onClick={() => setActiveTab('messages')} style={sidebarBtnStyle(activeTab === 'messages')}>
            <MessageSquare size={20} /> رسائل الزوار
          </button>
          <button onClick={() => setActiveTab('stats')} style={sidebarBtnStyle(activeTab === 'stats')}>
            <Settings size={20} /> الإحصائيات
          </button>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* تبويب مراجعة الكتب */}
        {activeTab === 'books' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>الكتب بانتظار المراجعة والاعتماد</h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              {mockAssessments.map(item => (
                <div key={item.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px' }}>المستخدم: {item.userName}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>تاريخ الاختبار: {item.date} | نوع الاختبار: {item.type === 'individual' ? 'فردي' : 'علاقة'}</p>
                    <span style={{ display: 'inline-block', marginTop: '10px', padding: '5px 10px', backgroundColor: item.status === 'pending_review' ? '#fff3cd' : '#d4edda', color: item.status === 'pending_review' ? '#856404' : '#155724', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>
                      {item.status === 'pending_review' ? 'بانتظار التدقيق' : 'تم الاعتماد والإرسال'}
                    </span>
                  </div>
                  
                  {item.status === 'pending_review' && (
                    <button style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} /> مراجعة الكتاب
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* تبويب رسائل الزوار */}
        {activeTab === 'messages' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>الرسائل الواردة</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {mockMessages.map(msg => (
                <div key={msg.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#2c3e50' }}>الموضوع: {msg.subject}</h4>
                  <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#888' }}>من: {msg.from}</p>
                  <p style={{ margin: 0, color: '#444', lineHeight: '1.6' }}>{msg.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* تبويب الإحصائيات (نموذج مبسط) */}
        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>إحصائيات الموقع</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={statBoxStyle}>
                <h3>الزوار اليوم</h3>
                <p style={{ fontSize: '32px', color: '#3498db', fontWeight: 'bold', margin: '10px 0' }}>120</p>
              </div>
              <div style={statBoxStyle}>
                <h3>الكتب المولدة</h3>
                <p style={{ fontSize: '32px', color: '#2ecc71', fontWeight: 'bold', margin: '10px 0' }}>15</p>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

const sidebarBtnStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 20px',
  width: '100%',
  backgroundColor: isActive ? '#34495e' : 'transparent',
  color: isActive ? '#fff' : '#bdc3c7',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'right',
  fontSize: '16px',
  transition: 'all 0.2s'
});

const statBoxStyle = {
  flex: 1,
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '10px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  textAlign: 'center'
};

export default AdminDashboard;
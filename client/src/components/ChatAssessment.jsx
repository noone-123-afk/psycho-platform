import React, { useState } from 'react';

export const ChatAssessment = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'أهلاً بك. أنا هنا لأستمع إليك. كيف تشعر اليوم؟ حاول أن تصف لي مشاعرك بكلماتك الخاصة.' }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    // إضافة رسالة المستخدم
    setMessages(prev => [...prev, { sender: 'user', text: inputValue }]);
    
    // محاكاة رد النظام (السؤال التالي)
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: 'أفهمك تماماً. هذا الشعور طبيعي جداً. متى بدأت تلاحظ هذه المشاعر لأول مرة؟' }]);
    }, 1000);

    setInputValue('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ padding: '20px', backgroundColor: '#f0f4f8', borderRadius: '10px', height: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            alignSelf: msg.sender === 'user' ? 'flex-start' : 'flex-end', // اتجاه عربي (اليمين لليسار)
            backgroundColor: msg.sender === 'user' ? '#1976d2' : '#ffffff',
            color: msg.sender === 'user' ? '#fff' : '#333',
            padding: '12px 16px',
            borderRadius: msg.sender === 'user' ? '15px 15px 15px 0' : '15px 15px 0 15px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            maxWidth: '80%'
          }}>
            {msg.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: '10px', gap: '10px' }}>
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="اكتب إجابتك هنا بحرية..."
          style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #ccc', outline: 'none' }}
        />
        <button onClick={handleSend} style={{ padding: '12px 20px', borderRadius: '25px', backgroundColor: '#1976d2', color: 'white', border: 'none', cursor: 'pointer' }}>
          إرسال
        </button>
      </div>
    </div>
  );
};

const CHAPTERS = [
    { key: 'chapter1_mirror', ar: 'الفصل الأول: مرآة إجاباتك', en: 'Chapter 1: A mirror of your responses' },
    { key: 'chapter2_diagnosis', ar: 'الفصل الثاني: السياق والتأمل', en: 'Chapter 2: Context and reflection' },
    { key: 'chapter3_history', ar: 'الفصل الثالث: قصتك ومواردك', en: 'Chapter 3: Your story and resources' },
    { key: 'chapter4_literature', ar: 'الفصل الرابع: وقفة للتأمل', en: 'Chapter 4: A pause for reflection' },
    { key: 'chapter5_roadmap', ar: 'الفصل الخامس: خطوة تالية', en: 'Chapter 5: A next step' }
];

const PERSONAL_CHAPTERS = [
    { key: 'introduction', ar: 'الفصل الأول: مقدمة شخصية', en: 'Chapter 1: Personal introduction' },
    { key: 'personality', ar: 'الفصل الثاني: ملخص إجابات الشخصية', en: 'Chapter 2: Personality response summary' },
    { key: 'strengths', ar: 'الفصل الثالث: خريطة نقاط القوة', en: 'Chapter 3: Strengths map' },
    { key: 'narrative', ar: 'الفصل الرابع: سردية حياتك', en: 'Chapter 4: Your life narrative' },
    { key: 'challenges', ar: 'الفصل الخامس: تحليل التحديات', en: 'Chapter 5: Understanding challenges' },
    { key: 'chapter5_roadmap', ar: 'الفصل السادس: خطة التطوير', en: 'Chapter 6: Development plan' },
    { key: 'appendix', ar: 'الفصل السابع: الملحق العلمي', en: 'Chapter 7: Scientific appendix' }
];

const {
    getChapter1Introduction,
    getChapter2Personality,
    getChapter3Strengths,
    getChapter4LifeNarrative,
    getChapter5Challenges,
    getChapter6ActionPlan,
    getChapter7Appendix,
    textToHtml
} = require('./pdfChapters');

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function getCommonStyles(language = 'ar') {
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    const textAlign = language === 'ar' ? 'right' : 'left';

    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        body {
          color: #1e293b;
          direction: ${direction};
          font-family: ${language === 'ar' ? "'Tajawal', 'Arial', sans-serif" : "'Inter', 'Arial', sans-serif"};
          font-size: 12pt;
          line-height: 1.8;
          text-align: ${textAlign};
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          padding: 22mm 18mm;
          page-break-after: always;
          background: #fff;
        }
        .page:last-child { page-break-after: auto; }
        h1 {
          margin: 0 0 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #3b82f6;
          color: #1e40af;
          font-size: 28pt;
          font-weight: 700;
        }
        h2 { margin: 22px 0 14px; color: #2563eb; font-size: 20pt; font-weight: 600; }
        h3 { margin: 18px 0 10px; color: #3b82f6; font-size: 16pt; font-weight: 600; }
        p { margin: 0 0 12px; text-align: justify; }
        .cover-page {
          display: flex;
          min-height: 297mm;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 24mm 20mm;
          background: linear-gradient(145deg, #172554 0%, #1e40af 48%, #60a5fa 100%);
          color: #fff;
          text-align: center;
        }
        .cover-page h1 {
          max-width: 165mm;
          margin: 0 0 12mm;
          padding: 0;
          border: 0;
          color: #fff;
          font-size: 36pt;
          font-weight: 900;
          line-height: 1.35;
          text-shadow: 0 3px 14px rgba(0, 0, 0, .2);
        }
        .cover-brand { margin-bottom: 18mm; font-size: 12pt; letter-spacing: .12em; opacity: .84; }
        .cover-rule { width: 28mm; height: 2px; margin: 0 auto 10mm; background: rgba(255,255,255,.72); }
        .cover-page .user-name {
          max-width: 160mm;
          margin: 0;
          padding: 5mm 10mm;
          border: 1px solid rgba(255,255,255,.32);
          border-radius: 5mm;
          background: rgba(255,255,255,.13);
          font-size: 23pt;
          font-weight: 700;
          overflow-wrap: anywhere;
        }
        .cover-page .tagline { max-width: 145mm; margin-top: 12mm; font-size: 14pt; font-weight: 300; line-height: 1.7; }
        .cover-page .date { margin-top: 20mm; font-size: 10pt; opacity: .8; }
        .cover-decoration, .cover-decoration-2 { position: absolute; border-radius: 50%; pointer-events: none; }
        .cover-decoration { top: -30mm; inset-inline-end: -25mm; width: 105mm; height: 105mm; background: rgba(255,255,255,.09); }
        .cover-decoration-2 { bottom: -28mm; inset-inline-start: -24mm; width: 75mm; height: 75mm; background: rgba(255,255,255,.08); }
        .cover-content { position: relative; z-index: 1; }
        .toc-page { padding: 25mm 21mm; }
        .toc-page h1 { margin-bottom: 15mm; border: 0; text-align: center; }
        .toc-list { display: grid; gap: 5mm; }
        .toc-item {
          display: flex;
          min-height: 19mm;
          align-items: center;
          gap: 5mm;
          padding: 4mm 6mm;
          border-inline-start: 4px solid #3b82f6;
          border-radius: 3mm;
          background: #f8fafc;
          break-inside: avoid;
        }
        .toc-item-number { min-width: 12mm; color: #3b82f6; font-size: 17pt; font-weight: 700; }
        .toc-item-title { flex: 1; color: #1e293b; font-size: 13pt; font-weight: 600; }
        .chapter-page { padding-top: 27mm; }
        .page-header {
          position: absolute;
          inset: 0 0 auto;
          padding: 5mm 18mm;
          background: linear-gradient(90deg, #1e40af, #3b82f6);
          color: white;
          font-size: 9pt;
        }
        .page-footer {
          position: absolute;
          inset: auto 0 0;
          padding: 4mm 18mm;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          font-size: 8pt;
          text-align: center;
        }
        .chapter-intro {
          margin: 0 0 10mm;
          padding: 8mm;
          border: 1px solid #bfdbfe;
          border-radius: 4mm;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
        }
        .chapter-intro h2 { margin: 0; color: #1e40af; }
        .chapter-content { color: #334155; font-size: 12pt; line-height: 1.9; white-space: pre-wrap; overflow-wrap: anywhere; }
        .info-box, .warning-box, .success-box, .quote-box, .score-card, .column, .action-item, .timeline-content {
          margin: 6mm 0;
          padding: 6mm;
          border-radius: 3mm;
          break-inside: avoid;
        }
        .info-box { border-inline-start: 4px solid #3b82f6; background: linear-gradient(135deg, #eff6ff, #dbeafe); }
        .warning-box { border-inline-start: 4px solid #f59e0b; background: linear-gradient(135deg, #fef3c7, #fde68a); }
        .success-box { border-inline-start: 4px solid #10b981; background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
        .quote-box { border-inline-start: 4px solid #cbd5e1; background: #f8fafc; color: #475569; font-style: italic; }
        .score-card, .action-item { border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
        .score-header, .two-columns, .action-item { display: flex; align-items: center; justify-content: space-between; gap: 5mm; }
        .score-name { color: #1e293b; font-weight: 600; }
        .score-value { color: #3b82f6; font-size: 22pt; font-weight: 700; }
        .score-bar { height: 3mm; margin-top: 3mm; overflow: hidden; border-radius: 2mm; background: #e2e8f0; }
        .score-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .score-description, .action-description { margin-top: 3mm; color: #475569; font-size: 10pt; }
        .action-number { display: grid; width: 9mm; height: 9mm; flex: 0 0 9mm; place-items: center; border-radius: 50%; background: #3b82f6; color: white; font-weight: 700; }
        .column { flex: 1; background: #f8fafc; }
        .strength-badge { display: inline-block; margin: 2mm; padding: 2mm 5mm; border-radius: 8mm; background: #059669; color: white; font-size: 10pt; font-weight: 600; }
        .timeline { padding: 5mm 0; }
        .timeline-item { position: relative; margin-bottom: 7mm; padding-inline-start: 10mm; break-inside: avoid; }
        .timeline-item::before { position: absolute; inset-block: 0 -7mm; inset-inline-start: 3mm; width: 1px; background: #3b82f6; content: ''; }
        .timeline-item::after { position: absolute; inset-inline-start: 1mm; top: 2mm; width: 4mm; height: 4mm; border: 2px solid white; border-radius: 50%; background: #3b82f6; content: ''; }
        .timeline-date { color: #3b82f6; font-weight: 700; }
        .timeline-content { background: #f8fafc; }
        .highlight { padding: 0 1mm; border-radius: 1mm; background: #fef3c7; color: #92400e; font-weight: 600; }
        ul, ol { margin: 4mm 0; padding-inline-start: 8mm; }
        li { margin-bottom: 2mm; line-height: 1.7; }
        table { width: 100%; margin: 6mm 0; border-collapse: collapse; background: white; }
        th { padding: 3mm; background: #3b82f6; color: white; text-align: ${textAlign}; }
        td { padding: 3mm; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        @media print {
          .page { margin: 0; box-shadow: none; }
          .chapter-page { break-before: page; }
        }
      </style>
    `;
}

function getCoverPage(userName, dateString, language = 'ar', bookTitle) {
    const english = language === 'en';
    const title = bookTitle || (english ? 'My Personal Book' : 'كتابي الشخصي');
    const subtitle = english ? 'A Journey of Self-Discovery' : 'رحلة فهم الذات';
    const tagline = english
        ? 'A reflective guide to your responses, strengths, and practical next steps.'
        : 'قراءة تأملية لإجاباتك ونقاط قوتك وخطوات عملية قادمة.';

    return `<section class="page cover-page">
      <div class="cover-decoration"></div>
      <div class="cover-decoration-2"></div>
      <div class="cover-content">
        <div class="cover-brand">${english ? 'SOUL COMPASS' : 'بوصلة النفس'}</div>
        <h1>${escapeHtml(title)}</h1>
        <div class="cover-rule"></div>
        <p class="user-name">${escapeHtml(userName || (english ? 'the reader' : 'القارئ'))}</p>
        <p class="tagline">${tagline}<br>${escapeHtml(subtitle)}</p>
        <p class="date">${escapeHtml(dateString)}</p>
      </div>
    </section>`;
}

function getTocPage(language = 'ar', chapters = CHAPTERS) {
    const title = language === 'en' ? 'Table of Contents' : 'محتويات الكتاب';
    const chapterItems = chapters.map(({ ar, en }, index) => `
      <div class="toc-item">
        <span class="toc-item-number">${String(index + 1).padStart(2, '0')}</span>
        <span class="toc-item-title">${escapeHtml(language === 'en' ? en : ar)}</span>
      </div>
    `).join('');

    return `<section class="page toc-page">
      <h1>${title}</h1>
      <div class="toc-list">${chapterItems}</div>
    </section>`;
}

function buildBookletHtml(bookData, userName, language = 'ar') {
    const english = language === 'en';
    const personalReport = Array.isArray(bookData?.assessmentProfile?.personality);
    const chapters = personalReport ? PERSONAL_CHAPTERS : CHAPTERS;
    const personalChapterContent = (key) => {
        switch (key) {
            case 'introduction':
                return getChapter1Introduction({
                    fullName: userName,
                    summary: bookData?.free_preview
                }, language);
            case 'personality':
                return getChapter2Personality({
                    assessmentProfile: bookData.assessmentProfile
                }, language);
            case 'strengths':
                return getChapter3Strengths(bookData.assessmentProfile, language);
            case 'narrative':
                return getChapter4LifeNarrative({
                    reflections: bookData.assessmentProfile.reflections,
                    fallbackText: bookData?.chapter3_history
                }, language);
            case 'challenges':
                return getChapter5Challenges({
                    reflections: bookData.assessmentProfile.reflections
                }, language);
            case 'chapter5_roadmap':
                return getChapter6ActionPlan({
                    strengths: bookData.assessmentProfile.strengths,
                    reflections: bookData.assessmentProfile.reflections
                }, language);
            case 'appendix':
                return getChapter7Appendix(bookData.assessmentProfile, language);
            default:
                return textToHtml(bookData?.[key] || '');
        }
    };
    const chapterEntries = chapters.map(({ key, ar, en }) => {
        const title = english ? en : ar;
        const content = personalReport
            ? personalChapterContent(key)
            : escapeHtml(bookData?.[key] || '');
        return {
            title,
            page: `<section class="page chapter-page">
              <header class="page-header">${escapeHtml(bookData?.title || '')}</header>
              <div class="chapter-intro"><h2>${escapeHtml(title)}</h2></div>
              ${personalReport ? content : `<div class="chapter-content">${content}</div>`}
              <footer class="page-footer">${english ? 'A guide for self-reflection' : 'دليل للتأمل الذاتي'}</footer>
            </section>`
        };
    });
    const date = new Intl.DateTimeFormat(english ? 'en' : 'ar', { dateStyle: 'long' }).format(new Date());
    const title = bookData?.title || (english ? 'A Reflective Map of You' : 'خريطة تأملية لذاتك');

    return `<!doctype html>
      <html lang="${english ? 'en' : 'ar'}" dir="${english ? 'ltr' : 'rtl'}">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${getCommonStyles(language)}</head>
        <body>
          ${getCoverPage(userName, date, language, title)}
          ${getTocPage(language, chapters)}
          ${chapterEntries.map(({ page }) => page).join('')}
        </body>
      </html>`;
}

module.exports = { buildBookletHtml, getCommonStyles, getCoverPage, getTocPage };

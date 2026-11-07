const crisisKeywords = {
  ar: {
    suicide: ["انتحار", "أنهي حياتي", "أريد الموت", "لن أعيش", "الموت أفضل", "سأقتل نفسي", "لا فائدة من العيش", "العالم أفضل بدوني", "أتمنى لو مت"],
    selfHarm: ["أجرح نفسي", "أقطع نفسي", "أحرق نفسي", "أؤذي نفسي", "أضرب نفسي"],
    severeDepression: ["لا أستطيع النهوض", "فارغ تماماً", "لا أمل", "لا مخرج", "محاصر", "ميؤوس منه"]
  },
  en: {
    suicide: ["kill myself", "end my life", "want to die", "no reason to live", "better off dead", "world is better without me", "wish i was dead"],
    selfHarm: ["cut myself", "hurt myself", "burn myself", "harm myself", "hit myself"],
    severeDepression: ["can't get out of bed", "completely empty", "no hope", "no way out", "trapped", "hopeless"]
  }
};

function detectCrisis(text, lang = 'ar') {
  if (!text || text.trim().length < 10) {
    return { riskLevel: 'low', score: 0, categories: [], keywordsFound: [] };
  }

  const lowerText = text.toLowerCase();
  const dict = crisisKeywords[lang] || crisisKeywords.ar;
  let score = 0;
  let categories = [];
  let keywordsFound = [];

  for (const [category, keywords] of Object.entries(dict)) {
    let categoryMatches = [];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        categoryMatches.push(keyword);
      }
    }
    
    if (categoryMatches.length > 0) {
      categories.push(category);
      keywordsFound.push(...categoryMatches);
      
      // حساب النقاط حسب الخطورة
      if (category === 'suicide') score += categoryMatches.length * 10;
      else if (category === 'selfHarm') score += categoryMatches.length * 7;
      else if (category === 'severeDepression') score += categoryMatches.length * 3;
    }
  }

  let riskLevel = 'low';
  if (score >= 20 || categories.includes('suicide')) riskLevel = 'critical';
  else if (score >= 10 || categories.includes('selfHarm')) riskLevel = 'high';
  else if (score >= 5) riskLevel = 'moderate';

  return {
    riskLevel,
    score,
    categories: [...new Set(categories)], // إزالة التكرار
    keywordsFound: [...new Set(keywordsFound)]
  };
}

module.exports = { detectCrisis };

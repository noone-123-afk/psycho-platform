const PHRASES = [
  'انتحار',
  'أريد أن أموت',
  'أريد الموت',
  'إنهاء حياتي',
  'أنهي حياتي',
  'لا أريد العيش',
  'أؤذي نفسي',
  'أجرح نفسي',
  'أقطع نفسي',
  'kill myself',
  'end my life',
  'want to die',
  'commit suicide',
  'hurt myself',
  'cut myself',
];

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ARABIC_TRANSLATION = {
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ٱ: 'ا',
  ى: 'ي',
  ؤ: 'و',
  ئ: 'ي',
};

function normalize(text) {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآٱىؤئ]/g, (character) => ARABIC_TRANSLATION[character])
    .replace(/\s+/g, ' ')
    .trim();
}

const NORMALIZED_PHRASES = PHRASES.map(normalize);

export function hasPotentialCrisisSignal(text) {
  if (typeof text !== 'string' || text.length === 0) return false;
  const normalizedText = normalize(text);
  return NORMALIZED_PHRASES.some((phrase) => normalizedText.includes(phrase));
}

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import CrisisSupportNotice from './CrisisSupportNotice';
import { hasPotentialCrisisSignal } from '../utils/crisisSignals';

const isHealthItem = (item) => ['PHQ9', 'GAD7'].includes(item.instrument);

function calculateHealthScores(section, answers) {
  const grouped = new Map();
  for (const item of section.items) {
    const answer = answers[item.id];
    if (!Number.isInteger(answer)) continue;
    if (!grouped.has(item.instrument)) {
      grouped.set(item.instrument, { scale: item.instrument, score: 0, max: 0, answered: 0, total: 0 });
    }
    const result = grouped.get(item.instrument);
    result.score += answer;
    result.max += item.max;
    result.answered += 1;
    result.total += 1;
  }
  return [...grouped.values()];
}

export default function AssessmentQuestionnaire({ onComplete }) {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const [sections, setSections] = useState([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [healthConsent, setHealthConsent] = useState(false);
  const [narrativeConsent, setNarrativeConsent] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const text = useMemo(() => language === 'ar' ? {
    loading: 'جارٍ تحميل الأسئلة من قاعدة البيانات…',
    loadError: 'تعذر تحميل أسئلة التقييم. يرجى تحديث الصفحة أو المحاولة لاحقاً.',
    progress: (current, total) => `القسم ${current} من ${total}`,
    required: 'يرجى الإجابة عن جميع عبارات هذا القسم للمتابعة.',
    choose: 'اختر إجابة',
    consentHealth: 'أوافق على الإجابة عن أسئلة الفحص الصحي الاختيارية. أفهم أن الإجابات والنتائج تبقى في ذاكرة هذا المتصفح ولا تُرسل إلى الخادم أو تحفظ في حسابي، وستختفي عند مغادرة الصفحة.',
    consentNarrative: 'أوافق على حفظ إجابات السيرة التي أكتبها ضمن تقييمي واستخدامها في تقرير التأمل. قد تُضمّن الإجابات في نسخة المراجعة المرسلة إلى بريد إدارة المنصة. سأمتنع عن ذكر معلومات تعريفية عن أشخاص آخرين.',
    skip: 'تجاوز هذا القسم',
    previous: 'السابق',
    next: 'التالي',
    finish: 'إرسال التقييم',
    optional: 'اختياري',
    wordGuide: (count) => `إرشادياً: حتى ${count} كلمة. يمكنك ترك الإجابة فارغة.`,
    submitting: 'جارٍ حفظ إجاباتك وإعداد ملخصك…',
    submitError: 'تعذر حفظ التقييم. إجاباتك ما زالت في هذه الصفحة؛ حاول مرة أخرى.',
    unknownSection: 'قسم التقييم',
    exposureTitle: 'إجاباتك خاصة وحساسة',
    exposureNote: 'إجابات الشخصية والأسئلة السردية التي توافق على إرسالها تُحفظ ضمن التقييم. أسئلة الفحص الصحي اختيارية ولا تُرسل إلى الخادم أو تحفظ.',
  } : {
    loading: 'Loading questions from the database…',
    loadError: 'Unable to load assessment questions. Refresh or try again later.',
    progress: (current, total) => `Section ${current} of ${total}`,
    required: 'Please answer every statement in this section to continue.',
    choose: 'Choose a response',
    consentHealth: 'I agree to answer the optional health-screening questions. I understand the answers and scores remain in this browser’s memory, are not sent to the server or saved to my account, and disappear when I leave the page.',
    consentNarrative: 'I agree to save the life-story responses I write with my assessment and use them in my reflection report. They may be included in the review copy sent to the platform administration email. I will avoid identifying other people.',
    skip: 'Skip this section',
    previous: 'Previous',
    next: 'Next',
    finish: 'Submit assessment',
    optional: 'Optional',
    wordGuide: (count) => `Guide: up to ${count} words. You may leave this blank.`,
    submitting: 'Saving your responses and preparing your summary…',
    submitError: 'We could not save the assessment. Your answers remain on this page; please try again.',
    unknownSection: 'Assessment section',
    exposureTitle: 'Your responses are personal and sensitive',
    exposureNote: 'Personality answers and any life-story responses you consent to submit are saved with the assessment. Health-screening answers are optional and are not sent to the server or saved.',
  }, [language]);

  useEffect(() => {
    let active = true;
    axios.get('/api/assessment/questions')
      .then((response) => {
        if (active) setSections(response.data.sections);
      })
      .catch(() => {
        if (active) setError(text.loadError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [text.loadError]);

  const section = sections[sectionIndex];
  const isLastSection = sectionIndex === sections.length - 1;
  const isEnglish = language === 'en';
  const prompt = (item) => item[language] || item.ar;
  const answerQuestion = (item, value) => {
    setAnswers((current) => ({ ...current, [item.id]: value }));
    setError('');
  };

  async function submitAssessment() {
    const submittedAnswers = Object.fromEntries(
      Object.entries(answers).filter(([id]) => !id.startsWith('PHQ9:') && !id.startsWith('GAD7:'))
    );
    const healthScores = healthConsent ? calculateHealthScores(sectionHealth, answers) : [];
    setIsSubmitting(true);
    setError('');
    try {
      const response = await axios.post('/api/assessment/generate-book', { answers: submittedAnswers });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Assessment submission failed');
      }
      onComplete({ response: response.data, healthScores });
    } catch (requestError) {
      setError(requestError.response?.data?.message || text.submitError);
    } finally {
      setIsSubmitting(false);
    }
  }

  const sectionHealth = sections.find(({ id }) => id === 'health');

  async function goNext() {
    if (!section) return;
    if (section.id === 'ipip' || section.id === 'via') {
      if (section.items.some((item) => !Number.isInteger(answers[item.id]))) {
        setError(text.required);
        return;
      }
    }
    if (section.id === 'health' && healthConsent) {
      if (section.items.some((item) => !Number.isInteger(answers[item.id]))) {
        setError(text.required);
        return;
      }
      const safetyAnswer = answers[section.items.find((item) =>
        item.instrument === 'PHQ9' && item.itemId === 9
      )?.id];
      if (safetyAnswer > 0 && !safetyAcknowledged) {
        setShowSafetyNotice(true);
        return;
      }
    }
    if (section.id === 'narrative') {
      const writtenAnswers = section.items
        .map((item) => answers[item.id])
        .filter((answer) => typeof answer === 'string' && answer.trim());
      if (writtenAnswers.some(hasPotentialCrisisSignal) && !safetyAcknowledged) {
        setShowSafetyNotice(true);
        return;
      }
    }
    setError('');
    if (isLastSection) {
      await submitAssessment();
      return;
    }
    if (section.id === 'health' && !healthConsent) {
      setSectionIndex((current) => current + 1);
      return;
    }
    setSectionIndex((current) => current + 1);
  }

  function answerOptions(sectionItem) {

    return section.responseOptions.filter((option) =>
      option.value >= sectionItem.min && option.value <= sectionItem.max
    ).map((option) => (
      <label key={option.value} className="assessment-response">
        <input
          type="radio"
          name={sectionItem.id}
          value={option.value}
          checked={answers[sectionItem.id] === option.value}
          onChange={() => answerQuestion(sectionItem, option.value)}
        />
        <span>{option[language]}</span>
      </label>
    ));
  }

  if (isLoading) {
    return <section className="account-card" role="status">{text.loading}</section>;
  }
  if (sections.length !== 4 || error && !section) {
    return <section className="account-card" role="alert">{error || text.loadError}</section>;
  }

  return (
    <section className="assessment-questionnaire" dir={isEnglish ? 'ltr' : 'rtl'}>
      {showSafetyNotice && (
        <CrisisSupportNotice
          variant="screening"
          onClose={() => {
            setShowSafetyNotice(false);
            setSafetyAcknowledged(true);
          }}
        />
      )}
      <header className="assessment-intro">
        <h1>{text.exposureTitle}</h1>
        <p>{text.exposureNote}</p>
        <p>{text.progress(sectionIndex + 1, sections.length)}</p>
        <div className="assessment-progress" aria-valuenow={sectionIndex + 1} aria-valuemax={sections.length} role="progressbar">
          <span style={{ width: `${((sectionIndex + 1) / sections.length) * 100}%` }} />
        </div>
      </header>

      <article className="assessment-section">
        <h2>{section.title[language]}</h2>
        <p className="assessment-description">{section.description[language]}</p>
        {section.id === 'health' && (
          <label className="assessment-consent">
            <input
              type="checkbox"
              checked={healthConsent}
              onChange={(event) => {
                setHealthConsent(event.target.checked);
                if (!event.target.checked) {
                  setAnswers((current) => Object.fromEntries(
                    Object.entries(current).filter(([id]) => !id.startsWith('PHQ9:') && !id.startsWith('GAD7:'))
                  ));
                  setSafetyAcknowledged(false);
                }
              }}
            />
            <span>{text.consentHealth}</span>
          </label>
        )}
        {section.id === 'narrative' && (
          <label className="assessment-consent">
            <input
              type="checkbox"
              checked={narrativeConsent}
              onChange={(event) => {
                setNarrativeConsent(event.target.checked);
                if (!event.target.checked) {
                  setAnswers((current) => Object.fromEntries(
                    Object.entries(current).filter(([id]) => !id.startsWith('NARRATIVE:'))
                  ));
                  setSafetyAcknowledged(false);
                }
              }}
            />
            <span>{text.consentNarrative}</span>
          </label>
        )}

        {(section.id !== 'health' || healthConsent) &&
          (section.id !== 'narrative' || narrativeConsent) &&
          section.items.map((item, index) => (
            <fieldset className="assessment-question" key={item.id}>
              <legend>
                <span>{index + 1}. </span>
                {prompt(item)}
              </legend>
              {item.type === 'text' ? (
                <>
                  <textarea
                    value={answers[item.id] || ''}
                    maxLength={Math.min(12000, item.maxWords * 30)}
                    onChange={(event) => answerQuestion(item, event.target.value)}
                    rows={5}
                  />
                  <small>{text.wordGuide(item.maxWords)}</small>
                </>
              ) : (
                <div className={`assessment-options${isHealthItem(item) ? ' assessment-options-compact' : ''}`}>
                  {answerOptions(item)}
                </div>
              )}
            </fieldset>
          ))}

        {error && <p className="assessment-error" role="alert">{error}</p>}
        <nav className="assessment-actions" aria-label={isEnglish ? 'Assessment navigation' : 'التنقل بين الأقسام'}>
          <button
            type="button"
            className="assessment-secondary"
            onClick={() => setSectionIndex((current) => current - 1)}
            disabled={sectionIndex === 0 || isSubmitting}
          >
            {text.previous}
          </button>
          <button
            type="button"
            className="assessment-primary"
            onClick={goNext}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? text.submitting
              : section.id === 'health' && !healthConsent
                ? text.skip
                : isLastSection
                  ? text.finish
                  : text.next}
          </button>
        </nav>
      </article>
    </section>
  );
}

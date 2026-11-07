import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import CrisisAlertModal from './CrisisAlertModal';
import QuestionCard from './QuestionCard';
import { hasPotentialCrisisSignal } from '../utils/crisisSignals';
import { getAuthUserId } from '../utils/auth';
import { filterAssessmentAnswers } from '../utils/assessmentDraft';

function readDraft(draftKey) {
  if (!draftKey || typeof window === 'undefined') {
    return { answers: {}, sectionId: null, questionIndex: 0, narrativeConsent: false, warning: true };
  }
  try {
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) {
      return { answers: {}, sectionId: null, questionIndex: 0, narrativeConsent: false, warning: false };
    }
    const draft = JSON.parse(saved);
    const answers = draft?.answers && typeof draft.answers === 'object' && !Array.isArray(draft.answers)
      ? filterAssessmentAnswers(draft.answers, draft.narrativeConsent === true)
      : {};
    return {
      answers,
      sectionId: typeof draft?.sectionId === 'string' ? draft.sectionId : null,
      questionIndex: Number.isInteger(draft?.questionIndex) ? Math.max(0, draft.questionIndex) : 0,
      narrativeConsent: draft?.narrativeConsent === true,
      warning: false,
    };
  } catch {
    return { answers: {}, sectionId: null, questionIndex: 0, narrativeConsent: false, warning: true };
  }
}

function calculateHealthScores(section, answers) {
  const grouped = new Map();
  for (const item of section?.items || []) {
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

function calculateLiveResults(section, answers, language) {
  const groupField = section.id === 'ipip' ? 'trait' : 'virtue';
  const labels = language === 'ar'
    ? {
      extraversion: 'الانبساطية',
      openness: 'الانفتاح على الخبرة',
      conscientiousness: 'يقظة الضمير',
      agreeableness: 'المقبولية',
      neuroticism: 'العُصابية',
      creativity: 'الإبداع',
      curiosity: 'حب الاستطلاع',
      open_mindedness: 'الانفتاح الذهني',
      love_of_learning: 'حب التعلم',
      perspective: 'الحكمة والمنظور',
      bravery: 'الشجاعة',
      perseverance: 'المثابرة',
      honesty: 'الصدق',
      zest: 'الحيوية',
      love: 'الحب',
      kindness: 'اللطف',
      social_intelligence: 'الذكاء الاجتماعي',
      fairness: 'الإنصاف',
      leadership: 'القيادة',
      teamwork: 'العمل الجماعي',
      wisdom: 'الحكمة',
      courage: 'الشجاعة',
      humanity: 'الإنسانية',
      justice: 'العدالة',
    }
    : {};
  const groups = [...new Set(section.items.map((item) => item[groupField]).filter(Boolean))];

  return groups.map((group) => {
    const items = section.items.filter((item) => item[groupField] === group);
    const values = items
      .map((item) => {
        const value = answers[item.id];
        if (!Number.isInteger(value)) return null;
        return item.scoreDirection === 'negative' ? item.min + item.max - value : value;
      })
      .filter((value) => value !== null);
    return {
      label: labels[group] || group.replaceAll('_', ' '),
      mean: values.length
        ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
        : '—',
      answered: values.length,
      total: items.length,
    };
  }).filter(({ answered }) => answered > 0);
}

export default function AssessmentQuestionnaire({ onComplete }) {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const draftKey = useMemo(() => {
    const userId = getAuthUserId();
    return userId ? `assessmentDraft:${userId}` : null;
  }, []);
  const [savedDraft] = useState(() => readDraft(draftKey));
  const [sections, setSections] = useState([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(savedDraft.answers);
  const [healthConsent, setHealthConsent] = useState(false);
  const [narrativeConsent, setNarrativeConsent] = useState(savedDraft.narrativeConsent);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const [isCrisisAlertOpen, setIsCrisisAlertOpen] = useState(false);
  const [error, setError] = useState('');
  const [draftWarning, setDraftWarning] = useState(savedDraft.warning);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const text = useMemo(() => language === 'ar' ? {
    loading: 'جارٍ تحميل الأسئلة من قاعدة البيانات…',
    loadError: 'تعذر تحميل أسئلة التقييم. يرجى تحديث الصفحة أو المحاولة لاحقاً.',
    progress: (current, total) => `القسم ${current} من ${total}`,
    required: 'يرجى اختيار إجابة للمتابعة.',
    choose: 'اختر إجابة',
    consentHealth: 'أوافق على الإجابة عن أسئلة الفحص الصحي الاختيارية. أفهم أن الإجابات والنتائج تبقى في ذاكرة هذا المتصفح ولا تُرسل إلى الخادم أو تحفظ في حسابي، وستختفي عند مغادرة الصفحة.',
    consentNarrative: 'أوافق على حفظ إجابات السيرة التي أكتبها ضمن تقييمي واستخدامها في تقرير التأمل. تُحفظ مؤقتاً في هذا المتصفح أيضاً حتى إرسال التقييم، وقد تُضمّن في نسخة المراجعة المرسلة إلى بريد إدارة المنصة. سأمتنع عن ذكر معلومات تعريفية عن أشخاص آخرين.',
    skip: 'تجاوز هذا القسم',
    previous: 'السابق',
    next: 'التالي',
    finish: 'إرسال التقييم',
    autosaved: 'يُحفظ تقدمك تلقائياً في هذا المتصفح، باستثناء إجابات الفحص الصحي. تُحذف المسودة بعد إرسال التقييم.',
    autosaveError: 'تعذر حفظ التقدم تلقائياً في هذا المتصفح. ستبقى إجاباتك متاحة ما دامت هذه الصفحة مفتوحة.',
    optionalHealthGate: 'هذا القسم اختياري بالكامل. يمكنك المتابعة من دونه.',
    optionalNarrativeGate: 'هذا القسم اختياري. يمكنك تجاوزه وإرسال التقييم دون كتابة إجابات سردية.',
    wordGuide: (count) => `إرشادياً: حتى ${count} كلمة. يمكنك ترك الإجابة فارغة.`,
    submitting: 'جارٍ حفظ إجاباتك وإعداد ملخصك…',
    submitError: 'تعذر حفظ التقييم. إجاباتك ما زالت في هذه الصفحة؛ حاول مرة أخرى.',
    exposureTitle: 'إجاباتك خاصة وحساسة',
    exposureNote: 'إجابات الشخصية والأسئلة السردية التي توافق على إرسالها تُحفظ ضمن التقييم. أسئلة الفحص الصحي اختيارية ولا تُرسل إلى الخادم أو تحفظ.',
    liveResults: 'ملخص وصفي مباشر',
    liveResultsNote: 'متوسطات أولية لإجاباتك الحالية على عينة غير معيارية؛ ليست تشخيصاً أو مقارنة معيارية.',
    answered: (count, total) => `${count} من ${total} إجابة`,
  } : {
    loading: 'Loading questions from the database…',
    loadError: 'Unable to load assessment questions. Refresh or try again later.',
    progress: (current, total) => `Section ${current} of ${total}`,
    required: 'Choose a response to continue.',
    choose: 'Choose a response',
    consentHealth: 'I agree to answer the optional health-screening questions. I understand the answers and scores remain in this browser’s memory, are not sent to the server or saved to my account, and disappear when I leave the page.',
    consentNarrative: 'I agree to save the life-story responses I write with my assessment and use them in my reflection report. They are also saved temporarily in this browser until submission and may be included in the review copy sent to the platform administration email. I will avoid identifying other people.',
    skip: 'Skip this section',
    previous: 'Previous',
    next: 'Next',
    finish: 'Submit assessment',
    autosaved: 'Your progress is saved automatically in this browser, except for health-screening answers. The draft is removed after you submit.',
    autosaveError: 'Progress could not be saved automatically in this browser. Your answers remain available while this page is open.',
    optionalHealthGate: 'This section is completely optional. You can continue without answering it.',
    optionalNarrativeGate: 'This section is optional. You can skip it and submit without written reflections.',
    wordGuide: (count) => `Guide: up to ${count} words. You may leave this blank.`,
    submitting: 'Saving your responses and preparing your summary…',
    submitError: 'We could not save the assessment. Your answers remain on this page; please try again.',
    exposureTitle: 'Your responses are personal and sensitive',
    exposureNote: 'Personality answers and any life-story responses you consent to submit are saved with the assessment. Health-screening answers are optional and are not sent to the server or saved.',
    liveResults: 'Live descriptive summary',
    liveResultsNote: 'Early averages of your current answers to a non-standardized sample; not a diagnosis or norm comparison.',
    answered: (count, total) => `${count} of ${total} answered`,
  }, [language]);

  useEffect(() => {
    let active = true;
    axios.get('/api/assessment/questions')
      .then((response) => {
        if (!active) return;
        const loadedSections = response.data.sections;
        const restoredSectionIndex = loadedSections.findIndex(({ id }) => id === savedDraft.sectionId);
        if (restoredSectionIndex >= 0) {
          setSectionIndex(restoredSectionIndex);
          setQuestionIndex(Math.min(
            savedDraft.questionIndex,
            loadedSections[restoredSectionIndex].items.length - 1
          ));
        }
        setSections(loadedSections);
      })
      .catch(() => {
        if (active) setError(text.loadError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [savedDraft, text.loadError]);

  useEffect(() => {
    if (!draftKey || !sections.length) return;
    const savedAnswers = filterAssessmentAnswers(answers, narrativeConsent);
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({
        sectionIndex,
        sectionId: sections[sectionIndex]?.id,
        questionIndex: sections[sectionIndex]?.id === 'health' ? 0 : questionIndex,
        answers: savedAnswers,
        narrativeConsent,
      }));
      setDraftWarning(false);
    } catch {
      setDraftWarning(true);
    }
  }, [answers, draftKey, narrativeConsent, questionIndex, sectionIndex, sections]);

  const section = sections[sectionIndex];
  const question = section?.items[questionIndex];
  const sectionHealth = sections.find(({ id }) => id === 'health');
  const isEnglish = language === 'en';
  const isOptionalGate = section?.id === 'health' && !healthConsent
    || section?.id === 'narrative' && !narrativeConsent;
  const isLastQuestion = section && questionIndex === section.items.length - 1;
  const isLastSection = section && sectionIndex === sections.length - 1;
  const totalQuestions = sections.reduce((total, item) => total + item.items.length, 0);
  const questionNumber = sections
    .slice(0, sectionIndex)
    .reduce((total, item) => total + item.items.length, 0) + questionIndex + 1;

  function answerQuestion(value) {
    setAnswers((current) => ({ ...current, [question.id]: value }));
    setError('');
  }

  async function submitAssessment() {
    const submittedAnswers = filterAssessmentAnswers(answers, narrativeConsent);
    const healthScores = healthConsent ? calculateHealthScores(sectionHealth, answers) : [];
    setIsSubmitting(true);
    setError('');
    try {
      const response = await axios.post('/api/assessment/save-progress', { 
        userId: getAuthUserId(),
        narrativeData: submittedAnswers,
        healthScreening: healthScores
      });

      if (response.data.crisisDetected) {
        setIsCrisisAlertOpen(true);
        setIsSubmitting(false);
        return;
      }

      const bookResponse = await axios.post('/api/assessment/generate-book', { answers: submittedAnswers });
      if (!bookResponse.data.success) {
        throw new Error(bookResponse.data.message || 'Assessment submission failed');
      }
      if (draftKey) {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          setDraftWarning(true);
        }
      }
      onComplete({ response: response.data, healthScores });
    } catch (requestError) {
      setError(requestError.response?.data?.message || text.submitError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function goNext() {
    if (!section) return;
    if (isOptionalGate) {
      if (isLastSection) {
        await submitAssessment();
      } else {
        setSectionIndex((current) => current + 1);
        setQuestionIndex(0);
      }
      setError('');
      return;
    }

    if ((section.id === 'ipip' || section.id === 'via' || section.id === 'health') &&
      !Number.isInteger(answers[question.id])) {
      setError(text.required);
      return;
    }

    if (
      section.id === 'health' &&
      question.instrument === 'PHQ9' &&
      question.itemId === 9 &&
      answers[question.id] > 0 &&
      !safetyAcknowledged
    ) {
      setShowSafetyNotice(true);
      return;
    }

    if (isLastQuestion && section.id === 'narrative') {
      const writtenAnswers = section.items
        .map((item) => answers[item.id])
        .filter((answer) => typeof answer === 'string' && answer.trim());
      if (writtenAnswers.some(hasPotentialCrisisSignal) && !safetyAcknowledged) {
        setShowSafetyNotice(true);
        return;
      }
    }

    setError('');
    if (!isLastQuestion) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    if (isLastSection) {
      await submitAssessment();
      return;
    }
    setSectionIndex((current) => current + 1);
    setQuestionIndex(0);
  }

  function goPrevious() {
    setError('');
    if (questionIndex > 0) {
      setQuestionIndex((current) => current - 1);
      return;
    }
    if (sectionIndex > 0) {
      const previousIndex = sectionIndex - 1;
      setSectionIndex(previousIndex);
      setQuestionIndex(sections[previousIndex].items.length - 1);
    }
  }

  if (isLoading) {
    return <section className="account-card" role="status">{text.loading}</section>;
  }
  if (sections.length !== 4 || error && !section) {
    return <section className="account-card" role="alert">{error || text.loadError}</section>;
  }

  const liveResults = section && ['ipip', 'via'].includes(section.id)
    ? calculateLiveResults(section, answers, language)
    : [];
  const healthScores = healthConsent ? calculateHealthScores(sectionHealth, answers) : [];

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
        <p className={draftWarning ? 'assessment-error' : 'assessment-autosave'} role={draftWarning ? 'alert' : 'status'}>
          {draftWarning ? text.autosaveError : text.autosaved}
        </p>
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

        {isOptionalGate ? (
          <p className="assessment-optional-note">
            {section.id === 'health' ? text.optionalHealthGate : text.optionalNarrativeGate}
          </p>
        ) : question && (
          <QuestionCard
            question={question}
            answer={answers[question.id] ?? null}
            onAnswer={answerQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            responseOptions={section.responseOptions}
            language={language}
            chooseLabel={text.choose}
            wordGuide={text.wordGuide}
          />
        )}

        {liveResults.length > 0 && (
          <aside className="assessment-live-results" aria-live="polite">
            <h3>{text.liveResults}</h3>
            <p>{text.liveResultsNote}</p>
            <ul>
              {liveResults.map((result) => (
                <li key={result.label}>
                  <span>{result.label}: <strong>{result.mean}/5</strong></span>
                  <small>{text.answered(result.answered, result.total)}</small>
                </li>
              ))}
            </ul>
          </aside>
        )}
        {section.id === 'health' && healthScores.length > 0 && (
          <aside className="health-score-summary" aria-live="polite">
            <h3>{isEnglish ? 'Optional screening totals' : 'مجموع الفحص الاختياري'}</h3>
            {healthScores.map(({ scale, score, max, answered, total }) => (
              <p key={scale}>
                {scale}: {score}/{max} ({text.answered(answered, total)})
              </p>
            ))}
            <p>{isEnglish
              ? 'Calculated in browser memory only; not a diagnosis and never saved or sent.'
              : 'حُسبت في ذاكرة المتصفح فقط؛ ليست تشخيصاً ولم تُحفظ أو تُرسل.'}</p>
          </aside>
        )}

        {error && <p className="assessment-error" role="alert">{error}</p>}
        <nav className="assessment-actions" aria-label={isEnglish ? 'Assessment navigation' : 'التنقل بين الأقسام'}>
          <button
            type="button"
            className="assessment-secondary"
            onClick={goPrevious}
            disabled={(sectionIndex === 0 && questionIndex === 0) || isSubmitting}
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
              : isOptionalGate
                ? text.skip
                : isLastQuestion && isLastSection
                  ? text.finish
                  : text.next}
          </button>
        </nav>
      </article>

      {/* 🚨 نافذة الطوارئ المنبثقة */}
      <CrisisAlertModal 
        isOpen={isCrisisAlertOpen} 
        onClose={() => setIsCrisisAlertOpen(false)} 
        helplineNumber="911 / 999" 
      />
    </section>
  );
}

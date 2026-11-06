import React from 'react';

export default function QuestionCard({
  question,
  answer,
  onAnswer,
  questionNumber,
  totalQuestions,
  responseOptions,
  language,
  chooseLabel,
  wordGuide,
}) {
  const isEnglish = language === 'en';
  const questionText = question[language] || question.ar;
  const progress = Math.round((questionNumber / totalQuestions) * 100);
  const options = responseOptions.filter(
    (option) => option.value >= question.min && option.value <= question.max,
  );

  return (
    <div className="question-card">
      <div className="question-card-progress">
        <div className="question-card-progress-labels">
          <span>
            {isEnglish
              ? `Question ${questionNumber} of ${totalQuestions}`
              : `السؤال ${questionNumber} من ${totalQuestions}`}
          </span>
          <span>{progress}%</span>
        </div>
        <div
          className="assessment-progress"
          role="progressbar"
          aria-label={isEnglish ? 'Assessment progress' : 'التقدم في التقييم'}
          aria-valuenow={questionNumber}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h3 className="question-card-prompt">{questionText}</h3>

      {question.type === 'text' ? (
        <>
          <textarea
            aria-label={questionText}
            value={typeof answer === 'string' ? answer : ''}
            maxLength={Math.min(12000, question.maxWords * 30)}
            onChange={(event) => onAnswer(event.target.value)}
            rows={5}
          />
          <small>{wordGuide(question.maxWords)}</small>
        </>
      ) : (
        <div className="question-card-options" role="group" aria-label={chooseLabel}>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              aria-pressed={answer === option.value}
              className={`assessment-response${answer === option.value ? ' is-selected' : ''}`}
              onClick={() => onAnswer(option.value)}
            >
              <span>{option[language] || option.ar}</span>
              <span className="question-card-indicator" aria-hidden="true">
                {answer === option.value ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

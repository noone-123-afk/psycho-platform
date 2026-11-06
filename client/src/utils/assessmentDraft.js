export function filterAssessmentAnswers(answers, narrativeConsent) {
  return Object.fromEntries(
    Object.entries(answers).filter(([id]) =>
      !id.startsWith('PHQ9:') &&
      !id.startsWith('GAD7:') &&
      (narrativeConsent || !id.startsWith('NARRATIVE:'))
    )
  );
}

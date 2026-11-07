import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AssessmentQuestionnaire from '../AssessmentQuestionnaire';

let currentLanguage = 'ar';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      get language() {
        return currentLanguage;
      }
    }
  })
}));

vi.mock('../../utils/auth', () => ({
  getAuthUserId: () => 'test-user'
}));

const questionsResponse = {
  data: {
    sections: [
      {
        id: 'ipip',
        title: { ar: 'التواصل والعلاقات', en: 'Communication and relationships' },
        description: { ar: 'وصف عربي', en: 'English description' },
        responseOptions: [
          { value: 1, ar: 'أبداً', en: 'Never' },
          { value: 2, ar: 'نادراً', en: 'Rarely' },
          { value: 3, ar: 'أحياناً', en: 'Sometimes' },
          { value: 4, ar: 'غالباً', en: 'Often' },
          { value: 5, ar: 'دائماً', en: 'Always' }
        ],
        items: [{
          id: 'IPIP_NEO_SAMPLE:1',
          ar: 'أشعر بالراحة في التجمعات',
          en: 'I feel comfortable in gatherings',
          min: 1,
          max: 5,
          type: 'rating',
          trait: 'extraversion'
        }]
      },
      {
        id: 'via',
        title: { ar: 'الفضول والانفتاح', en: 'Curiosity and openness' },
        description: { ar: 'وصف عربي', en: 'English description' },
        responseOptions: [],
        items: []
      },
      {
        id: 'health',
        title: { ar: 'الفحص الصحي', en: 'Health screening' },
        description: { ar: 'وصف عربي', en: 'English description' },
        responseOptions: [],
        items: []
      },
      {
        id: 'narrative',
        title: { ar: 'المشاعر والقيم', en: 'Feelings and values' },
        description: { ar: 'وصف عربي', en: 'English description' },
        responseOptions: [],
        items: []
      }
    ]
  }
};

describe('AssessmentQuestionnaire', () => {
  beforeEach(() => {
    currentLanguage = 'ar';
    localStorage.clear();
    axios.get.mockReturnValue(new Promise(() => {}));
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the loading state while questions are being fetched', () => {
    render(<AssessmentQuestionnaire onComplete={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(/تحميل الأسئلة/i);
  });

  it('renders the question card after loading the question catalog', async () => {
    axios.get.mockResolvedValueOnce(questionsResponse);

    render(<AssessmentQuestionnaire onComplete={vi.fn()} />);

    expect(await screen.findByText('أشعر بالراحة في التجمعات')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /دائماً/i })).toBeInTheDocument();
  });

  it('saves non-health answers to the local draft automatically', async () => {
    axios.get.mockResolvedValueOnce(questionsResponse);

    render(<AssessmentQuestionnaire onComplete={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /دائماً/i }));

    await waitFor(() => {
      const draft = JSON.parse(localStorage.getItem('assessmentDraft:test-user'));
      expect(draft.answers['IPIP_NEO_SAMPLE:1']).toBe(5);
    });
  });

  it('shows the question in the selected language after a language change', async () => {
    axios.get.mockResolvedValueOnce(questionsResponse);

    const { container, rerender } = render(<AssessmentQuestionnaire onComplete={vi.fn()} />);
    expect(await screen.findByText('أشعر بالراحة في التجمعات')).toBeInTheDocument();

    currentLanguage = 'en';
    rerender(<AssessmentQuestionnaire onComplete={vi.fn()} />);

    expect(screen.getByText('I feel comfortable in gatherings')).toBeInTheDocument();
    expect(container.querySelector('.assessment-questionnaire')).toHaveAttribute('dir', 'ltr');
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ar' } })
}));

import { DisclaimerPage, PrivacyPage, TermsPage } from '../LegalPages';

describe('legal pages', () => {
  it('renders the medical disclaimer and links to the other legal pages', () => {
    render(<MemoryRouter><DisclaimerPage /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'إخلاء المسؤولية الطبي' })).toBeInTheDocument();
    expect(screen.getByText(/ليست استشارة قانونية/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'الخصوصية' })).toHaveAttribute('href', '/legal/privacy');
  });

  it('describes current retention limits without claiming full deletion guarantees', () => {
    render(<MemoryRouter><PrivacyPage /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'إشعار الخصوصية والبيانات' })).toBeInTheDocument();
    expect(screen.getByText(/90 يوماً/)).toBeInTheDocument();
    expect(screen.getByText(/لا يوجد انتهاء تلقائي مماثل/)).toBeInTheDocument();
  });

  it('does not make blanket refund or governing-law claims', () => {
    render(<MemoryRouter><TermsPage /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'شروط الاستخدام' })).toBeInTheDocument();
    expect(screen.getByText(/لا تنطبق سياسة استرداد ثابتة/)).toBeInTheDocument();
    expect(screen.getByText(/لم تُحدد جهة تشغيل أو ولاية قضائية/)).toBeInTheDocument();
  });
});

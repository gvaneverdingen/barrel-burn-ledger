import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';

// Simple smoke test — does the component render without crashing?

describe('PasswordStrengthIndicator', () => {
  it('renders strength feedback for a weak password', () => {
    render(<PasswordStrengthIndicator password="abc" showFeedback />);
    expect(screen.getAllByText(/weak|short|must/i).length).toBeGreaterThan(0);
  });

  it('renders strength feedback for a strong password', () => {
    render(<PasswordStrengthIndicator password="MyStr0ng!Pass#2026" showFeedback />);
    // Should show a positive indicator
    expect(screen.queryByText(/weak/i)).not.toBeInTheDocument();
  });
});

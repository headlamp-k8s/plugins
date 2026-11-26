import { act, cleanup, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ExpiryLabel } from './ExpiryLabel';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (value: string) => value }),
}));
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  HoverInfoLabel: ({ label, hoverInfo }: { label: string; hoverInfo: string }) => (
    <span title={hoverInfo}>{label}</span>
  ),
}));
vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  formatDuration: (duration: number) => `${duration}ms`,
  localeDate: (date: string) => `formatted: ${date}`,
}));

describe('ExpiryLabel', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows the positive remaining duration and the exact date on hover', () => {
    const date = '2026-01-02T00:00:00Z';
    render(<ExpiryLabel date={date} />);
    expect(screen.getByText('86400000ms').getAttribute('title')).toBe(`formatted: ${date}`);
  });

  it('updates the countdown and marks a certificate expired when it reaches the date', () => {
    const date = '2026-01-01T00:00:02Z';
    render(<ExpiryLabel date={date} />);
    expect(screen.getByText('2000ms')).toBeTruthy();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('1000ms')).toBeTruthy();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('Expired').getAttribute('title')).toBe(`formatted: ${date}`);
  });

  it('marks an already expired certificate as expired', () => {
    render(<ExpiryLabel date="2025-12-31T00:00:00Z" />);
    expect(screen.getByText('Expired')).toBeTruthy();
  });

  it('indicates malformed timestamps without formatting them as dates', () => {
    render(<ExpiryLabel date="bad-date" />);
    expect(screen.getByText('<invalid>').getAttribute('title')).toBe('bad-date');
  });
});

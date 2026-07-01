import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { DiagnosisResult } from '../../../diagnosis/ProactiveDiagnosisManager';
import ProactiveDiagnosisSection from '../ProactiveDiagnosisSection/ProactiveDiagnosisSection';

// Minimal i18n stub — t() returns the key with interpolations replaced
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, any>) => {
      if (!opts) return key;
      return Object.entries(opts).reduce((s, [k, v]) => s.replace(`{{${k}}}`, String(v)), key);
    },
  }),
}));

function makeDiagnosis(overrides: Partial<DiagnosisResult> = {}): DiagnosisResult {
  return {
    eventUid: 'uid-1',
    event: {
      uid: 'uid-1',
      name: 'pod-warning.1234',
      type: 'Warning',
      reason: 'BackOff',
      message: 'Back-off restarting failed container',
      objectKind: 'Pod',
      objectName: 'nginx-abc',
      objectNamespace: 'default',
      lastTimestamp: new Date().toISOString(),
      rawEvent: {},
    },
    diagnosis: '',
    diagnosedAt: Date.now(),
    loading: false,
    ...overrides,
  };
}

const noop = () => {};

describe('ProactiveDiagnosisSection', () => {
  it('renders nothing when there are no diagnoses and no cycle running', () => {
    const { container } = render(
      <ProactiveDiagnosisSection
        diagnoses={[]}
        scrollToEventUid={null}
        onScrollComplete={noop}
        isCycleRunning={false}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the header when a cycle is running even with no diagnoses', () => {
    render(
      <ProactiveDiagnosisSection
        diagnoses={[]}
        scrollToEventUid={null}
        onScrollComplete={noop}
        isCycleRunning
      />
    );
    expect(screen.getByText('Proactive Diagnosis')).toBeTruthy();
  });

  it('renders event rows with object kind/name and reason chip', () => {
    render(
      <ProactiveDiagnosisSection
        diagnoses={[makeDiagnosis()]}
        scrollToEventUid={null}
        onScrollComplete={noop}
        isCycleRunning={false}
      />
    );
    expect(screen.getByText(/Pod\/nginx-abc/)).toBeTruthy();
    expect(screen.getByText('BackOff')).toBeTruthy();
  });

  it('shows event count chip', () => {
    render(
      <ProactiveDiagnosisSection
        diagnoses={[
          makeDiagnosis(),
          makeDiagnosis({ eventUid: 'uid-2', event: { ...makeDiagnosis().event, uid: 'uid-2' } }),
        ]}
        scrollToEventUid={null}
        onScrollComplete={noop}
        isCycleRunning={false}
      />
    );
    // 2 completed out of 2
    expect(screen.getByText('2/2 events')).toBeTruthy();
  });

  it('renders error alert for failed diagnoses', () => {
    render(
      <ProactiveDiagnosisSection
        diagnoses={[makeDiagnosis({ error: 'Connection timed out' })]}
        scrollToEventUid={null}
        onScrollComplete={noop}
        isCycleRunning={false}
      />
    );
    expect(screen.getByText('Connection timed out')).toBeTruthy();
    expect(screen.getByText('Diagnosis failed')).toBeTruthy();
  });

  it('renders diagnosis content for completed diagnoses', () => {
    render(
      <ProactiveDiagnosisSection
        diagnoses={[
          makeDiagnosis({ diagnosis: 'The pod is crash looping due to a misconfigured probe.' }),
        ]}
        scrollToEventUid={null}
        onScrollComplete={noop}
        isCycleRunning={false}
      />
    );
    expect(screen.getByText('Diagnosis')).toBeTruthy();
    expect(screen.getByText(/crash looping/)).toBeTruthy();
  });

  it('shows Chat divider when diagnoses are present', () => {
    render(
      <ProactiveDiagnosisSection
        diagnoses={[makeDiagnosis({ diagnosis: 'ok' })]}
        scrollToEventUid={null}
        onScrollComplete={noop}
        isCycleRunning={false}
      />
    );
    expect(screen.getByText('Chat')).toBeTruthy();
  });

  it('calls onScrollComplete after scroll-to-event', async () => {
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    const onScrollComplete = vi.fn();
    render(
      <ProactiveDiagnosisSection
        diagnoses={[makeDiagnosis()]}
        scrollToEventUid="uid-1"
        onScrollComplete={onScrollComplete}
        isCycleRunning={false}
      />
    );
    // The component uses a 300ms setTimeout before calling onScrollComplete
    await vi.waitFor(() => expect(onScrollComplete).toHaveBeenCalled(), { timeout: 1000 });
  });
});

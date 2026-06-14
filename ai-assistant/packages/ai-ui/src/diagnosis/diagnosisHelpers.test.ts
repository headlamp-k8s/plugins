import { describe, expect, it } from 'vitest';
import {
  getStatusIcon,
  getStatusLabel,
  getStepIcon,
  getStepIconColor,
  getStepSummary,
  getStepTypeLabel,
  splitDiagnosisContent,
} from './diagnosisHelpers';
import type { DiagnosisResult, DiagnosisThinkingStep } from './ProactiveDiagnosisManager';

/* ── Factories ──────────────────────────────────────────────────── */

function makeDiagnosis(overrides: Partial<DiagnosisResult> = {}): DiagnosisResult {
  return {
    eventUid: 'uid-1',
    event: {
      uid: 'uid-1',
      name: 'evt',
      type: 'Warning',
      reason: 'BackOff',
      message: 'Back-off restarting',
      objectKind: 'Pod',
      objectName: 'my-pod',
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

function makeStep(overrides: Partial<DiagnosisThinkingStep> = {}): DiagnosisThinkingStep {
  return {
    id: 'step-1',
    content: 'some content',
    type: 'intermediate-text',
    timestamp: Date.now(),
    ...overrides,
  };
}

const fakeTheme = {
  palette: {
    info: { main: '#0288d1' },
    success: { main: '#2e7d32' },
    warning: { main: '#ed6c02' },
    text: { secondary: '#666' },
  },
};

/* ── getStatusIcon ──────────────────────────────────────────────── */

describe('getStatusIcon', () => {
  it('returns ⏳ when loading', () => {
    expect(getStatusIcon(makeDiagnosis({ loading: true }))).toBe('⏳');
  });

  it('returns ⬜ when pending', () => {
    expect(getStatusIcon(makeDiagnosis({ pending: true }))).toBe('⬜');
  });

  it('returns ❌ when error', () => {
    expect(getStatusIcon(makeDiagnosis({ error: 'timeout' }))).toBe('❌');
  });

  it('returns ✅ when completed', () => {
    expect(getStatusIcon(makeDiagnosis({ diagnosis: 'all good' }))).toBe('✅');
  });

  it('prioritises loading over pending', () => {
    expect(getStatusIcon(makeDiagnosis({ loading: true, pending: true }))).toBe('⏳');
  });
});

/* ── getStatusLabel ─────────────────────────────────────────────── */

describe('getStatusLabel', () => {
  it('returns Diagnosing… when loading', () => {
    expect(getStatusLabel(makeDiagnosis({ loading: true }))).toBe('Diagnosing…');
  });

  it('returns Queued when pending', () => {
    expect(getStatusLabel(makeDiagnosis({ pending: true }))).toBe('Queued');
  });

  it('returns Failed when error', () => {
    expect(getStatusLabel(makeDiagnosis({ error: 'boom' }))).toBe('Failed');
  });

  it('returns Completed otherwise', () => {
    expect(getStatusLabel(makeDiagnosis())).toBe('Completed');
  });
});

/* ── getStepSummary ─────────────────────────────────────────────── */

describe('getStepSummary', () => {
  it('extracts tool name from tool-start content', () => {
    const step = makeStep({ type: 'tool-start', content: 'Using tool: kubectl get pods' });
    expect(getStepSummary(step)).toBe('kubectl get pods…');
  });

  it('returns "Calling tool…" when tool-start has no colon', () => {
    const step = makeStep({ type: 'tool-start', content: 'no colon here' });
    expect(getStepSummary(step)).toBe('Calling tool…');
  });

  it('returns "Tool done" for tool-result', () => {
    expect(getStepSummary(makeStep({ type: 'tool-result' }))).toBe('Tool done');
  });

  it('returns "Updating plan…" for todo-update', () => {
    expect(getStepSummary(makeStep({ type: 'todo-update' }))).toBe('Updating plan…');
  });

  it('returns "Thinking…" for intermediate-text', () => {
    expect(getStepSummary(makeStep({ type: 'intermediate-text' }))).toBe('Thinking…');
  });
});

/* ── getStepIcon ────────────────────────────────────────────────── */

describe('getStepIcon', () => {
  it.each([
    ['tool-start', 'mdi:wrench'],
    ['tool-result', 'mdi:check'],
    ['todo-update', 'mdi:format-list-checks'],
    ['intermediate-text', 'mdi:message-text-outline'],
  ] as const)('returns %s → %s', (type, expected) => {
    expect(getStepIcon(type)).toBe(expected);
  });
});

/* ── getStepIconColor ───────────────────────────────────────────── */

describe('getStepIconColor', () => {
  it('returns info.main for tool-start', () => {
    expect(getStepIconColor('tool-start', fakeTheme)).toBe('#0288d1');
  });

  it('returns success.main for tool-result', () => {
    expect(getStepIconColor('tool-result', fakeTheme)).toBe('#2e7d32');
  });

  it('returns warning.main for todo-update', () => {
    expect(getStepIconColor('todo-update', fakeTheme)).toBe('#ed6c02');
  });

  it('returns text.secondary for intermediate-text', () => {
    expect(getStepIconColor('intermediate-text', fakeTheme)).toBe('#666');
  });
});

/* ── getStepTypeLabel ───────────────────────────────────────────── */

describe('getStepTypeLabel', () => {
  it.each([
    ['tool-start', 'Tool call'],
    ['tool-result', 'Tool result'],
    ['todo-update', 'Plan update'],
    ['intermediate-text', 'Intermediate'],
  ] as const)('returns %s → %s', (type, expected) => {
    expect(getStepTypeLabel(type)).toBe(expected);
  });
});

/* ── splitDiagnosisContent ──────────────────────────────────────── */

describe('splitDiagnosisContent', () => {
  it('returns empty strings for empty input', () => {
    expect(splitDiagnosisContent('')).toEqual({ thinking: '', answer: '' });
  });

  it('returns entire text as answer when no thinking markers exist', () => {
    const text = 'The pod is healthy and running.';
    expect(splitDiagnosisContent(text)).toEqual({ thinking: '', answer: text });
  });

  it('separates 🔧 tool-call lines from the answer', () => {
    const text = '🔧 kubectl get pods\n🔧 kubectl describe pod/foo\n\nThe pod crashed due to OOM.';
    const result = splitDiagnosisContent(text);
    expect(result.thinking).toContain('🔧 kubectl get pods');
    expect(result.answer).toBe('The pod crashed due to OOM.');
  });

  it('separates Investigation Tasks header from the answer', () => {
    const text = '### Investigation Tasks\n1. ⏳ Check pods\n\nRoot cause: image pull error.';
    const result = splitDiagnosisContent(text);
    expect(result.thinking).toContain('Investigation Tasks');
    expect(result.answer).toBe('Root cause: image pull error.');
  });

  it('handles numbered items with status emojis', () => {
    const text = '1. ✅ Checked pods\n2. ❌ Found error\n\nRemediation: restart the deployment.';
    const result = splitDiagnosisContent(text);
    expect(result.thinking).toContain('1. ✅ Checked pods');
    expect(result.answer).toBe('Remediation: restart the deployment.');
  });

  it('treats everything as answer if all thinking is at the end (no trailing answer)', () => {
    const text = 'Some answer text\n🔧 tool call at end';
    const result = splitDiagnosisContent(text);
    expect(result.thinking).toContain('🔧 tool call at end');
    expect(result.answer).toBe('');
  });

  it('skips blank lines between thinking and answer', () => {
    const text = '🔧 tool\n\n\nActual answer here';
    const result = splitDiagnosisContent(text);
    expect(result.answer).toBe('Actual answer here');
  });

  it('handles mixed thinking and non-thinking blocks', () => {
    const text = 'Intro line\n🔧 tool1\nMiddle line\n🔧 tool2\n\nFinal answer.';
    const result = splitDiagnosisContent(text);
    expect(result.answer).toBe('Final answer.');
    expect(result.thinking).toContain('Intro line');
    expect(result.thinking).toContain('🔧 tool2');
  });
});

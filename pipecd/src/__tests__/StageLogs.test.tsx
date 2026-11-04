/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StageLogs } from '../components/StageLogs';
import { stageLogsCompleted } from './fixtures';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? '')),
  }),
}));

afterEach(() => {
  cleanup();
});

describe('StageLogs', () => {
  it('shows a placeholder when the stage has no log', () => {
    render(<StageLogs log={undefined} />);

    expect(screen.getByText(/No logs available for this stage/i)).toBeTruthy();
  });

  it('shows a placeholder when the stage log has no blocks', () => {
    render(<StageLogs log={{ blocks: [], completed: true }} />);

    expect(screen.getByText(/No logs available for this stage/i)).toBeTruthy();
  });

  it('renders every log block in order', () => {
    render(<StageLogs log={stageLogsCompleted['stage-k8s-sync']} />);

    expect(screen.getByText('Applying manifests...')).toBeTruthy();
    expect(screen.getByText('deployment.apps/frontend configured')).toBeTruthy();
  });

  it('prefixes each line with a PipeCD-style timestamp', () => {
    render(<StageLogs log={stageLogsCompleted['stage-k8s-sync']} />);

    const logs = screen.getByLabelText('stage-logs');

    expect(logs.textContent).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{2}:\d{2}\]/);
  });

  it('numbers the log lines', () => {
    render(<StageLogs log={stageLogsCompleted['stage-k8s-sync']} />);

    const logs = screen.getByLabelText('stage-logs');
    // Gutter numbers are 1-based and sit before each line.
    expect(logs.textContent?.startsWith('1[')).toBe(true);
    expect(logs.textContent).toContain('2[');
  });
});

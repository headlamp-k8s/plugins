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

import { render } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KatibExperimentsList } from './KatibExperimentsList';

/** A column as the list hands it to Headlamp's ResourceListView. */
type Column = string | { id: string; getValue?: (item: unknown) => unknown };

const columns = vi.hoisted(() => [] as Column[]);

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Link: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  ResourceListView: (props: { columns: Column[] }) => {
    columns.push(...props.columns);
    return null;
  },
}));

vi.mock('../../resources/katibExperiment', () => ({ KatibExperimentClass: {} }));
vi.mock('../common/SectionPage', () => ({
  SectionPage: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

/** The value a column shows for an Experiment. */
function valueOf(id: string, item: unknown) {
  const column = columns.find(c => typeof c !== 'string' && c.id === id);
  if (!column || typeof column === 'string') throw new Error(`no column ${id}`);
  return column.getValue?.(item);
}

describe('KatibExperimentsList', () => {
  beforeEach(() => {
    columns.length = 0;
  });

  it('counts trials from the status fields Katib writes', () => {
    // Katib's ExperimentStatus reports trials, trialsSucceeded and trialsFailed.
    const experiment = {
      metadata: { name: 'random', namespace: 'kubeflow-user' },
      spec: { maxTrialCount: 12 },
      status: { trials: 12, trialsSucceeded: 10, trialsFailed: 2 },
    };

    render(<KatibExperimentsList />);

    expect(valueOf('trials', experiment)).toBe('12/12');
    expect(valueOf('failed', experiment)).toBe(2);
  });
});

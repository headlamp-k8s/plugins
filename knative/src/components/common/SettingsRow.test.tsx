/*
 * Copyright 2026 The Kubernetes Authors
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
import { vi } from 'vitest';

const yaml = vi.hoisted(() => [] as { value: string; ariaLabel: string }[]);

vi.mock('./ReadOnlyYaml', () => ({
  ReadOnlyYaml: (props: { value: string; ariaLabel: string }) => {
    yaml.push(props);
    return null;
  },
}));

import { getSettingsRow } from './SettingsRow';

describe('getSettingsRow', () => {
  beforeEach(() => {
    yaml.length = 0;
  });

  it('shows the settings as read-only YAML across the full row', () => {
    const row = getSettingsRow('KafkaChannel', { numPartitions: 3, retentionDuration: 'PT24H' });
    render(<>{row.value}</>);

    expect(row).toMatchObject({ name: 'Settings', valueFullRow: true, hide: false });
    expect(yaml).toEqual([
      {
        value: 'numPartitions: 3\nretentionDuration: PT24H\n',
        ariaLabel: 'KafkaChannel settings YAML',
      },
    ]);
  });

  it('is hidden when the kind has no settings', () => {
    const row = getSettingsRow('PingSource', undefined);
    render(<>{row.value}</>);

    expect(row.hide).toBe(true);
    expect(yaml).toEqual([]);
  });
});

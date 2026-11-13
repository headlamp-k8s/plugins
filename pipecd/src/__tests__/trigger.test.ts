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

import { describe, expect, it } from 'vitest';
import { triggeredBy } from '../utils/trigger';

const t = (key: string): string => key;

describe('triggeredBy', () => {
  it('shows a person who triggered the deployment', () => {
    expect(triggeredBy({ commander: 'alice', timestamp: 0 }, t)).toEqual({
      label: 'alice',
    });
  });

  it('shows an API key id as "API key", keeping the id for the tooltip', () => {
    expect(
      triggeredBy({ commander: '00000000-0000-4000-8000-000000000000', timestamp: 0 }, t)
    ).toEqual({ label: 'API key', detail: '00000000-0000-4000-8000-000000000000' });
  });

  it('falls back to the commit author when there is no commander', () => {
    expect(
      triggeredBy(
        {
          commander: '',
          timestamp: 0,
          commit: {
            hash: 'abc',
            message: 'test',
            author: 'Alice Dev',
            branch: 'main',
            url: '',
            createdAt: 0,
          },
        },
        t
      )
    ).toEqual({ label: 'Alice Dev' });
  });

  it('returns a placeholder when nothing identifies the trigger', () => {
    expect(triggeredBy(undefined, t)).toEqual({ label: '—' });
  });
});

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

import { describe, expect, it } from 'vitest';
import { getTerminatedContainerDisplayStatus } from './containerStatus';

const t = (key: string) => key;

describe('getTerminatedContainerDisplayStatus', () => {
  it('identifies exit code 0 as successful termination', () => {
    expect(getTerminatedContainerDisplayStatus({ exitCode: 0 }, t)).toEqual({
      color: 'green',
      label: 'Terminated successfully',
    });
  });

  it('identifies a nonzero exit code as termination with error', () => {
    expect(getTerminatedContainerDisplayStatus({ exitCode: 1 }, t)).toEqual({
      color: 'red',
      label: 'Terminated with error',
    });
  });

  it('identifies a negative nonzero exit code as termination with error', () => {
    expect(getTerminatedContainerDisplayStatus({ exitCode: -1 }, t)).toEqual({
      color: 'red',
      label: 'Terminated with error',
    });
  });

  it('keeps the outcome unknown when the exit code is absent', () => {
    expect(getTerminatedContainerDisplayStatus({}, t)).toEqual({
      color: 'grey',
      label: 'Terminated',
    });
  });

  it('passes each label through the translator', () => {
    const translate = (key: string) => `[${key}]`;

    expect(getTerminatedContainerDisplayStatus({ exitCode: 0 }, translate).label).toBe(
      '[Terminated successfully]'
    );
    expect(getTerminatedContainerDisplayStatus({ exitCode: 2 }, translate).label).toBe(
      '[Terminated with error]'
    );
    expect(getTerminatedContainerDisplayStatus({}, translate).label).toBe('[Terminated]');
  });
});

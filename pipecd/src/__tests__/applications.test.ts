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

import { afterEach, describe, expect, it, vi } from 'vitest';
import * as pipecdApi from '../api/pipecd';
import { listAllApplications, MAX_APPLICATION_PAGES } from '../utils/applications';
import { appKubernetesSynced, appTerraformOutOfSync } from './fixtures';

vi.mock('../api/pipecd', async importOriginal => {
  const original = await importOriginal<typeof import('../api/pipecd')>();
  return { ...original, listApplications: vi.fn() };
});

const CONFIG = { baseURL: 'https://pipecd.example.com', apiKey: 'key' };

describe('listAllApplications', () => {
  afterEach(() => {
    vi.mocked(pipecdApi.listApplications).mockReset();
  });

  it('follows a page of repeats that has a new cursor', async () => {
    vi.mocked(pipecdApi.listApplications)
      .mockResolvedValueOnce({ applications: [appKubernetesSynced], cursor: 'c1' })
      .mockResolvedValueOnce({ applications: [appKubernetesSynced], cursor: 'c2' })
      .mockResolvedValueOnce({ applications: [appTerraformOutOfSync], cursor: '' });

    const apps = await listAllApplications(CONFIG, { timedOut: 'timed out' });

    expect(apps.map(a => a.id)).toEqual([appKubernetesSynced.id, appTerraformOutOfSync.id]);
  });

  it('stops when a cursor comes back', async () => {
    let calls = 0;
    vi.mocked(pipecdApi.listApplications).mockImplementation(async () => {
      calls++;
      return { applications: [appKubernetesSynced], cursor: calls % 2 ? 'c1' : 'c2' };
    });

    await listAllApplications(CONFIG, { timedOut: 'timed out' });

    expect(calls).toBe(3);
  });

  it('gives up after a page limit when every cursor is new', async () => {
    let calls = 0;
    vi.mocked(pipecdApi.listApplications).mockImplementation(async () => {
      calls++;
      return { applications: [appKubernetesSynced], cursor: `c${calls}` };
    });

    const apps = await listAllApplications(CONFIG, { timedOut: 'timed out' });

    expect(calls).toBe(MAX_APPLICATION_PAGES);
    expect(apps).toHaveLength(1);
  });
});

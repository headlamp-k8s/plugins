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

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { enqueueSnackbar } = vi.hoisted(() => ({ enqueueSnackbar: vi.fn() }));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar }),
}));

import { useArgoOperation } from './useArgoOperation';

beforeEach(() => enqueueSnackbar.mockReset());

describe('useArgoOperation', () => {
  it('returns true and forwards operation-specific arguments after success', async () => {
    const operation = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() => useArgoOperation(operation, 'Rollback'));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.execute('guestbook', 'argocd', 'revision-1');
    });

    expect(succeeded).toBe(true);
    expect(operation).toHaveBeenCalledWith('guestbook', 'argocd', 'revision-1');
    expect(enqueueSnackbar).toHaveBeenCalledWith('Rollback triggered for guestbook', {
      variant: 'success',
    });
  });

  it('returns false and keeps existing error feedback after failure', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('controller rejected operation'));
    const { result } = renderHook(() => useArgoOperation(operation, 'Rollback'));

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.execute('guestbook', 'argocd');
    });

    expect(succeeded).toBe(false);
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'Failed to rollback guestbook: controller rejected operation',
      { variant: 'error' }
    );
  });
});

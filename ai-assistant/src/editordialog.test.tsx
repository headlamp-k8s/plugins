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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apply: vi.fn(),
  clusterAction: vi.fn(async (action: () => Promise<unknown>) => action()),
  enqueueSnackbar: vi.fn(),
  getCluster: vi.fn<() => string | null>(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  clusterAction: mocks.clusterAction,
  useTranslation: () => ({
    t: (key: string, options: Record<string, unknown> = {}) =>
      key.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options[name] ?? name)),
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ apply: mocks.apply }));
vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({ getCluster: mocks.getCluster }));
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Dialog: ({ open, children }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div role="dialog">{children}</div> : null,
}));
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="YAML" value={value} onChange={event => onChange(event.target.value)} />
  ),
}));
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }),
}));

import EditorDialog from './editordialog';

const yamlContent = `apiVersion: v1
kind: ServiceAccount
metadata:
  name: workload-identity
  namespace: demo
  annotations:
    azure.workload.identity/client-id: test-client-id
`;

describe('EditorDialog cluster targeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCluster.mockReturnValue(null);
    mocks.apply.mockResolvedValue({ metadata: { name: 'workload-identity' } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function openEditor(targetCluster?: string | null) {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(
      <EditorDialog
        targetCluster={targetCluster}
        open
        onClose={onClose}
        yamlContent={yamlContent}
        title="Apply ServiceAccount"
        resourceType="ServiceAccount"
        onSuccess={onSuccess}
      />
    );
    return { onClose, onSuccess };
  }

  it('applies to the assistant cluster from a page without a cluster in its URL', async () => {
    const { onClose, onSuccess } = openEditor('aks-workload');

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: aks-workload');
    fireEvent.click(screen.getByRole('button', { name: 'Apply to Cluster' }));

    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'ServiceAccount' }),
        'aks-workload'
      )
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledWith({ metadata: { name: 'workload-identity' } });
    expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();
  });

  it('does not retarget the operation when the page cluster changes after opening', async () => {
    openEditor('aks-workload');
    mocks.getCluster.mockReturnValue('different-cluster');

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: aks-workload');
    fireEvent.click(screen.getByRole('button', { name: 'Apply to Cluster' }));

    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(expect.anything(), 'aks-workload')
    );
  });

  it('preserves route-based targeting for callers that do not supply a cluster', async () => {
    mocks.getCluster.mockReturnValue('route-cluster');
    openEditor();

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: route-cluster');
    fireEvent.click(screen.getByRole('button', { name: 'Apply to Cluster' }));

    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(expect.anything(), 'route-cluster')
    );
  });

  it.each([null, undefined])(
    'shows a warning and disables apply when the target is missing (%s)',
    targetCluster => {
      const { onClose } = openEditor(targetCluster);
      const applyButton = screen.getByRole('button', { name: 'Apply to Cluster' });

      expect(screen.getByRole('alert').textContent).toBe('No cluster selected');
      expect(applyButton.hasAttribute('disabled')).toBe(true);
      fireEvent.click(applyButton);

      expect(mocks.apply).not.toHaveBeenCalled();
      expect(mocks.clusterAction).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();
    }
  );

  it('does not fall back to a newly navigated cluster when the assistant had no target', () => {
    openEditor(null);
    mocks.getCluster.mockReturnValue('unrelated-cluster');

    const applyButton = screen.getByRole('button', { name: 'Apply to Cluster' });
    expect(screen.getByRole('alert').textContent).toBe('No cluster selected');
    expect(applyButton.hasAttribute('disabled')).toBe(true);
    fireEvent.click(applyButton);

    expect(mocks.apply).not.toHaveBeenCalled();
    expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();
  });

  it('applies to the displayed route cluster rather than re-reading the URL on click', async () => {
    mocks.getCluster.mockReturnValue('displayed-cluster');
    openEditor();
    expect(screen.getByRole('alert').textContent).toBe('Target cluster: displayed-cluster');
    mocks.getCluster.mockReturnValue('different-cluster');

    fireEvent.click(screen.getByRole('button', { name: 'Apply to Cluster' }));

    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(expect.anything(), 'displayed-cluster')
    );
  });

  it('applies user edits to the same target', async () => {
    openEditor('aks-workload');
    fireEvent.change(screen.getByRole('textbox', { name: 'YAML' }), {
      target: { value: yamlContent.replace('test-client-id', 'updated-client-id') },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply to Cluster' }));

    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            annotations: { 'azure.workload.identity/client-id': 'updated-client-id' },
          }),
        }),
        'aks-workload'
      )
    );
  });
});

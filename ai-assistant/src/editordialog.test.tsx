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
  useClustersConf: vi.fn<() => Record<string, unknown> | null>(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  clusterAction: mocks.clusterAction,
  K8s: { useClustersConf: mocks.useClustersConf },
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
    mocks.useClustersConf.mockReturnValue(
      Object.fromEntries(
        [
          'aks-workload',
          'cluster-a',
          'cluster-b',
          'route-cluster',
          'displayed-cluster',
          'original-cluster',
          'first-cluster',
          'second-cluster',
        ].map(name => [name, {}])
      )
    );
    mocks.apply.mockResolvedValue({ metadata: { name: 'workload-identity' } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function openEditor(targetCluster?: string | null) {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const props = {
      targetCluster,
      open: true,
      onClose,
      yamlContent,
      title: 'Apply ServiceAccount',
      resourceType: 'ServiceAccount',
      onSuccess,
    };
    const { rerender } = render(<EditorDialog {...props} />);
    return { onClose, onSuccess, props, rerender };
  }

  it.each([
    { availableClusters: ['cluster-a', 'cluster-b'] },
    { availableClusters: ['cluster-b'] },
  ])(
    'requires an explicit choice for an unverified target with clusters $availableClusters',
    async ({ availableClusters }) => {
      mocks.getCluster.mockReturnValue('cluster-a');
      render(
        <EditorDialog
          open
          onClose={vi.fn()}
          yamlContent={yamlContent}
          title="Apply ServiceAccount"
          targetCluster={null}
          availableClusters={availableClusters}
        />
      );
      expect(
        screen.getByRole('button', { name: 'Apply to Cluster' }).hasAttribute('disabled')
      ).toBe(true);
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Target cluster' }));
      fireEvent.click(screen.getByRole('option', { name: 'cluster-b' }));
      expect(screen.getByRole('alert').textContent).toBe('Target cluster: cluster-b');
      fireEvent.click(screen.getByRole('button', { name: 'Apply to cluster-b' }));
      await waitFor(() => expect(mocks.apply).toHaveBeenCalledWith(expect.anything(), 'cluster-b'));
      expect(mocks.apply).toHaveBeenCalledOnce();
    }
  );

  it('does not retarget an open editor when the supplied chat context changes', async () => {
    const { props, rerender } = openEditor('cluster-a');
    rerender(<EditorDialog {...props} targetCluster="cluster-b" />);
    expect(screen.getByRole('alert').textContent).toBe('Target cluster: cluster-a');
    fireEvent.click(screen.getByRole('button', { name: 'Apply to cluster-a' }));
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledWith(expect.anything(), 'cluster-a'));
  });

  it('lets the user override a known chat target without later rerenders undoing the choice', async () => {
    const { props, rerender } = openEditor('cluster-b');
    const availableClusters = ['cluster-a', 'cluster-b'];
    rerender(<EditorDialog {...props} availableClusters={availableClusters} />);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Target cluster' }));
    fireEvent.click(screen.getByRole('option', { name: 'cluster-a' }));
    mocks.getCluster.mockReturnValue('unrelated-cluster');
    rerender(<EditorDialog {...props} availableClusters={availableClusters} />);

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: cluster-a');
    fireEvent.click(screen.getByRole('button', { name: 'Apply to cluster-a' }));
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledWith(expect.anything(), 'cluster-a'));
    expect(mocks.apply).toHaveBeenCalledOnce();
  });

  it('disables applying when the captured cluster is removed instead of choosing another', () => {
    const { props, rerender } = openEditor('cluster-b');
    rerender(<EditorDialog {...props} availableClusters={['cluster-a']} />);
    expect(screen.getByRole('alert').textContent).toContain('cluster-b');
    expect(screen.getByRole('alert').textContent).toContain('not available');
    expect(screen.getByRole('button', { name: 'Apply to Cluster' }).hasAttribute('disabled')).toBe(
      true
    );
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it.each([undefined, 'cluster-b'])(
    'validates standalone targets against Headlamp configuration (%s)',
    targetCluster => {
      mocks.getCluster.mockReturnValue('cluster-b');
      mocks.useClustersConf.mockReturnValue({ 'cluster-a': {} });
      openEditor(targetCluster);
      expect(screen.getByRole('alert').textContent).toContain('cluster-b');
      expect(screen.getByRole('alert').textContent).toContain('not available');
      expect(
        screen.getByRole('button', { name: 'Apply to Cluster' }).hasAttribute('disabled')
      ).toBe(true);
      expect(mocks.apply).not.toHaveBeenCalled();
    }
  );

  it('disables a removed standalone target without switching to the newly selected route', () => {
    const { props, rerender } = openEditor('cluster-b');
    expect(
      screen.getByRole('button', { name: 'Apply to cluster-b' }).hasAttribute('disabled')
    ).toBe(false);
    mocks.getCluster.mockReturnValue('cluster-a');
    mocks.useClustersConf.mockReturnValue({ 'cluster-a': {} });
    rerender(<EditorDialog {...props} />);
    expect(screen.getByRole('alert').textContent).toContain('cluster-b');
    expect(screen.getByRole('alert').textContent).toContain('not available');
    expect(screen.getByRole('button', { name: 'Apply to Cluster' }).hasAttribute('disabled')).toBe(
      true
    );
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it('waits for standalone cluster configuration before enabling a captured target', () => {
    mocks.useClustersConf.mockReturnValue(null);
    const { props, rerender } = openEditor('cluster-b');
    expect(screen.getByRole('alert').textContent).toBe('Loading clusters...');
    expect(screen.getByRole('button', { name: 'Apply to Cluster' }).hasAttribute('disabled')).toBe(
      true
    );
    mocks.getCluster.mockReturnValue('cluster-a');
    mocks.useClustersConf.mockReturnValue({ 'cluster-b': {} });
    rerender(<EditorDialog {...props} />);
    expect(screen.getByRole('alert').textContent).toBe('Target cluster: cluster-b');
    expect(
      screen.getByRole('button', { name: 'Apply to cluster-b' }).hasAttribute('disabled')
    ).toBe(false);
  });

  it('applies to the assistant cluster from a page without a cluster in its URL', async () => {
    const { onClose, onSuccess } = openEditor('aks-workload');

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: aks-workload');
    fireEvent.click(screen.getByRole('button', { name: /^Apply to / }));

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
    fireEvent.change(screen.getByRole('textbox', { name: 'YAML' }), {
      target: { value: yamlContent.replace('test-client-id', 'updated-client-id') },
    });

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: aks-workload');
    fireEvent.click(screen.getByRole('button', { name: /^Apply to / }));

    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(expect.anything(), 'aks-workload')
    );
  });

  it('preserves route-based targeting for callers that do not supply a cluster', async () => {
    mocks.getCluster.mockReturnValue('route-cluster');
    openEditor();

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: route-cluster');
    fireEvent.click(screen.getByRole('button', { name: /^Apply to / }));

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
    fireEvent.change(screen.getByRole('textbox', { name: 'YAML' }), {
      target: { value: yamlContent.replace('test-client-id', 'updated-client-id') },
    });

    const applyButton = screen.getByRole('button', { name: 'Apply to Cluster' });
    expect(screen.getByRole('alert').textContent).toBe('No cluster selected');
    expect(applyButton.hasAttribute('disabled')).toBe(true);
    fireEvent.click(applyButton);

    expect(mocks.apply).not.toHaveBeenCalled();
    expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();
  });

  it('keeps the displayed route cluster when navigation is followed by a YAML edit', async () => {
    mocks.getCluster.mockReturnValue('displayed-cluster');
    openEditor();
    expect(screen.getByRole('alert').textContent).toBe('Target cluster: displayed-cluster');
    mocks.getCluster.mockReturnValue('different-cluster');
    fireEvent.change(screen.getByRole('textbox', { name: 'YAML' }), {
      target: { value: yamlContent.replace('test-client-id', 'updated-client-id') },
    });

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: displayed-cluster');
    fireEvent.click(screen.getByRole('button', { name: /^Apply to / }));

    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            annotations: { 'azure.workload.identity/client-id': 'updated-client-id' },
          }),
        }),
        'displayed-cluster'
      )
    );
  });

  it('keeps the captured route cluster when new YAML causes a parent rerender', async () => {
    mocks.getCluster.mockReturnValue('original-cluster');
    const { props, rerender } = openEditor();
    mocks.getCluster.mockReturnValue('different-cluster');

    rerender(
      <EditorDialog
        {...props}
        yamlContent={yamlContent.replace('test-client-id', 'replacement-client-id')}
      />
    );

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: original-cluster');
    fireEvent.click(screen.getByRole('button', { name: /^Apply to / }));

    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            annotations: { 'azure.workload.identity/client-id': 'replacement-client-id' },
          }),
        }),
        'original-cluster'
      )
    );
  });

  it('captures the current route when a mounted editor first opens and reopens', async () => {
    mocks.getCluster.mockReturnValue('closed-cluster');
    const props = {
      open: false,
      onClose: vi.fn(),
      yamlContent,
      title: 'Apply ServiceAccount',
    };
    const { rerender } = render(<EditorDialog {...props} />);

    mocks.getCluster.mockReturnValue('first-cluster');
    rerender(<EditorDialog {...props} open />);
    expect(screen.getByRole('alert').textContent).toBe('Target cluster: first-cluster');
    fireEvent.click(screen.getByRole('button', { name: /^Apply to / }));
    await waitFor(() =>
      expect(mocks.apply).toHaveBeenNthCalledWith(1, expect.anything(), 'first-cluster')
    );

    rerender(<EditorDialog {...props} />);
    mocks.getCluster.mockReturnValue('second-cluster');
    rerender(<EditorDialog {...props} open />);

    expect(screen.getByRole('alert').textContent).toBe('Target cluster: second-cluster');
    fireEvent.click(screen.getByRole('button', { name: /^Apply to / }));
    await waitFor(() =>
      expect(mocks.apply).toHaveBeenNthCalledWith(2, expect.anything(), 'second-cluster')
    );
  });

  it('keeps a targetless standalone editor disabled after navigation and a YAML edit', () => {
    openEditor();
    mocks.getCluster.mockReturnValue('unrelated-cluster');
    fireEvent.change(screen.getByRole('textbox', { name: 'YAML' }), {
      target: { value: yamlContent.replace('test-client-id', 'updated-client-id') },
    });

    expect(screen.getByRole('alert').textContent).toBe('No cluster selected');
    const applyButton = screen.getByRole('button', { name: 'Apply to Cluster' });
    expect(applyButton.hasAttribute('disabled')).toBe(true);
    fireEvent.click(applyButton);
    expect(mocks.apply).not.toHaveBeenCalled();
    expect(mocks.clusterAction).not.toHaveBeenCalled();
  });

  it('applies user edits to the same target', async () => {
    openEditor('aks-workload');
    fireEvent.change(screen.getByRole('textbox', { name: 'YAML' }), {
      target: { value: yamlContent.replace('test-client-id', 'updated-client-id') },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Apply to / }));

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

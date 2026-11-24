import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VANILLA_HELM_REPO } from '../../constants/catalog';
import { EditorDialog } from './EditorDialog';

const { mockFetchChartValues, mockFetchChartDetail } = vi.hoisted(() => ({
  mockFetchChartValues: vi.fn(),
  mockFetchChartDetail: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Namespace: { useList: () => [[{ metadata: { name: 'default' } }], null] },
    },
  },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) =>
      values
        ? Object.entries(values).reduce(
            (message, [name, value]) => message.replace(`{{ ${name} }}`, String(value)),
            key
          )
        : key,
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  Loader: ({ title }: { title: string }) => <div>{title}</div>,
}));

// Monaco doesn't run in jsdom, and the values editor isn't what this test is about.
vi.mock('@monaco-editor/react', () => ({ default: () => <div>values editor</div> }));

vi.mock('../../api/charts', () => ({
  fetchChartDetailFromArtifact: mockFetchChartDetail,
  fetchChartValues: mockFetchChartValues,
}));

vi.mock('../../api/releases', () => ({ createRelease: vi.fn(), getActionStatus: vi.fn() }));
vi.mock('../../api/repository', () => ({ addRepository: vi.fn() }));

const podinfo = {
  name: 'podinfo',
  version: '6.0.0',
  package_id: 'podinfo-id',
  repository: { name: 'podinfo' },
};
const nginx = {
  name: 'nginx',
  version: '1.0.0',
  package_id: 'nginx-id',
  repository: { name: 'bitnami' },
};

function renderDialog(chart: typeof podinfo) {
  return (
    <EditorDialog
      openEditor
      chart={chart}
      handleEditor={() => {}}
      chartProfile={VANILLA_HELM_REPO}
    />
  );
}

const installDisabled = () =>
  (screen.getByRole('button', { name: 'Install' }) as HTMLButtonElement).disabled;

describe('EditorDialog', () => {
  beforeEach(() => {
    mockFetchChartDetail.mockReset();
    mockFetchChartValues.mockReset();
    mockFetchChartDetail.mockImplementation((name: string) =>
      Promise.resolve({
        available_versions:
          name === 'podinfo'
            ? [{ version: '6.0.0' }, { version: '5.0.0' }]
            : [{ version: '1.0.0' }],
      })
    );
    // The first values fetch fails, later ones work.
    mockFetchChartValues
      .mockRejectedValueOnce(new Error('Request failed'))
      .mockResolvedValue('replicaCount: 1\n');
  });

  it('enables Install again when another version loads after a failed values fetch', async () => {
    render(renderDialog(podinfo));

    await waitFor(() => expect(mockFetchChartValues).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(installDisabled()).toBe(true));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Versions *' }));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('5.0.0'));

    await waitFor(() =>
      expect(mockFetchChartValues).toHaveBeenLastCalledWith('podinfo-id', '5.0.0')
    );
    await waitFor(() => expect(installDisabled()).toBe(false));
  });

  it('enables Install for the next chart after a failed values fetch', async () => {
    const { rerender } = render(renderDialog(podinfo));
    await waitFor(() => expect(installDisabled()).toBe(true));

    rerender(renderDialog(nginx));

    await waitFor(() => expect(mockFetchChartValues).toHaveBeenLastCalledWith('nginx-id', '1.0.0'));
    await waitFor(() => expect(installDisabled()).toBe(false));
  });
});

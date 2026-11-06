import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FluxHelmReleaseDetailView } from './HelmReleaseSingle';

const mocks = vi.hoisted(() => ({ cr: null as any }));

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', async importOriginal => ({
  ...(await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib/components/common')>()),
  MainInfoSection: ({ extraInfo }: { extraInfo: Array<{ name: string; value: ReactNode }> }) => (
    <dl>
      {extraInfo.map(row => (
        <div key={row.name} data-testid={`info-${row.name}`}>
          {row.value}
        </div>
      ))}
    </dl>
  ),
  SectionBox: () => null,
  Table: () => null,
  ConditionsTable: () => null,
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../common/Resources', () => ({
  HelmRelease: { useGet: () => [mocks.cr] },
}));

vi.mock('../helpers/index', () => ({
  getSourceNameAndPluralKind: (item: any) => {
    const ref = item.jsonData.spec.chartRef ?? item.jsonData.spec.chart?.spec?.sourceRef;
    return { name: ref.name, pluralKind: 'sources', namespace: ref.namespace };
  },
  ObjectEvents: () => null,
}));

vi.mock('../actions/index', () => ({
  ForceReconciliationAction: () => null,
  ResumeAction: () => null,
  SuspendAction: () => null,
  SyncWithoutSourceAction: () => null,
  SyncWithSourceAction: () => null,
}));
vi.mock('../common/RemainingTimeDisplay', () => ({ default: () => null }));
vi.mock('../common/StatusLabel', () => ({ default: () => null }));
vi.mock('./Inventory', () => ({ HelmInventory: () => null }));
vi.mock('@monaco-editor/react', () => ({ default: () => null }));

function helmRelease(spec: Record<string, unknown>) {
  return {
    jsonData: {
      kind: 'HelmRelease',
      metadata: { name: 'podinfo', namespace: 'apps' },
      spec: { interval: '5m', ...spec },
    },
    metadata: { name: 'podinfo', namespace: 'apps' },
  };
}

function renderDetailView() {
  render(
    <MemoryRouter>
      <FluxHelmReleaseDetailView name="podinfo" namespace="apps" />
    </MemoryRouter>
  );
}

describe('FluxHelmReleaseDetailView', () => {
  beforeEach(() => {
    mocks.cr = null;
  });

  it('shows the chart name from spec.chart, not the source name', () => {
    mocks.cr = helmRelease({
      chart: {
        spec: {
          chart: 'podinfo-chart',
          version: '6.x',
          sourceRef: { kind: 'HelmRepository', name: 'stefanprodan' },
        },
      },
    });

    renderDetailView();

    expect(screen.getByTestId('info-Chart').textContent).toBe('podinfo-chart');
    expect(screen.getByTestId('info-Source Ref').textContent).toBe('stefanprodan');
  });

  it('falls back to the source name when the chart comes from spec.chartRef', () => {
    mocks.cr = helmRelease({
      chartRef: { kind: 'OCIRepository', name: 'podinfo-oci' },
    });

    renderDetailView();

    expect(screen.getByTestId('info-Chart').textContent).toBe('podinfo-oci');
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params?.name) {
        return key.replace('{{name}}', params.name);
      }
      return key;
    },
  }),
  registerDetailsViewSection: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  MainInfoSection: (props: {
    resource: unknown;
    extraInfo: unknown;
    actions: React.ReactNode[];
  }) => (
    <div data-testid="main-info-section">
      {props.actions?.map((action, idx) => (
        <React.Fragment key={idx}>{action}</React.Fragment>
      ))}
    </div>
  ),
  SectionBox: (props: { title: string; children: React.ReactNode }) => (
    <div data-testid={`section-${props.title}`}>{props.children}</div>
  ),
  ConditionsTable: () => null,
  Table: () => null,
  Link: (props: { children: React.ReactNode }) => <span>{props.children}</span>,
  ActionButton: (props: { description: string; icon: string; onClick: () => void }) => (
    <button
      data-testid="action-button"
      data-description={props.description}
      onClick={props.onClick}
    >
      {props.description}
    </button>
  ),
  ConfirmDialog: () => null,
}));

vi.mock('@monaco-editor/react', () => ({
  default: () => null,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ name: 'my-release', namespace: 'default' }),
}));

const mockUseGet = vi.fn();
vi.mock('../common/Resources', () => ({
  HelmRelease: {
    useGet: (...args: unknown[]) => mockUseGet(...args),
  },
}));

vi.mock('../common/StatusLabel', () => ({
  default: () => null,
}));

vi.mock('../common/RemainingTimeDisplay', () => ({
  default: () => null,
}));

vi.mock('../helpers/index', () => ({
  getSourceNameAndPluralKind: () => ({
    name: 'my-source',
    pluralKind: 'helmcharts',
    namespace: 'default',
  }),
  ObjectEvents: () => null,
}));

vi.mock('./Inventory', () => ({
  HelmInventory: () => null,
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock('../sources/Source', () => ({
  useSource: () => null,
}));

import { FluxHelmReleaseDetailView } from './HelmReleaseSingle';

describe('FluxHelmReleaseDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without throwing when resource.jsonData.spec is missing', () => {
    const resourceWithoutSpec = {
      kind: 'HelmRelease',
      metadata: { name: 'my-release', namespace: 'default' },
      jsonData: {
        kind: 'HelmRelease',
        metadata: { name: 'my-release', namespace: 'default' },
        // spec is omitted
      },
      constructor: {
        apiEndpoint: {
          patch: vi.fn().mockResolvedValue({ spec: {} }),
          get: vi.fn(),
        },
      },
    };

    mockUseGet.mockReturnValue([resourceWithoutSpec]);

    expect(() => {
      render(<FluxHelmReleaseDetailView name="my-release" namespace="default" />);
    }).not.toThrow();

    // Verify actions: ResumeAction and ForceReconciliationAction should be omitted
    const buttons = screen.getAllByTestId('action-button');
    const descriptions = buttons.map(b => b.getAttribute('data-description'));

    // Suspend action is still available (defaults to suspend: false)
    expect(descriptions).toContain('Suspend');
    // Resume action is absent
    expect(descriptions).not.toContain('Resume');
    // ForceReconciliation action is absent
    expect(descriptions.some(d => d?.includes('force reconciliation'))).toBe(false);
  });

  it('renders all actions for a normal resource with a valid spec', () => {
    const normalResource = {
      kind: 'HelmRelease',
      metadata: { name: 'my-release', namespace: 'default' },
      jsonData: {
        kind: 'HelmRelease',
        metadata: { name: 'my-release', namespace: 'default' },
        spec: {
          suspend: true,
          force: true,
          interval: '5m',
        },
      },
      constructor: {
        apiEndpoint: {
          patch: vi.fn().mockResolvedValue({ spec: {} }),
          get: vi.fn(),
        },
      },
    };

    mockUseGet.mockReturnValue([normalResource]);

    render(<FluxHelmReleaseDetailView name="my-release" namespace="default" />);

    const buttons = screen.getAllByTestId('action-button');
    const descriptions = buttons.map(b => b.getAttribute('data-description'));

    // Suspend is omitted because suspend is already true
    expect(descriptions).not.toContain('Suspend');
    // Resume action is available
    expect(descriptions).toContain('Resume');
    // ForceReconciliation action is available (disable button since force: true)
    expect(descriptions.some(d => d?.includes('Disable force reconciliation'))).toBe(true);
  });
});

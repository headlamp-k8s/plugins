import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FluxKustomizationDetailView } from './KustomizationSingle';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      let result = key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, v);
        });
      }
      return result;
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
  useParams: () => ({ name: 'my-kustomization', namespace: 'default' }),
}));

const mockUseGet = vi.fn();
vi.mock('../common/Resources', () => ({
  Kustomization: {
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
    pluralKind: 'gitrepositories',
    namespace: 'default',
  }),
  ObjectEvents: () => null,
}));

vi.mock('./Inventory', () => ({
  GetResourcesFromInventory: () => null,
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock('../sources/Source', () => ({
  useSource: () => null,
}));

describe('KustomizationSingle detail view actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('does NOT render Force Sync action in Kustomization detail view', () => {
    const resource = {
      kind: 'Kustomization',
      metadata: { name: 'my-kustomization', namespace: 'default' },
      jsonData: {
        kind: 'Kustomization',
        metadata: { name: 'my-kustomization', namespace: 'default' },
        spec: {
          suspend: false,
          force: false,
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

    mockUseGet.mockReturnValue([resource]);

    render(<FluxKustomizationDetailView name="my-kustomization" namespace="default" />);

    const buttons = screen.getAllByTestId('action-button');
    const descriptions = buttons.map(b => b.getAttribute('data-description'));

    // Force Sync MUST NOT be exposed for Kustomization
    expect(descriptions).not.toContain('Force Sync');
    // Normal actions are present
    expect(descriptions).toContain('Suspend');
    expect(descriptions.some(d => d?.includes('Enable force reconciliation'))).toBe(true);
  });
});

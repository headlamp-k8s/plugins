import { vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  Router: {
    createRouteURL: vi
      .fn()
      .mockImplementation((route: string, params: any) => `/${route}/${params.name}`),
  },
  Headlamp: { setCluster: vi.fn() },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/secret', () => ({
  default: { useGet: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }) },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ActionButton: ({ description, onClick, icon }: any) => (
    <button onClick={onClick} data-testid={`action-${icon}`}>
      {description}
    </button>
  ),
  ConfirmButton: ({ children, onConfirm }: any) => (
    <div>
      {children}
      <button onClick={onConfirm} data-testid="confirm-button">
        Confirm
      </button>
    </div>
  ),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject {
    jsonData: any;
    constructor(jsonData: any) {
      this.jsonData = jsonData;
    }
  },
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { MemoryRouter } from 'react-router-dom';
import {
  getMachineActions,
  ProviderInstanceAction,
  ReplaceMachineAction,
  ViewNodeAction,
} from './Actions';

// Mock react-router-dom useHistory
const mockPush = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as any),
    useHistory: () => ({
      push: mockPush,
    }),
  };
});

describe('Machine Actions', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <SnackbarProvider>{ui}</SnackbarProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ViewNodeAction', () => {
    test('navigates to node detail when clusterName is provided', () => {
      renderWithProviders(<ViewNodeAction nodeName="node-1" clusterName="cluster-1" />);
      fireEvent.click(screen.getByText('View Node'));
      expect(mockPush).toHaveBeenCalledWith('/node/node-1');
    });

    test('shows warning and does not navigate when clusterName is missing', () => {
      renderWithProviders(<ViewNodeAction nodeName="node-1" />);
      fireEvent.click(screen.getByText('View Node'));
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('ReplaceMachineAction', () => {
    test('triggers machine deletion on confirm', async () => {
      const mockDelete = vi.fn().mockResolvedValue({});
      const machine: any = {
        metadata: { name: 'machine-1' },
        delete: mockDelete,
      };

      renderWithProviders(<ReplaceMachineAction machine={machine} />);

      fireEvent.click(screen.getByTestId('confirm-button'));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
      });
    });
  });

  describe('ProviderInstanceAction', () => {
    test('opens AWS provider URL correctly', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      renderWithProviders(
        <ProviderInstanceAction providerID="aws:///us-east-1a/i-0abc123def456" />
      );
      fireEvent.click(screen.getByText('Open Provider Instance'));

      expect(openSpy).toHaveBeenCalledWith(
        'https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#InstanceDetails:instanceId=i-0abc123def456',
        '_blank',
        'noopener,noreferrer'
      );
    });

    test('shows warning for unsupported provider', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      renderWithProviders(<ProviderInstanceAction providerID="unknown:///id" />);
      fireEvent.click(screen.getByText('Open Provider Instance'));

      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('getMachineActions', () => {
    test('returns correct action list', () => {
      const machine: any = {
        metadata: {
          labels: { 'cluster.x-k8s.io/cluster-name': 'my-cluster' },
          annotations: {},
        },
        jsonData: {
          status: { nodeRef: { name: 'node-1' } },
        },
        spec: {
          providerID: 'docker:///id',
        },
      };

      const actions = getMachineActions(machine);
      expect(actions.length).toBe(4);
    });
  });
});

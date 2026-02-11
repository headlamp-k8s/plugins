import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { NotInstalledBanner } from '../common/CommonComponents';

// Mock order data structure for stories
interface MockOrder {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    uid: string;
  };
  spec: {
    request: string;
    issuerRef: {
      name: string;
      kind: string;
    };
    dnsNames?: string[];
  };
  status: {
    state: string;
    url?: string;
  };
}

interface PureOrdersListProps {
  orders: MockOrder[];
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureOrdersList({
  orders,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureOrdersListProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  return (
    <Box>
      <SectionHeader title="Orders" />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (item: MockOrder) => item.metadata.name,
          },
          {
            label: 'Namespace',
            getter: (item: MockOrder) => item.metadata.namespace,
          },
          {
            label: 'State',
            getter: (item: MockOrder) => item.status?.state || '-',
          },
          {
            label: 'Age',
            getter: (item: MockOrder) => (
              <DateLabel date={item.metadata.creationTimestamp} format="mini" />
            ),
          },
        ]}
        data={orders}
        emptyMessage="No orders found"
      />
    </Box>
  );
}

export default {
  title: 'cert-manager/Orders/List',
  component: PureOrdersList,
} as Meta;

const Template: StoryFn<PureOrdersListProps> = args => <PureOrdersList {...args} />;

// Sample mock data
const mockOrders: MockOrder[] = [
  {
    metadata: {
      name: 'example-com-tls-1-123456789',
      namespace: 'default',
      creationTimestamp: '2024-01-15T10:30:00Z',
      uid: 'order-1',
    },
    spec: {
      request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K...',
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
      dnsNames: ['example.com', 'www.example.com'],
    },
    status: {
      state: 'pending',
      url: 'https://acme-v02.api.letsencrypt.org/acme/order/123456789',
    },
  },
  {
    metadata: {
      name: 'api-example-com-tls-1-987654321',
      namespace: 'production',
      creationTimestamp: '2024-01-15T10:25:00Z',
      uid: 'order-2',
    },
    spec: {
      request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K...',
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
      dnsNames: ['api.example.com'],
    },
    status: {
      state: 'valid',
      url: 'https://acme-v02.api.letsencrypt.org/acme/order/987654321',
    },
  },
  {
    metadata: {
      name: 'wildcard-example-com-tls-1-111222333',
      namespace: 'default',
      creationTimestamp: '2024-01-15T10:20:00Z',
      uid: 'order-3',
    },
    spec: {
      request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K...',
      issuerRef: {
        name: 'letsencrypt-dns',
        kind: 'ClusterIssuer',
      },
      dnsNames: ['*.example.com'],
    },
    status: {
      state: 'ready',
      url: 'https://acme-v02.api.letsencrypt.org/acme/order/111222333',
    },
  },
  {
    metadata: {
      name: 'staging-tls-1-444555666',
      namespace: 'staging',
      creationTimestamp: '2024-01-15T10:15:00Z',
      uid: 'order-4',
    },
    spec: {
      request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K...',
      issuerRef: {
        name: 'letsencrypt-staging',
        kind: 'Issuer',
      },
      dnsNames: ['staging.example.com'],
    },
    status: {
      state: 'invalid',
      url: 'https://acme-staging-v02.api.letsencrypt.org/acme/order/444555666',
    },
  },
  {
    metadata: {
      name: 'rate-limited-tls-1-777888999',
      namespace: 'production',
      creationTimestamp: '2024-01-15T10:10:00Z',
      uid: 'order-5',
    },
    spec: {
      request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K...',
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
      dnsNames: ['app.example.com'],
    },
    status: {
      state: 'errored',
    },
  },
];

// Stories
export const Default = Template.bind({});
Default.args = {
  orders: mockOrders,
  isCertManagerInstalled: true,
};

export const Empty = Template.bind({});
Empty.args = {
  orders: [],
  isCertManagerInstalled: true,
};

export const PendingOrders = Template.bind({});
PendingOrders.args = {
  orders: mockOrders.filter(o => o.status.state === 'pending'),
  isCertManagerInstalled: true,
};

export const ValidOrders = Template.bind({});
ValidOrders.args = {
  orders: mockOrders.filter(o => o.status.state === 'valid'),
  isCertManagerInstalled: true,
};

export const ReadyOrders = Template.bind({});
ReadyOrders.args = {
  orders: mockOrders.filter(o => o.status.state === 'ready'),
  isCertManagerInstalled: true,
};

export const FailedOrders = Template.bind({});
FailedOrders.args = {
  orders: mockOrders.filter(o => o.status.state === 'invalid' || o.status.state === 'errored'),
  isCertManagerInstalled: true,
};

export const MixedStates = Template.bind({});
MixedStates.args = {
  orders: mockOrders,
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  orders: [],
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  orders: [],
  isCertManagerInstalled: false,
  isLoading: true,
};

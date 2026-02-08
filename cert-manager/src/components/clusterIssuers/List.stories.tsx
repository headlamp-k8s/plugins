import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { NotInstalledBanner } from '../common/CommonComponents';

// Mock cluster issuer data structure for stories
interface MockClusterIssuer {
  metadata: {
    name: string;
    creationTimestamp: string;
    uid: string;
  };
  spec: {
    acme?: {
      email: string;
      server: string;
    };
    ca?: {
      secretName: string;
    };
    selfSigned?: {};
    vault?: {
      server: string;
      path: string;
    };
    venafi?: {
      zone: string;
    };
  };
  status: {
    conditions: Array<{
      type: string;
      status: string;
      reason?: string;
      message?: string;
      lastTransitionTime?: string;
    }>;
  };
}

interface PureClusterIssuersListProps {
  clusterIssuers: MockClusterIssuer[];
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureClusterIssuersList({
  clusterIssuers,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureClusterIssuersListProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  return (
    <Box>
      <SectionHeader title="Cluster Issuers" />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (item: MockClusterIssuer) => item.metadata.name,
          },
          {
            label: 'Status',
            getter: (item: MockClusterIssuer) => item.status?.conditions?.[0]?.status || '-',
          },
          {
            label: 'Age',
            getter: (item: MockClusterIssuer) => (
              <DateLabel date={item.metadata.creationTimestamp} format="mini" />
            ),
          },
        ]}
        data={clusterIssuers}
        emptyMessage="No cluster issuers found"
      />
    </Box>
  );
}

export default {
  title: 'cert-manager/ClusterIssuers/List',
  component: PureClusterIssuersList,
} as Meta;

const Template: StoryFn<PureClusterIssuersListProps> = args => <PureClusterIssuersList {...args} />;

// Sample mock data
const mockClusterIssuers: MockClusterIssuer[] = [
  {
    metadata: {
      name: 'letsencrypt-prod',
      creationTimestamp: '2024-01-01T00:00:00Z',
      uid: 'cluster-issuer-1',
    },
    spec: {
      acme: {
        email: 'admin@example.com',
        server: 'https://acme-v02.api.letsencrypt.org/directory',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'ACMEAccountRegistered',
          message: 'The ACME account was registered with the ACME server',
          lastTransitionTime: '2024-01-01T00:05:00Z',
        },
      ],
    },
  },
  {
    metadata: {
      name: 'letsencrypt-staging',
      creationTimestamp: '2024-01-01T00:00:00Z',
      uid: 'cluster-issuer-2',
    },
    spec: {
      acme: {
        email: 'admin@example.com',
        server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'ACMEAccountRegistered',
          message: 'The ACME account was registered with the ACME server',
          lastTransitionTime: '2024-01-01T00:05:00Z',
        },
      ],
    },
  },
  {
    metadata: {
      name: 'self-signed-cluster',
      creationTimestamp: '2024-01-02T00:00:00Z',
      uid: 'cluster-issuer-3',
    },
    spec: {
      selfSigned: {},
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'IsReady',
          message: 'Issuer is ready',
          lastTransitionTime: '2024-01-02T00:01:00Z',
        },
      ],
    },
  },
  {
    metadata: {
      name: 'vault-cluster-issuer',
      creationTimestamp: '2024-01-03T00:00:00Z',
      uid: 'cluster-issuer-4',
    },
    spec: {
      vault: {
        server: 'https://vault.example.com',
        path: 'pki/sign/cluster-role',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'False',
          reason: 'VaultVerifyError',
          message: 'Vault server returned error: connection refused',
          lastTransitionTime: '2024-01-03T00:02:00Z',
        },
      ],
    },
  },
];

// Stories
export const Default = Template.bind({});
Default.args = {
  clusterIssuers: mockClusterIssuers,
  isCertManagerInstalled: true,
};

export const Empty = Template.bind({});
Empty.args = {
  clusterIssuers: [],
  isCertManagerInstalled: true,
};

export const AllReady = Template.bind({});
AllReady.args = {
  clusterIssuers: mockClusterIssuers.filter(ci => ci.status?.conditions?.[0]?.status === 'True'),
  isCertManagerInstalled: true,
};

export const WithNotReady = Template.bind({});
WithNotReady.args = {
  clusterIssuers: mockClusterIssuers,
  isCertManagerInstalled: true,
};

export const SingleACMEClusterIssuer = Template.bind({});
SingleACMEClusterIssuer.args = {
  clusterIssuers: [mockClusterIssuers[0]],
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  clusterIssuers: [],
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  clusterIssuers: [],
  isCertManagerInstalled: false,
  isLoading: true,
};

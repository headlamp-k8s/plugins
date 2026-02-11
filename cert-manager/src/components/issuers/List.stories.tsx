import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { NotInstalledBanner } from '../common/CommonComponents';

// Mock issuer data structure for stories
interface MockIssuer {
  metadata: {
    name: string;
    namespace: string;
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
  ready: boolean;
}

interface PureIssuersListProps {
  issuers: MockIssuer[];
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureIssuersList({
  issuers,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureIssuersListProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  return (
    <Box>
      <SectionHeader title="Issuers" />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (item: MockIssuer) => item.metadata.name,
          },
          {
            label: 'Namespace',
            getter: (item: MockIssuer) => item.metadata.namespace,
          },
          {
            label: 'Ready',
            getter: (item: MockIssuer) => (item.ready ? 'Ready' : 'Not Ready'),
          },
          {
            label: 'Age',
            getter: (item: MockIssuer) => (
              <DateLabel date={item.metadata.creationTimestamp} format="mini" />
            ),
          },
        ]}
        data={issuers}
        emptyMessage="No issuers found"
      />
    </Box>
  );
}

export default {
  title: 'cert-manager/Issuers/List',
  component: PureIssuersList,
} as Meta;

const Template: StoryFn<PureIssuersListProps> = args => <PureIssuersList {...args} />;

// Sample mock data
const mockIssuers: MockIssuer[] = [
  {
    metadata: {
      name: 'letsencrypt-staging',
      namespace: 'default',
      creationTimestamp: '2024-01-01T00:00:00Z',
      uid: 'issuer-1',
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
    ready: true,
  },
  {
    metadata: {
      name: 'self-signed',
      namespace: 'default',
      creationTimestamp: '2024-01-02T00:00:00Z',
      uid: 'issuer-2',
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
    ready: true,
  },
  {
    metadata: {
      name: 'internal-ca',
      namespace: 'cert-manager',
      creationTimestamp: '2024-01-03T00:00:00Z',
      uid: 'issuer-3',
    },
    spec: {
      ca: {
        secretName: 'internal-ca-secret',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'KeyPairVerified',
          message: 'Signing CA verified',
          lastTransitionTime: '2024-01-03T00:05:00Z',
        },
      ],
    },
    ready: true,
  },
  {
    metadata: {
      name: 'vault-issuer',
      namespace: 'production',
      creationTimestamp: '2024-01-04T00:00:00Z',
      uid: 'issuer-4',
    },
    spec: {
      vault: {
        server: 'https://vault.example.com',
        path: 'pki/sign/my-role',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'False',
          reason: 'VaultVerifyError',
          message: 'Vault server returned error: permission denied',
          lastTransitionTime: '2024-01-04T00:02:00Z',
        },
      ],
    },
    ready: false,
  },
  {
    metadata: {
      name: 'venafi-issuer',
      namespace: 'enterprise',
      creationTimestamp: '2024-01-05T00:00:00Z',
      uid: 'issuer-5',
    },
    spec: {
      venafi: {
        zone: 'My Application\\Certificate Policy',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'Verified',
          message: 'Venafi Zone verified',
          lastTransitionTime: '2024-01-05T00:03:00Z',
        },
      ],
    },
    ready: true,
  },
];

// Stories
export const Default = Template.bind({});
Default.args = {
  issuers: mockIssuers,
  isCertManagerInstalled: true,
};

export const Empty = Template.bind({});
Empty.args = {
  issuers: [],
  isCertManagerInstalled: true,
};

export const AllReady = Template.bind({});
AllReady.args = {
  issuers: mockIssuers.filter(i => i.ready),
  isCertManagerInstalled: true,
};

export const WithNotReady = Template.bind({});
WithNotReady.args = {
  issuers: mockIssuers,
  isCertManagerInstalled: true,
};

export const SingleACMEIssuer = Template.bind({});
SingleACMEIssuer.args = {
  issuers: [mockIssuers[0]],
  isCertManagerInstalled: true,
};

export const SingleSelfSignedIssuer = Template.bind({});
SingleSelfSignedIssuer.args = {
  issuers: [mockIssuers[1]],
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  issuers: [],
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  issuers: [],
  isCertManagerInstalled: false,
  isLoading: true,
};

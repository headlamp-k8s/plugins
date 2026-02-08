import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { NotInstalledBanner } from '../common/CommonComponents';

// Mock certificate data structure for stories
interface MockCertificate {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    uid: string;
  };
  spec: {
    secretName: string;
    issuerRef: {
      name: string;
      kind: string;
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
    notAfter?: string;
    notBefore?: string;
  };
  ready: boolean;
}

interface PureCertificatesListProps {
  certificates: MockCertificate[];
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureCertificatesList({
  certificates,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureCertificatesListProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  return (
    <Box>
      <SectionHeader title="Certificates" />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (item: MockCertificate) => item.metadata.name,
          },
          {
            label: 'Namespace',
            getter: (item: MockCertificate) => item.metadata.namespace,
          },
          {
            label: 'Ready',
            getter: (item: MockCertificate) => (item.ready ? 'Ready' : 'Not Ready'),
          },
          {
            label: 'Secret',
            getter: (item: MockCertificate) => item.spec.secretName,
          },
          {
            label: 'Expires In (Not After)',
            getter: (item: MockCertificate) =>
              item.status?.notAfter ? <DateLabel date={item.status.notAfter} format="mini" /> : '-',
          },
          {
            label: 'Age',
            getter: (item: MockCertificate) => (
              <DateLabel date={item.metadata.creationTimestamp} format="mini" />
            ),
          },
        ]}
        data={certificates}
        emptyMessage="No certificates found"
      />
    </Box>
  );
}

export default {
  title: 'cert-manager/Certificates/List',
  component: PureCertificatesList,
} as Meta;

const Template: StoryFn<PureCertificatesListProps> = args => <PureCertificatesList {...args} />;

// Sample mock data
const mockCertificates: MockCertificate[] = [
  {
    metadata: {
      name: 'example-com-tls',
      namespace: 'default',
      creationTimestamp: '2024-01-15T10:30:00Z',
      uid: 'cert-1',
    },
    spec: {
      secretName: 'example-com-tls-secret',
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'Ready',
          message: 'Certificate is up to date and has not expired',
          lastTransitionTime: '2024-01-15T10:35:00Z',
        },
      ],
      notAfter: '2024-04-15T10:30:00Z',
      notBefore: '2024-01-15T10:30:00Z',
    },
    ready: true,
  },
  {
    metadata: {
      name: 'api-example-com-tls',
      namespace: 'production',
      creationTimestamp: '2024-01-10T08:00:00Z',
      uid: 'cert-2',
    },
    spec: {
      secretName: 'api-example-com-tls-secret',
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'Ready',
          message: 'Certificate is up to date and has not expired',
          lastTransitionTime: '2024-01-10T08:05:00Z',
        },
      ],
      notAfter: '2024-04-10T08:00:00Z',
      notBefore: '2024-01-10T08:00:00Z',
    },
    ready: true,
  },
  {
    metadata: {
      name: 'staging-tls',
      namespace: 'staging',
      creationTimestamp: '2024-01-20T14:00:00Z',
      uid: 'cert-3',
    },
    spec: {
      secretName: 'staging-tls-secret',
      issuerRef: {
        name: 'letsencrypt-staging',
        kind: 'Issuer',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'False',
          reason: 'Failed',
          message: 'The certificate request failed: ACME server error',
          lastTransitionTime: '2024-01-20T14:05:00Z',
        },
      ],
      notAfter: undefined,
      notBefore: undefined,
    },
    ready: false,
  },
];

const expiringCertificates: MockCertificate[] = [
  {
    metadata: {
      name: 'expiring-soon-tls',
      namespace: 'default',
      creationTimestamp: '2023-10-15T10:30:00Z',
      uid: 'cert-4',
    },
    spec: {
      secretName: 'expiring-soon-tls-secret',
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'Ready',
          message: 'Certificate is up to date but will expire soon',
          lastTransitionTime: '2023-10-15T10:35:00Z',
        },
      ],
      notAfter: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      notBefore: '2023-10-15T10:30:00Z',
    },
    ready: true,
  },
  {
    metadata: {
      name: 'already-expired-tls',
      namespace: 'default',
      creationTimestamp: '2023-07-15T10:30:00Z',
      uid: 'cert-5',
    },
    spec: {
      secretName: 'already-expired-tls-secret',
      issuerRef: {
        name: 'self-signed',
        kind: 'Issuer',
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'False',
          reason: 'Expired',
          message: 'Certificate has expired',
          lastTransitionTime: '2023-10-15T10:30:00Z',
        },
      ],
      notAfter: '2023-10-15T10:30:00Z',
      notBefore: '2023-07-15T10:30:00Z',
    },
    ready: false,
  },
];

// Stories
export const Default = Template.bind({});
Default.args = {
  certificates: mockCertificates,
  isCertManagerInstalled: true,
};

export const Empty = Template.bind({});
Empty.args = {
  certificates: [],
  isCertManagerInstalled: true,
};

export const SingleCertificate = Template.bind({});
SingleCertificate.args = {
  certificates: [mockCertificates[0]],
  isCertManagerInstalled: true,
};

export const AllReady = Template.bind({});
AllReady.args = {
  certificates: mockCertificates.filter(c => c.ready),
  isCertManagerInstalled: true,
};

export const WithFailedCertificates = Template.bind({});
WithFailedCertificates.args = {
  certificates: mockCertificates,
  isCertManagerInstalled: true,
};

export const ExpiringAndExpired = Template.bind({});
ExpiringAndExpired.args = {
  certificates: expiringCertificates,
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  certificates: [],
  isCertManagerInstalled: false,
  isLoading: false,
};

export const CheckingCertManagerInstallation = Template.bind({});
CheckingCertManagerInstallation.args = {
  certificates: [],
  isCertManagerInstalled: false,
  isLoading: true,
};

export const ManyNamespaces = Template.bind({});
ManyNamespaces.args = {
  certificates: [
    ...mockCertificates,
    {
      metadata: {
        name: 'dev-tls',
        namespace: 'development',
        creationTimestamp: '2024-01-18T12:00:00Z',
        uid: 'cert-6',
      },
      spec: {
        secretName: 'dev-tls-secret',
        issuerRef: {
          name: 'letsencrypt-staging',
          kind: 'ClusterIssuer',
        },
      },
      status: {
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            reason: 'Ready',
            message: 'Certificate is up to date',
            lastTransitionTime: '2024-01-18T12:05:00Z',
          },
        ],
        notAfter: '2024-04-18T12:00:00Z',
        notBefore: '2024-01-18T12:00:00Z',
      },
      ready: true,
    },
    {
      metadata: {
        name: 'test-tls',
        namespace: 'testing',
        creationTimestamp: '2024-01-19T09:00:00Z',
        uid: 'cert-7',
      },
      spec: {
        secretName: 'test-tls-secret',
        issuerRef: {
          name: 'self-signed',
          kind: 'Issuer',
        },
      },
      status: {
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            reason: 'Ready',
            message: 'Certificate is up to date',
            lastTransitionTime: '2024-01-19T09:05:00Z',
          },
        ],
        notAfter: '2025-01-19T09:00:00Z',
        notBefore: '2024-01-19T09:00:00Z',
      },
      ready: true,
    },
  ],
  isCertManagerInstalled: true,
};

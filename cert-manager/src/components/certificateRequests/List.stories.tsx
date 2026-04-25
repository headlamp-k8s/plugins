import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { NotInstalledBanner } from '../common/CommonComponents';

// Mock certificate request data structure for stories
interface MockCertificateRequest {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    uid: string;
  };
  spec: {
    issuerRef: {
      name: string;
      kind: string;
    };
    username?: string;
    request: string;
  };
  status: {
    conditions: Array<{
      type: string;
      status: string;
      reason?: string;
      message?: string;
      lastTransitionTime?: string;
    }>;
    certificate?: string;
    ca?: string;
  };
  ready: boolean;
  approved: string;
  denied: string;
}

interface PureCertificateRequestsListProps {
  certificateRequests: MockCertificateRequest[];
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureCertificateRequestsList({
  certificateRequests,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureCertificateRequestsListProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  return (
    <Box>
      <SectionHeader title="Certificate Requests" />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (item: MockCertificateRequest) => item.metadata.name,
          },
          {
            label: 'Namespace',
            getter: (item: MockCertificateRequest) => item.metadata.namespace,
          },
          {
            label: 'Approved',
            getter: (item: MockCertificateRequest) => item.approved,
          },
          {
            label: 'Denied',
            getter: (item: MockCertificateRequest) => item.denied,
          },
          {
            label: 'Ready',
            getter: (item: MockCertificateRequest) => (item.ready ? 'True' : 'False'),
          },
          {
            label: 'Issuer',
            getter: (item: MockCertificateRequest) => item.spec.issuerRef.name,
          },
          {
            label: 'Requester',
            getter: (item: MockCertificateRequest) => item.spec.username || '-',
          },
          {
            label: 'Age',
            getter: (item: MockCertificateRequest) => (
              <DateLabel date={item.metadata.creationTimestamp} format="mini" />
            ),
          },
        ]}
        data={certificateRequests}
        emptyMessage="No certificate requests found"
      />
    </Box>
  );
}

export default {
  title: 'cert-manager/CertificateRequests/List',
  component: PureCertificateRequestsList,
} as Meta;

const Template: StoryFn<PureCertificateRequestsListProps> = args => (
  <PureCertificateRequestsList {...args} />
);

// Sample mock data
const mockCertificateRequests: MockCertificateRequest[] = [
  {
    metadata: {
      name: 'example-com-tls-1',
      namespace: 'default',
      creationTimestamp: '2024-01-15T10:30:00Z',
      uid: 'cr-1',
    },
    spec: {
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
      username: 'system:serviceaccount:cert-manager:cert-manager',
      request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K...',
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'Issued',
          message: 'Certificate fetched from issuer successfully',
          lastTransitionTime: '2024-01-15T10:35:00Z',
        },
        {
          type: 'Approved',
          status: 'True',
          reason: 'cert-manager.io',
          message: 'Certificate request has been approved by cert-manager.io',
          lastTransitionTime: '2024-01-15T10:31:00Z',
        },
      ],
      certificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...',
    },
    ready: true,
    approved: 'True',
    denied: 'False',
  },
  {
    metadata: {
      name: 'api-tls-request',
      namespace: 'production',
      creationTimestamp: '2024-01-16T08:00:00Z',
      uid: 'cr-2',
    },
    spec: {
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
      username: 'system:serviceaccount:production:api-service',
      request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K...',
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'Issued',
          message: 'Certificate fetched from issuer successfully',
          lastTransitionTime: '2024-01-16T08:05:00Z',
        },
        {
          type: 'Approved',
          status: 'True',
          reason: 'cert-manager.io',
          message: 'Certificate request has been approved',
          lastTransitionTime: '2024-01-16T08:01:00Z',
        },
      ],
      certificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...',
    },
    ready: true,
    approved: 'True',
    denied: 'False',
  },
  {
    metadata: {
      name: 'pending-request',
      namespace: 'staging',
      creationTimestamp: '2024-01-20T14:00:00Z',
      uid: 'cr-3',
    },
    spec: {
      issuerRef: {
        name: 'letsencrypt-staging',
        kind: 'Issuer',
      },
      username: 'system:serviceaccount:staging:web-app',
      request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K...',
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'False',
          reason: 'Pending',
          message: 'Waiting for certificate to be issued',
          lastTransitionTime: '2024-01-20T14:00:00Z',
        },
        {
          type: 'Approved',
          status: 'True',
          reason: 'cert-manager.io',
          message: 'Certificate request has been approved',
          lastTransitionTime: '2024-01-20T14:00:30Z',
        },
      ],
    },
    ready: false,
    approved: 'True',
    denied: 'False',
  },
  {
    metadata: {
      name: 'denied-request',
      namespace: 'default',
      creationTimestamp: '2024-01-19T11:00:00Z',
      uid: 'cr-4',
    },
    spec: {
      issuerRef: {
        name: 'restricted-issuer',
        kind: 'Issuer',
      },
      username: 'system:serviceaccount:default:unauthorized-sa',
      request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K...',
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'False',
          reason: 'Denied',
          message: 'Certificate request was denied',
          lastTransitionTime: '2024-01-19T11:01:00Z',
        },
        {
          type: 'Denied',
          status: 'True',
          reason: 'policy.cert-manager.io',
          message: 'Request denied by CertificateRequestPolicy',
          lastTransitionTime: '2024-01-19T11:01:00Z',
        },
      ],
    },
    ready: false,
    approved: 'False',
    denied: 'True',
  },
];

// Stories
export const Default = Template.bind({});
Default.args = {
  certificateRequests: mockCertificateRequests,
  isCertManagerInstalled: true,
};

export const Empty = Template.bind({});
Empty.args = {
  certificateRequests: [],
  isCertManagerInstalled: true,
};

export const AllApproved = Template.bind({});
AllApproved.args = {
  certificateRequests: mockCertificateRequests.filter(cr => cr.approved === 'True' && cr.ready),
  isCertManagerInstalled: true,
};

export const WithPendingRequests = Template.bind({});
WithPendingRequests.args = {
  certificateRequests: mockCertificateRequests.filter(cr => !cr.ready && cr.approved === 'True'),
  isCertManagerInstalled: true,
};

export const WithDeniedRequests = Template.bind({});
WithDeniedRequests.args = {
  certificateRequests: mockCertificateRequests.filter(cr => cr.denied === 'True'),
  isCertManagerInstalled: true,
};

export const MixedStatus = Template.bind({});
MixedStatus.args = {
  certificateRequests: mockCertificateRequests,
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  certificateRequests: [],
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  certificateRequests: [],
  isCertManagerInstalled: false,
  isLoading: true,
};

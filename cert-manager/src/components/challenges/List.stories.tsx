import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { NotInstalledBanner } from '../common/CommonComponents';

// Mock challenge data structure for stories
interface MockChallenge {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    uid: string;
  };
  spec: {
    dnsName: string;
    type: string;
    issuerRef: {
      name: string;
      kind: string;
    };
  };
  status: {
    state: string;
    presented: boolean;
    processing: boolean;
    reason?: string;
  };
}

interface PureChallengesListProps {
  challenges: MockChallenge[];
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureChallengesList({
  challenges,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureChallengesListProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  return (
    <Box>
      <SectionHeader title="Challenges" />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (item: MockChallenge) => item.metadata.name,
          },
          {
            label: 'Namespace',
            getter: (item: MockChallenge) => item.metadata.namespace,
          },
          {
            label: 'State',
            getter: (item: MockChallenge) => item.status?.state || '-',
          },
          {
            label: 'Domain',
            getter: (item: MockChallenge) => item.spec.dnsName,
          },
          {
            label: 'Age',
            getter: (item: MockChallenge) => (
              <DateLabel date={item.metadata.creationTimestamp} format="mini" />
            ),
          },
        ]}
        data={challenges}
        emptyMessage="No challenges found"
      />
    </Box>
  );
}

export default {
  title: 'cert-manager/Challenges/List',
  component: PureChallengesList,
} as Meta;

const Template: StoryFn<PureChallengesListProps> = args => <PureChallengesList {...args} />;

// Sample mock data
const mockChallenges: MockChallenge[] = [
  {
    metadata: {
      name: 'example-com-tls-1-123456789-0',
      namespace: 'default',
      creationTimestamp: '2024-01-15T10:30:00Z',
      uid: 'challenge-1',
    },
    spec: {
      dnsName: 'example.com',
      type: 'HTTP-01',
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
    },
    status: {
      state: 'pending',
      presented: true,
      processing: true,
    },
  },
  {
    metadata: {
      name: 'api-example-com-tls-1-987654321-0',
      namespace: 'production',
      creationTimestamp: '2024-01-15T10:25:00Z',
      uid: 'challenge-2',
    },
    spec: {
      dnsName: 'api.example.com',
      type: 'HTTP-01',
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
    },
    status: {
      state: 'valid',
      presented: true,
      processing: false,
    },
  },
  {
    metadata: {
      name: 'wildcard-example-com-tls-1-111222333-0',
      namespace: 'default',
      creationTimestamp: '2024-01-15T10:20:00Z',
      uid: 'challenge-3',
    },
    spec: {
      dnsName: '*.example.com',
      type: 'DNS-01',
      issuerRef: {
        name: 'letsencrypt-dns',
        kind: 'ClusterIssuer',
      },
    },
    status: {
      state: 'pending',
      presented: false,
      processing: true,
    },
  },
  {
    metadata: {
      name: 'staging-tls-1-444555666-0',
      namespace: 'staging',
      creationTimestamp: '2024-01-15T10:15:00Z',
      uid: 'challenge-4',
    },
    spec: {
      dnsName: 'staging.example.com',
      type: 'HTTP-01',
      issuerRef: {
        name: 'letsencrypt-staging',
        kind: 'Issuer',
      },
    },
    status: {
      state: 'invalid',
      presented: true,
      processing: false,
      reason: 'Error presenting challenge: incorrect TXT record',
    },
  },
  {
    metadata: {
      name: 'rate-limited-tls-1-777888999-0',
      namespace: 'production',
      creationTimestamp: '2024-01-15T10:10:00Z',
      uid: 'challenge-5',
    },
    spec: {
      dnsName: 'app.example.com',
      type: 'HTTP-01',
      issuerRef: {
        name: 'letsencrypt-prod',
        kind: 'ClusterIssuer',
      },
    },
    status: {
      state: 'errored',
      presented: false,
      processing: false,
      reason: 'Error accepting authorization: rateLimited',
    },
  },
];

// Stories
export const Default = Template.bind({});
Default.args = {
  challenges: mockChallenges,
  isCertManagerInstalled: true,
};

export const Empty = Template.bind({});
Empty.args = {
  challenges: [],
  isCertManagerInstalled: true,
};

export const PendingChallenges = Template.bind({});
PendingChallenges.args = {
  challenges: mockChallenges.filter(c => c.status.state === 'pending'),
  isCertManagerInstalled: true,
};

export const ValidChallenges = Template.bind({});
ValidChallenges.args = {
  challenges: mockChallenges.filter(c => c.status.state === 'valid'),
  isCertManagerInstalled: true,
};

export const FailedChallenges = Template.bind({});
FailedChallenges.args = {
  challenges: mockChallenges.filter(
    c => c.status.state === 'invalid' || c.status.state === 'errored'
  ),
  isCertManagerInstalled: true,
};

export const MixedStates = Template.bind({});
MixedStates.args = {
  challenges: mockChallenges,
  isCertManagerInstalled: true,
};

export const DNS01Challenges = Template.bind({});
DNS01Challenges.args = {
  challenges: mockChallenges.filter(c => c.spec.type === 'DNS-01'),
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  challenges: [],
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  challenges: [],
  isCertManagerInstalled: false,
  isLoading: true,
};

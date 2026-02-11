import {
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ACMEChallengeSolver, IssuerReference } from '../../resources/common';
import {
  ACMEChallengeSolverComponent,
  CopyToClipboard,
  IssuerRef,
  NotInstalledBanner,
} from '../common/CommonComponents';

// Mock challenge data structure for stories
interface MockChallengeDetail {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    uid: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    dnsName: string;
    authorizationURL: string;
    type: string;
    issuerRef: IssuerReference;
    key: string;
    solver: ACMEChallengeSolver;
    token: string;
    url: string;
    wildcard?: boolean;
  };
  status: {
    state: string;
    presented: boolean;
    processing: boolean;
    reason?: string;
  };
}

interface PureChallengeDetailProps {
  challenge: MockChallengeDetail | null;
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureChallengeDetail({
  challenge,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureChallengeDetailProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  if (!challenge) {
    return (
      <Box p={2}>
        <SectionHeader title="Challenge Details" />
        <Box>Challenge not found</Box>
      </Box>
    );
  }

  return (
    <Box>
      <SectionHeader title={`Challenge: ${challenge.metadata.name}`} />

      {/* Main Info */}
      <SectionBox title="Info">
        <NameValueTable
          rows={[
            { name: 'Name', value: challenge.metadata.name },
            { name: 'Namespace', value: challenge.metadata.namespace },
            { name: 'DNS Name', value: challenge.spec.dnsName },
            { name: 'Authorization URL', value: challenge.spec.authorizationURL },
            { name: 'Type', value: challenge.spec.type },
            {
              name: 'Issuer Ref',
              value: challenge.spec.issuerRef && (
                <IssuerRef
                  issuerRef={challenge.spec.issuerRef}
                  namespace={challenge.metadata.namespace}
                />
              ),
            },
            {
              name: 'Key',
              value: <CopyToClipboard text={challenge.spec.key} />,
            },
            {
              name: 'Solver',
              value: <ACMEChallengeSolverComponent solver={challenge.spec.solver} />,
            },
            { name: 'Token', value: challenge.spec.token },
            { name: 'URL', value: challenge.spec.url },
            { name: 'Wildcard', value: challenge.spec?.wildcard?.toString() || 'false' },
          ]}
        />
      </SectionBox>

      {/* Status Section */}
      {challenge.status && (
        <SectionBox title="Status">
          <NameValueTable
            rows={[
              { name: 'State', value: challenge.status?.state || '-' },
              { name: 'Presented', value: challenge.status.presented.toString() },
              { name: 'Processing', value: challenge.status.processing.toString() },
              { name: 'Reason', value: challenge.status?.reason || '-' },
            ]}
          />
        </SectionBox>
      )}
    </Box>
  );
}

export default {
  title: 'cert-manager/Challenges/Detail',
  component: PureChallengeDetail,
  decorators: [
    (Story: StoryFn) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} as Meta;

const Template: StoryFn<PureChallengeDetailProps> = args => <PureChallengeDetail {...args} />;

// Sample mock data
const pendingHTTP01Challenge: MockChallengeDetail = {
  metadata: {
    name: 'example-com-tls-1-123456789-0',
    namespace: 'default',
    creationTimestamp: '2024-01-15T10:30:00Z',
    uid: 'challenge-1',
    labels: {
      'acme.cert-manager.io/certificate': 'example-com-tls',
    },
  },
  spec: {
    dnsName: 'example.com',
    authorizationURL: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/123456789',
    type: 'HTTP-01',
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
      group: 'cert-manager.io',
    },
    key: 'abc123def456.xyz789',
    solver: {
      http01: {
        ingress: {
          class: 'nginx',
          serviceType: 'ClusterIP',
        },
      },
    },
    token: 'abc123def456',
    url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/123456789/abcdef',
    wildcard: false,
  },
  status: {
    state: 'pending',
    presented: true,
    processing: true,
  },
};

const validHTTP01Challenge: MockChallengeDetail = {
  metadata: {
    name: 'api-example-com-tls-1-987654321-0',
    namespace: 'production',
    creationTimestamp: '2024-01-15T10:25:00Z',
    uid: 'challenge-2',
  },
  spec: {
    dnsName: 'api.example.com',
    authorizationURL: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/987654321',
    type: 'HTTP-01',
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
    },
    key: 'ghi789jkl012.mno345',
    solver: {
      http01: {
        ingress: {
          ingressClassName: 'traefik',
        },
      },
    },
    token: 'ghi789jkl012',
    url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/987654321/ghijkl',
    wildcard: false,
  },
  status: {
    state: 'valid',
    presented: true,
    processing: false,
  },
};

const pendingDNS01Challenge: MockChallengeDetail = {
  metadata: {
    name: 'wildcard-example-com-tls-1-111222333-0',
    namespace: 'default',
    creationTimestamp: '2024-01-15T10:20:00Z',
    uid: 'challenge-3',
  },
  spec: {
    dnsName: '*.example.com',
    authorizationURL: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/111222333',
    type: 'DNS-01',
    issuerRef: {
      name: 'letsencrypt-dns',
      kind: 'ClusterIssuer',
    },
    key: 'pqr567stu890.vwx123',
    solver: {
      dns01: {
        provider: 'cloudflare',
        cloudflare: {
          email: 'admin@example.com',
        },
      },
    },
    token: 'pqr567stu890',
    url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/111222333/pqrstu',
    wildcard: true,
  },
  status: {
    state: 'pending',
    presented: false,
    processing: true,
  },
};

const invalidChallenge: MockChallengeDetail = {
  metadata: {
    name: 'staging-tls-1-444555666-0',
    namespace: 'staging',
    creationTimestamp: '2024-01-15T10:15:00Z',
    uid: 'challenge-4',
  },
  spec: {
    dnsName: 'staging.example.com',
    authorizationURL: 'https://acme-staging-v02.api.letsencrypt.org/acme/authz-v3/444555666',
    type: 'HTTP-01',
    issuerRef: {
      name: 'letsencrypt-staging',
      kind: 'Issuer',
    },
    key: 'yza234bcd567.efg890',
    solver: {
      http01: {
        ingress: {
          class: 'nginx',
        },
      },
    },
    token: 'yza234bcd567',
    url: 'https://acme-staging-v02.api.letsencrypt.org/acme/chall-v3/444555666/yzabcd',
    wildcard: false,
  },
  status: {
    state: 'invalid',
    presented: true,
    processing: false,
    reason:
      'Error presenting challenge: The server could not connect to the client to verify the domain',
  },
};

const erroredChallenge: MockChallengeDetail = {
  metadata: {
    name: 'rate-limited-tls-1-777888999-0',
    namespace: 'production',
    creationTimestamp: '2024-01-15T10:10:00Z',
    uid: 'challenge-5',
  },
  spec: {
    dnsName: 'app.example.com',
    authorizationURL: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/777888999',
    type: 'HTTP-01',
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
    },
    key: 'hij123klm456.nop789',
    solver: {
      http01: {
        ingress: {
          class: 'nginx',
        },
      },
    },
    token: 'hij123klm456',
    url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/777888999/hijklm',
    wildcard: false,
  },
  status: {
    state: 'errored',
    presented: false,
    processing: false,
    reason: 'Error accepting authorization: rateLimited: too many failed authorizations recently',
  },
};

const dns01Route53Challenge: MockChallengeDetail = {
  metadata: {
    name: 'wildcard-route53-tls-1-999000111-0',
    namespace: 'production',
    creationTimestamp: '2024-01-15T10:05:00Z',
    uid: 'challenge-6',
  },
  spec: {
    dnsName: '*.production.example.com',
    authorizationURL: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/999000111',
    type: 'DNS-01',
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
    },
    key: 'qrs456tuv789.wxy012',
    solver: {
      dns01: {
        provider: 'route53',
        route53: {
          region: 'us-east-1',
          hostedZoneID: 'Z1234567890ABC',
        },
      },
    },
    token: 'qrs456tuv789',
    url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/999000111/qrstuv',
    wildcard: true,
  },
  status: {
    state: 'valid',
    presented: true,
    processing: false,
  },
};

// Stories
export const PendingHTTP01 = Template.bind({});
PendingHTTP01.args = {
  challenge: pendingHTTP01Challenge,
  isCertManagerInstalled: true,
};

export const ValidHTTP01 = Template.bind({});
ValidHTTP01.args = {
  challenge: validHTTP01Challenge,
  isCertManagerInstalled: true,
};

export const PendingDNS01 = Template.bind({});
PendingDNS01.args = {
  challenge: pendingDNS01Challenge,
  isCertManagerInstalled: true,
};

export const DNS01Route53 = Template.bind({});
DNS01Route53.args = {
  challenge: dns01Route53Challenge,
  isCertManagerInstalled: true,
};

export const Invalid = Template.bind({});
Invalid.args = {
  challenge: invalidChallenge,
  isCertManagerInstalled: true,
};

export const Errored = Template.bind({});
Errored.args = {
  challenge: erroredChallenge,
  isCertManagerInstalled: true,
};

export const WildcardChallenge = Template.bind({});
WildcardChallenge.args = {
  challenge: pendingDNS01Challenge,
  isCertManagerInstalled: true,
};

export const NotFound = Template.bind({});
NotFound.args = {
  challenge: null,
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  challenge: null,
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  challenge: null,
  isCertManagerInstalled: false,
  isLoading: true,
};

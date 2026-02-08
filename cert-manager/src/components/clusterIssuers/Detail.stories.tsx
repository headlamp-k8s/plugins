import {
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ACMEIssuerStatus, Condition, IssuerSpec } from '../../resources/common';
import {
  ACMEChallengeSolverComponent,
  ACMEIssuerStatusComponent,
  ConditionsTable,
  NotInstalledBanner,
  SecretKeySelectorComponent,
  StringArray,
} from '../common/CommonComponents';

// Mock cluster issuer data structure for stories
interface MockClusterIssuerDetail {
  metadata: {
    name: string;
    creationTimestamp: string;
    uid: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: IssuerSpec;
  status: {
    conditions?: Condition[];
    acme?: ACMEIssuerStatus;
  };
  ready: boolean;
}

interface PureClusterIssuerDetailProps {
  clusterIssuer: MockClusterIssuerDetail | null;
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Helper function to render issuer type specific info
function renderIssuerTypeInfo(spec: IssuerSpec) {
  if (spec.acme) {
    return (
      <SectionBox title="ACME Configuration">
        <NameValueTable
          rows={[
            { name: 'Email', value: spec.acme.email || '-' },
            { name: 'Server', value: spec.acme.server || '-' },
            { name: 'Preferred Chain', value: spec.acme.preferredChain || '-' },
            { name: 'Skip TLS Verify', value: spec.acme.skipTLSVerify?.toString() || 'false' },
            {
              name: 'Private Key Secret Ref',
              value: spec.acme.privateKeySecretRef ? (
                <SecretKeySelectorComponent selector={spec.acme.privateKeySecretRef} />
              ) : (
                '-'
              ),
            },
            {
              name: 'Solvers',
              value:
                spec.acme.solvers?.map((solver, index) => (
                  <Box key={index} mb={2}>
                    <ACMEChallengeSolverComponent solver={solver} />
                  </Box>
                )) || '-',
            },
          ]}
        />
      </SectionBox>
    );
  }

  if (spec.ca) {
    return (
      <SectionBox title="CA Configuration">
        <NameValueTable
          rows={[
            { name: 'Secret Name', value: spec.ca.secretName || '-' },
            {
              name: 'CRL Distribution Points',
              value: <StringArray items={spec.ca.crlDistributionPoints} />,
            },
          ]}
        />
      </SectionBox>
    );
  }

  if (spec.selfSigned) {
    return (
      <SectionBox title="Self-Signed Configuration">
        <NameValueTable
          rows={[
            {
              name: 'CRL Distribution Points',
              value: <StringArray items={spec.selfSigned.crlDistributionPoints} />,
            },
          ]}
        />
      </SectionBox>
    );
  }

  if (spec.vault) {
    return (
      <SectionBox title="Vault Configuration">
        <NameValueTable
          rows={[
            { name: 'Server', value: spec.vault.server || '-' },
            { name: 'Path', value: spec.vault.path || '-' },
            { name: 'Namespace', value: spec.vault.namespace || '-' },
            { name: 'CA Bundle', value: spec.vault.caBundle ? 'Configured' : '-' },
            {
              name: 'Auth Method',
              value: spec.vault.auth?.tokenSecretRef
                ? 'Token'
                : spec.vault.auth?.appRole
                ? 'AppRole'
                : spec.vault.auth?.kubernetes
                ? 'Kubernetes'
                : '-',
            },
          ]}
        />
      </SectionBox>
    );
  }

  if (spec.venafi) {
    return (
      <SectionBox title="Venafi Configuration">
        <NameValueTable
          rows={[
            { name: 'Zone', value: spec.venafi.zone || '-' },
            {
              name: 'TPP URL',
              value: spec.venafi.tpp?.url || '-',
            },
            {
              name: 'Cloud URL',
              value: spec.venafi.cloud?.url || '-',
            },
          ]}
        />
      </SectionBox>
    );
  }

  return null;
}

// Pure component for Storybook testing
export function PureClusterIssuerDetail({
  clusterIssuer,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureClusterIssuerDetailProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  if (!clusterIssuer) {
    return (
      <Box p={2}>
        <SectionHeader title="Cluster Issuer Details" />
        <Box>Cluster Issuer not found</Box>
      </Box>
    );
  }

  const issuerType = clusterIssuer.spec.acme
    ? 'ACME'
    : clusterIssuer.spec.ca
    ? 'CA'
    : clusterIssuer.spec.selfSigned
    ? 'Self-Signed'
    : clusterIssuer.spec.vault
    ? 'Vault'
    : clusterIssuer.spec.venafi
    ? 'Venafi'
    : 'Unknown';

  return (
    <Box>
      <SectionHeader title={`Cluster Issuer: ${clusterIssuer.metadata.name}`} />

      {/* Main Info */}
      <SectionBox title="Info">
        <NameValueTable
          rows={[
            { name: 'Name', value: clusterIssuer.metadata.name },
            { name: 'Ready', value: clusterIssuer.ready ? 'Ready' : 'Not Ready' },
            { name: 'Type', value: issuerType },
          ]}
        />
      </SectionBox>

      {/* Issuer Type Configuration */}
      {renderIssuerTypeInfo(clusterIssuer.spec)}

      {/* ACME Status (if applicable) */}
      {clusterIssuer.status?.acme && (
        <SectionBox title="ACME Status">
          <ACMEIssuerStatusComponent status={clusterIssuer.status.acme} />
        </SectionBox>
      )}

      {/* Conditions */}
      {clusterIssuer.status?.conditions && clusterIssuer.status.conditions.length > 0 && (
        <ConditionsTable conditions={clusterIssuer.status.conditions} />
      )}
    </Box>
  );
}

export default {
  title: 'cert-manager/ClusterIssuers/Detail',
  component: PureClusterIssuerDetail,
  decorators: [
    (Story: StoryFn) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} as Meta;

const Template: StoryFn<PureClusterIssuerDetailProps> = args => (
  <PureClusterIssuerDetail {...args} />
);

// Sample mock data for different cluster issuer types
const acmeClusterIssuer: MockClusterIssuerDetail = {
  metadata: {
    name: 'letsencrypt-prod',
    creationTimestamp: '2024-01-01T00:00:00Z',
    uid: 'cluster-issuer-acme-1',
  },
  spec: {
    acme: {
      email: 'admin@example.com',
      server: 'https://acme-v02.api.letsencrypt.org/directory',
      privateKeySecretRef: {
        name: 'letsencrypt-prod-account-key',
        key: 'tls.key',
      },
      solvers: [
        {
          http01: {
            ingress: {
              class: 'nginx',
            },
          },
        },
      ],
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
    acme: {
      uri: 'https://acme-v02.api.letsencrypt.org/acme/acct/123456789',
      lastRegisteredEmail: 'admin@example.com',
      lastPrivateKeyHash: 'sha256:abc123def456...',
    },
  },
  ready: true,
};

const stagingClusterIssuer: MockClusterIssuerDetail = {
  metadata: {
    name: 'letsencrypt-staging',
    creationTimestamp: '2024-01-01T00:00:00Z',
    uid: 'cluster-issuer-acme-2',
  },
  spec: {
    acme: {
      email: 'dev@example.com',
      server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
      privateKeySecretRef: {
        name: 'letsencrypt-staging-account-key',
        key: 'tls.key',
      },
      solvers: [
        {
          http01: {
            ingress: {
              ingressClassName: 'traefik',
            },
          },
        },
      ],
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
    acme: {
      uri: 'https://acme-staging-v02.api.letsencrypt.org/acme/acct/987654321',
      lastRegisteredEmail: 'dev@example.com',
    },
  },
  ready: true,
};

const selfSignedClusterIssuer: MockClusterIssuerDetail = {
  metadata: {
    name: 'self-signed-cluster',
    creationTimestamp: '2024-01-02T00:00:00Z',
    uid: 'cluster-issuer-selfsigned-1',
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
};

const caClusterIssuer: MockClusterIssuerDetail = {
  metadata: {
    name: 'cluster-ca-issuer',
    creationTimestamp: '2024-01-03T00:00:00Z',
    uid: 'cluster-issuer-ca-1',
  },
  spec: {
    ca: {
      secretName: 'cluster-ca-key-pair',
      crlDistributionPoints: ['http://crl.example.com/cluster-ca.crl'],
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
};

const failedClusterIssuer: MockClusterIssuerDetail = {
  metadata: {
    name: 'vault-cluster-issuer',
    creationTimestamp: '2024-01-04T00:00:00Z',
    uid: 'cluster-issuer-vault-1',
  },
  spec: {
    vault: {
      server: 'https://vault.example.com',
      path: 'pki/sign/cluster-role',
      auth: {
        kubernetes: {
          role: 'cert-manager',
          mountPath: '/v1/auth/kubernetes',
        },
      },
    },
  },
  status: {
    conditions: [
      {
        type: 'Ready',
        status: 'False',
        reason: 'VaultVerifyError',
        message: 'Vault server returned error: connection refused',
        lastTransitionTime: '2024-01-04T00:02:00Z',
      },
    ],
  },
  ready: false,
};

const acmeWithDNS01ClusterIssuer: MockClusterIssuerDetail = {
  metadata: {
    name: 'letsencrypt-dns-cluster',
    creationTimestamp: '2024-01-05T00:00:00Z',
    uid: 'cluster-issuer-acme-dns-1',
  },
  spec: {
    acme: {
      email: 'admin@example.com',
      server: 'https://acme-v02.api.letsencrypt.org/directory',
      privateKeySecretRef: {
        name: 'letsencrypt-dns-account-key',
        key: 'tls.key',
      },
      solvers: [
        {
          dns01: {
            provider: 'route53',
            route53: {
              region: 'us-east-1',
            },
          },
          selector: {
            dnsZones: ['example.com', 'example.org'],
          },
        },
        {
          http01: {
            ingress: {
              class: 'nginx',
            },
          },
        },
      ],
    },
  },
  status: {
    conditions: [
      {
        type: 'Ready',
        status: 'True',
        reason: 'ACMEAccountRegistered',
        message: 'The ACME account was registered with the ACME server',
        lastTransitionTime: '2024-01-05T00:05:00Z',
      },
    ],
    acme: {
      uri: 'https://acme-v02.api.letsencrypt.org/acme/acct/555555555',
      lastRegisteredEmail: 'admin@example.com',
    },
  },
  ready: true,
};

// Stories
export const ACMEProd = Template.bind({});
ACMEProd.args = {
  clusterIssuer: acmeClusterIssuer,
  isCertManagerInstalled: true,
};

export const ACMEStaging = Template.bind({});
ACMEStaging.args = {
  clusterIssuer: stagingClusterIssuer,
  isCertManagerInstalled: true,
};

export const ACMEWithDNS01 = Template.bind({});
ACMEWithDNS01.args = {
  clusterIssuer: acmeWithDNS01ClusterIssuer,
  isCertManagerInstalled: true,
};

export const SelfSigned = Template.bind({});
SelfSigned.args = {
  clusterIssuer: selfSignedClusterIssuer,
  isCertManagerInstalled: true,
};

export const CA = Template.bind({});
CA.args = {
  clusterIssuer: caClusterIssuer,
  isCertManagerInstalled: true,
};

export const Failed = Template.bind({});
Failed.args = {
  clusterIssuer: failedClusterIssuer,
  isCertManagerInstalled: true,
};

export const NotFound = Template.bind({});
NotFound.args = {
  clusterIssuer: null,
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  clusterIssuer: null,
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  clusterIssuer: null,
  isCertManagerInstalled: false,
  isLoading: true,
};

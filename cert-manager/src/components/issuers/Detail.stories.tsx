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

// Mock issuer data structure for stories
interface MockIssuerDetail {
  metadata: {
    name: string;
    namespace: string;
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

interface PureIssuerDetailProps {
  issuer: MockIssuerDetail | null;
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
export function PureIssuerDetail({
  issuer,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureIssuerDetailProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  if (!issuer) {
    return (
      <Box p={2}>
        <SectionHeader title="Issuer Details" />
        <Box>Issuer not found</Box>
      </Box>
    );
  }

  const issuerType = issuer.spec.acme
    ? 'ACME'
    : issuer.spec.ca
    ? 'CA'
    : issuer.spec.selfSigned
    ? 'Self-Signed'
    : issuer.spec.vault
    ? 'Vault'
    : issuer.spec.venafi
    ? 'Venafi'
    : 'Unknown';

  return (
    <Box>
      <SectionHeader title={`Issuer: ${issuer.metadata.name}`} />

      {/* Main Info */}
      <SectionBox title="Info">
        <NameValueTable
          rows={[
            { name: 'Name', value: issuer.metadata.name },
            { name: 'Namespace', value: issuer.metadata.namespace },
            { name: 'Ready', value: issuer.ready ? 'Ready' : 'Not Ready' },
            { name: 'Type', value: issuerType },
          ]}
        />
      </SectionBox>

      {/* Issuer Type Configuration */}
      {renderIssuerTypeInfo(issuer.spec)}

      {/* ACME Status (if applicable) */}
      {issuer.status?.acme && (
        <SectionBox title="ACME Status">
          <ACMEIssuerStatusComponent status={issuer.status.acme} />
        </SectionBox>
      )}

      {/* Conditions */}
      {issuer.status?.conditions && issuer.status.conditions.length > 0 && (
        <ConditionsTable conditions={issuer.status.conditions} />
      )}
    </Box>
  );
}

export default {
  title: 'cert-manager/Issuers/Detail',
  component: PureIssuerDetail,
  decorators: [
    (Story: StoryFn) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} as Meta;

const Template: StoryFn<PureIssuerDetailProps> = args => <PureIssuerDetail {...args} />;

// Sample mock data for different issuer types
const acmeIssuer: MockIssuerDetail = {
  metadata: {
    name: 'letsencrypt-prod',
    namespace: 'cert-manager',
    creationTimestamp: '2024-01-01T00:00:00Z',
    uid: 'issuer-acme-1',
  },
  spec: {
    acme: {
      email: 'admin@example.com',
      server: 'https://acme-v02.api.letsencrypt.org/directory',
      privateKeySecretRef: {
        name: 'letsencrypt-account-key',
        key: 'tls.key',
      },
      solvers: [
        {
          http01: {
            ingress: {
              class: 'nginx',
              serviceType: 'ClusterIP',
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

const selfSignedIssuer: MockIssuerDetail = {
  metadata: {
    name: 'self-signed-issuer',
    namespace: 'default',
    creationTimestamp: '2024-01-02T00:00:00Z',
    uid: 'issuer-selfsigned-1',
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

const caIssuer: MockIssuerDetail = {
  metadata: {
    name: 'internal-ca-issuer',
    namespace: 'cert-manager',
    creationTimestamp: '2024-01-03T00:00:00Z',
    uid: 'issuer-ca-1',
  },
  spec: {
    ca: {
      secretName: 'internal-ca-key-pair',
      crlDistributionPoints: ['http://crl.example.com/ca.crl'],
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

const vaultIssuer: MockIssuerDetail = {
  metadata: {
    name: 'vault-issuer',
    namespace: 'production',
    creationTimestamp: '2024-01-04T00:00:00Z',
    uid: 'issuer-vault-1',
  },
  spec: {
    vault: {
      server: 'https://vault.example.com',
      path: 'pki/sign/my-issuing-role',
      namespace: 'admin',
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
        status: 'True',
        reason: 'VaultVerified',
        message: 'Vault verified',
        lastTransitionTime: '2024-01-04T00:03:00Z',
      },
    ],
  },
  ready: true,
};

const vaultIssuerFailed: MockIssuerDetail = {
  metadata: {
    name: 'vault-issuer-failed',
    namespace: 'staging',
    creationTimestamp: '2024-01-04T00:00:00Z',
    uid: 'issuer-vault-2',
  },
  spec: {
    vault: {
      server: 'https://vault.example.com',
      path: 'pki/sign/wrong-role',
      auth: {
        tokenSecretRef: {
          name: 'vault-token',
          key: 'token',
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
        message: 'Vault server returned error: permission denied',
        lastTransitionTime: '2024-01-04T00:02:00Z',
      },
    ],
  },
  ready: false,
};

const venafiIssuer: MockIssuerDetail = {
  metadata: {
    name: 'venafi-issuer',
    namespace: 'enterprise',
    creationTimestamp: '2024-01-05T00:00:00Z',
    uid: 'issuer-venafi-1',
  },
  spec: {
    venafi: {
      zone: 'My Application\\Certificate Policy',
      tpp: {
        url: 'https://tpp.venafi.example.com/vedsdk',
        credentialsRef: {
          name: 'venafi-tpp-credentials',
          key: 'access-token',
        },
      },
    },
  },
  status: {
    conditions: [
      {
        type: 'Ready',
        status: 'True',
        reason: 'Verified',
        message: 'Venafi issuer verified',
        lastTransitionTime: '2024-01-05T00:03:00Z',
      },
    ],
  },
  ready: true,
};

const acmeIssuerWithDNS01: MockIssuerDetail = {
  metadata: {
    name: 'letsencrypt-dns',
    namespace: 'cert-manager',
    creationTimestamp: '2024-01-06T00:00:00Z',
    uid: 'issuer-acme-dns-1',
  },
  spec: {
    acme: {
      email: 'admin@example.com',
      server: 'https://acme-v02.api.letsencrypt.org/directory',
      privateKeySecretRef: {
        name: 'letsencrypt-account-key',
        key: 'tls.key',
      },
      solvers: [
        {
          dns01: {
            provider: 'cloudflare',
            cloudflare: {
              email: 'admin@example.com',
            },
          },
          selector: {
            dnsZones: ['example.com'],
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
        lastTransitionTime: '2024-01-06T00:05:00Z',
      },
    ],
    acme: {
      uri: 'https://acme-v02.api.letsencrypt.org/acme/acct/987654321',
      lastRegisteredEmail: 'admin@example.com',
    },
  },
  ready: true,
};

// Stories
export const ACMEIssuer = Template.bind({});
ACMEIssuer.args = {
  issuer: acmeIssuer,
  isCertManagerInstalled: true,
};

export const ACMEIssuerWithDNS01 = Template.bind({});
ACMEIssuerWithDNS01.args = {
  issuer: acmeIssuerWithDNS01,
  isCertManagerInstalled: true,
};

export const SelfSignedIssuer = Template.bind({});
SelfSignedIssuer.args = {
  issuer: selfSignedIssuer,
  isCertManagerInstalled: true,
};

export const CAIssuer = Template.bind({});
CAIssuer.args = {
  issuer: caIssuer,
  isCertManagerInstalled: true,
};

export const VaultIssuer = Template.bind({});
VaultIssuer.args = {
  issuer: vaultIssuer,
  isCertManagerInstalled: true,
};

export const VaultIssuerFailed = Template.bind({});
VaultIssuerFailed.args = {
  issuer: vaultIssuerFailed,
  isCertManagerInstalled: true,
};

export const VenafiIssuer = Template.bind({});
VenafiIssuer.args = {
  issuer: venafiIssuer,
  isCertManagerInstalled: true,
};

export const NotFound = Template.bind({});
NotFound.args = {
  issuer: null,
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  issuer: null,
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  issuer: null,
  isCertManagerInstalled: false,
  isLoading: true,
};

import { Meta, StoryFn } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import {
  ACMEChallengeSolver,
  ACMEIssuerStatus,
  Condition,
  IssuerReference,
  SecretKeySelector,
} from '../../resources/common';
import {
  ACMEChallengeSolverComponent,
  ACMEIssuerStatusComponent,
  ConditionsTable,
  CopyToClipboard,
  IssuerRef,
  NotInstalledBanner,
  SecretKeySelectorComponent,
  StringArray,
} from './CommonComponents';

// =============================================================================
// CopyToClipboard Stories
// =============================================================================

export default {
  title: 'cert-manager/Common/CopyToClipboard',
  component: CopyToClipboard,
} as Meta;

const CopyToClipboardTemplate: StoryFn<{ text: string; maxDisplayLength?: number }> = args => (
  <CopyToClipboard {...args} />
);

export const ShortText = CopyToClipboardTemplate.bind({});
ShortText.args = {
  text: 'short-certificate-text',
};

export const LongText = CopyToClipboardTemplate.bind({});
LongText.args = {
  text: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURGekNDQWYrZ0F3SUJBZ0lSQU...',
  maxDisplayLength: 30,
};

export const CustomMaxLength = CopyToClipboardTemplate.bind({});
CustomMaxLength.args = {
  text: 'This is a medium length certificate text that will be truncated',
  maxDisplayLength: 20,
};

// =============================================================================
// IssuerRef Stories
// =============================================================================

export const IssuerRefStory = {
  title: 'cert-manager/Common/IssuerRef',
  component: IssuerRef,
  decorators: [
    (Story: StoryFn) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
};

const IssuerRefTemplate: StoryFn<{ issuerRef: IssuerReference; namespace: string }> = args => (
  <IssuerRef {...args} />
);

export const NamespacedIssuer = IssuerRefTemplate.bind({});
NamespacedIssuer.args = {
  issuerRef: {
    name: 'letsencrypt-prod',
    kind: 'Issuer',
    group: 'cert-manager.io',
  },
  namespace: 'default',
};
NamespacedIssuer.decorators = [
  (Story: StoryFn) => (
    <BrowserRouter>
      <Story />
    </BrowserRouter>
  ),
];

export const ClusterIssuerRef = IssuerRefTemplate.bind({});
ClusterIssuerRef.args = {
  issuerRef: {
    name: 'letsencrypt-cluster-issuer',
    kind: 'ClusterIssuer',
    group: 'cert-manager.io',
  },
  namespace: 'default',
};
ClusterIssuerRef.decorators = [
  (Story: StoryFn) => (
    <BrowserRouter>
      <Story />
    </BrowserRouter>
  ),
];

export const IssuerRefWithoutKind = IssuerRefTemplate.bind({});
IssuerRefWithoutKind.args = {
  issuerRef: {
    name: 'my-issuer',
  },
  namespace: 'cert-manager',
};
IssuerRefWithoutKind.decorators = [
  (Story: StoryFn) => (
    <BrowserRouter>
      <Story />
    </BrowserRouter>
  ),
];

// =============================================================================
// ConditionsTable Stories
// =============================================================================

const ConditionsTableTemplate: StoryFn<{ conditions: Condition[] }> = args => (
  <ConditionsTable {...args} />
);

export const SingleConditionReady = ConditionsTableTemplate.bind({});
SingleConditionReady.args = {
  conditions: [
    {
      type: 'Ready',
      status: 'True',
      reason: 'Ready',
      message: 'Certificate is up to date and has not expired',
      lastTransitionTime: '2024-01-15T10:30:00Z',
    },
  ],
};

export const MultipleConditions = ConditionsTableTemplate.bind({});
MultipleConditions.args = {
  conditions: [
    {
      type: 'Ready',
      status: 'True',
      reason: 'Ready',
      message: 'Certificate is up to date and has not expired',
      lastTransitionTime: '2024-01-15T10:30:00Z',
    },
    {
      type: 'Issuing',
      status: 'False',
      reason: 'Issued',
      message: 'Certificate issued successfully',
      lastTransitionTime: '2024-01-15T10:29:00Z',
    },
  ],
};

export const ConditionWithError = ConditionsTableTemplate.bind({});
ConditionWithError.args = {
  conditions: [
    {
      type: 'Ready',
      status: 'False',
      reason: 'Failed',
      message: 'The certificate could not be issued: ACME server error',
      lastTransitionTime: '2024-01-15T10:30:00Z',
    },
    {
      type: 'Issuing',
      status: 'True',
      reason: 'Pending',
      message: 'Waiting for certificate issuance',
      lastTransitionTime: '2024-01-15T10:25:00Z',
    },
  ],
};

export const EmptyConditions = ConditionsTableTemplate.bind({});
EmptyConditions.args = {
  conditions: [],
};

// =============================================================================
// SecretKeySelectorComponent Stories
// =============================================================================

const SecretKeySelectorTemplate: StoryFn<{ selector: SecretKeySelector }> = args => (
  <SecretKeySelectorComponent {...args} />
);

export const SecretKeySelectorDefault = SecretKeySelectorTemplate.bind({});
SecretKeySelectorDefault.args = {
  selector: {
    name: 'letsencrypt-account-key',
    key: 'tls.key',
  },
};

export const SecretKeySelectorWithoutKey = SecretKeySelectorTemplate.bind({});
SecretKeySelectorWithoutKey.args = {
  selector: {
    name: 'my-secret',
  },
};

// =============================================================================
// ACMEChallengeSolverComponent Stories
// =============================================================================

const ACMEChallengeSolverTemplate: StoryFn<{ solver: ACMEChallengeSolver }> = args => (
  <ACMEChallengeSolverComponent {...args} />
);

export const HTTP01Solver = ACMEChallengeSolverTemplate.bind({});
HTTP01Solver.args = {
  solver: {
    http01: {
      ingress: {
        class: 'nginx',
        serviceType: 'ClusterIP',
      },
    },
  },
};

export const HTTP01SolverWithIngressClassName = ACMEChallengeSolverTemplate.bind({});
HTTP01SolverWithIngressClassName.args = {
  solver: {
    http01: {
      ingress: {
        ingressClassName: 'nginx',
        serviceType: 'NodePort',
      },
    },
  },
};

export const HTTP01SolverWithPodTemplate = ACMEChallengeSolverTemplate.bind({});
HTTP01SolverWithPodTemplate.args = {
  solver: {
    http01: {
      ingress: {
        class: 'traefik',
        podTemplate: {
          spec: {
            nodeSelector: {
              'kubernetes.io/os': 'linux',
            },
          },
        },
      },
    },
  },
};

export const DNS01Solver = ACMEChallengeSolverTemplate.bind({});
DNS01Solver.args = {
  solver: {
    dns01: {
      provider: 'cloudflare',
      cloudflare: {
        email: 'admin@example.com',
      },
    },
  },
};

export const DNS01SolverRoute53 = ACMEChallengeSolverTemplate.bind({});
DNS01SolverRoute53.args = {
  solver: {
    dns01: {
      provider: 'route53',
      route53: {
        region: 'us-east-1',
        hostedZoneID: 'Z1234567890ABC',
      },
    },
  },
};

// =============================================================================
// ACMEIssuerStatusComponent Stories
// =============================================================================

const ACMEIssuerStatusTemplate: StoryFn<{ status: ACMEIssuerStatus }> = args => (
  <ACMEIssuerStatusComponent {...args} />
);

export const ACMEIssuerStatusComplete = ACMEIssuerStatusTemplate.bind({});
ACMEIssuerStatusComplete.args = {
  status: {
    uri: 'https://acme-v02.api.letsencrypt.org/acme/acct/123456789',
    lastRegisteredEmail: 'admin@example.com',
    lastPrivateKeyHash: 'sha256:abc123def456...',
  },
};

export const ACMEIssuerStatusPartial = ACMEIssuerStatusTemplate.bind({});
ACMEIssuerStatusPartial.args = {
  status: {
    uri: 'https://acme-staging-v02.api.letsencrypt.org/acme/acct/987654321',
  },
};

// =============================================================================
// StringArray Stories
// =============================================================================

const StringArrayTemplate: StoryFn<{ items?: string[]; emptyText?: string }> = args => (
  <StringArray {...args} />
);

export const StringArrayWithItems = StringArrayTemplate.bind({});
StringArrayWithItems.args = {
  items: ['example.com', 'www.example.com', 'api.example.com'],
};

export const StringArraySingleItem = StringArrayTemplate.bind({});
StringArraySingleItem.args = {
  items: ['localhost'],
};

export const StringArrayEmpty = StringArrayTemplate.bind({});
StringArrayEmpty.args = {
  items: [],
};

export const StringArrayEmptyWithCustomText = StringArrayTemplate.bind({});
StringArrayEmptyWithCustomText.args = {
  items: [],
  emptyText: 'No DNS names configured',
};

export const StringArrayUndefined = StringArrayTemplate.bind({});
StringArrayUndefined.args = {
  items: undefined,
};

// =============================================================================
// NotInstalledBanner Stories
// =============================================================================

const NotInstalledBannerTemplate: StoryFn<{ isLoading?: boolean }> = args => (
  <NotInstalledBanner {...args} />
);

export const NotInstalledBannerDefault = NotInstalledBannerTemplate.bind({});
NotInstalledBannerDefault.args = {
  isLoading: false,
};

export const NotInstalledBannerLoading = NotInstalledBannerTemplate.bind({});
NotInstalledBannerLoading.args = {
  isLoading: true,
};

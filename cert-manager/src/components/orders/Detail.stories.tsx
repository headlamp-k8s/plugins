import {
  NameValueTable,
  SectionBox,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { IssuerReference } from '../../resources/common';
import {
  CopyToClipboard,
  IssuerRef,
  NotInstalledBanner,
  StringArray,
} from '../common/CommonComponents';

// Mock order authorization and challenge types
interface MockChallenge {
  type: string;
  token: string;
  url: string;
}

interface MockAuthorization {
  identifier: string;
  initialState: string;
  url: string;
  wildcard: boolean;
  challenges: MockChallenge[];
}

// Mock order data structure for stories
interface MockOrderDetail {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    uid: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    request: string;
    issuerRef: IssuerReference;
    commonName?: string;
    dnsNames?: string[];
    ipAddresses?: string[];
    duration?: string;
  };
  status: {
    state: string;
    url?: string;
    finalizeURL?: string;
    certificate?: string;
    failureTime?: string;
    reason?: string;
    authorizations?: MockAuthorization[];
  };
}

interface PureOrderDetailProps {
  order: MockOrderDetail | null;
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureOrderDetail({
  order,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureOrderDetailProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  if (!order) {
    return (
      <Box p={2}>
        <SectionHeader title="Order Details" />
        <Box>Order not found</Box>
      </Box>
    );
  }

  return (
    <Box>
      <SectionHeader title={`Order: ${order.metadata.name}`} />

      {/* Main Info */}
      <SectionBox title="Info">
        <NameValueTable
          rows={[
            { name: 'Name', value: order.metadata.name },
            { name: 'Namespace', value: order.metadata.namespace },
            { name: 'Common Name', value: order.spec?.commonName || '-' },
            {
              name: 'DNS Names',
              value: <StringArray items={order.spec?.dnsNames} />,
            },
            {
              name: 'IP Addresses',
              value: <StringArray items={order.spec?.ipAddresses} />,
            },
            { name: 'Duration', value: order.spec?.duration || '-' },
            {
              name: 'Issuer Ref',
              value: order.spec.issuerRef && (
                <IssuerRef issuerRef={order.spec.issuerRef} namespace={order.metadata.namespace} />
              ),
            },
            {
              name: 'Request',
              value: <CopyToClipboard text={order.spec.request} />,
            },
          ]}
        />
      </SectionBox>

      {/* Authorizations Section */}
      {order.status?.authorizations && order.status.authorizations.length > 0 && (
        <SectionBox title="Authorizations">
          {order.status.authorizations.map((auth, index) => (
            <Box key={index} mb={3}>
              <NameValueTable
                rows={[
                  { name: 'Identifier', value: auth.identifier },
                  { name: 'Initial State', value: auth?.initialState || '-' },
                  { name: 'URL', value: auth.url },
                  { name: 'Wildcard', value: auth.wildcard.toString() },
                  {
                    name: 'Challenges',
                    value: (
                      <SimpleTable
                        columns={[
                          {
                            label: 'Type',
                            getter: (challenge: MockChallenge) => challenge.type,
                          },
                          {
                            label: 'Token',
                            getter: (challenge: MockChallenge) => challenge.token,
                          },
                          {
                            label: 'URL',
                            getter: (challenge: MockChallenge) => challenge.url,
                          },
                        ]}
                        data={auth.challenges}
                      />
                    ),
                  },
                ]}
              />
            </Box>
          ))}
        </SectionBox>
      )}

      {/* Status Section */}
      {order.status && (
        <SectionBox title="Status">
          <NameValueTable
            rows={[
              { name: 'State', value: order.status?.state || '-' },
              { name: 'URL', value: order.status?.url || '-' },
              { name: 'Finalize URL', value: order.status?.finalizeURL || '-' },
              {
                name: 'Certificate',
                value: order.status?.certificate ? (
                  <CopyToClipboard text={order.status.certificate} />
                ) : (
                  '-'
                ),
              },
              { name: 'Failure Time', value: order.status?.failureTime || '-' },
              { name: 'Reason', value: order.status?.reason || '-' },
            ]}
          />
        </SectionBox>
      )}
    </Box>
  );
}

export default {
  title: 'cert-manager/Orders/Detail',
  component: PureOrderDetail,
  decorators: [
    (Story: StoryFn) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} as Meta;

const Template: StoryFn<PureOrderDetailProps> = args => <PureOrderDetail {...args} />;

// Sample mock data
const pendingOrder: MockOrderDetail = {
  metadata: {
    name: 'example-com-tls-1-123456789',
    namespace: 'default',
    creationTimestamp: '2024-01-15T10:30:00Z',
    uid: 'order-1',
    labels: {
      'acme.cert-manager.io/certificate': 'example-com-tls',
    },
  },
  spec: {
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FE...',
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
      group: 'cert-manager.io',
    },
    commonName: 'example.com',
    dnsNames: ['example.com', 'www.example.com'],
    duration: '2160h',
  },
  status: {
    state: 'pending',
    url: 'https://acme-v02.api.letsencrypt.org/acme/order/123456789',
    finalizeURL: 'https://acme-v02.api.letsencrypt.org/acme/finalize/123456789',
    authorizations: [
      {
        identifier: 'example.com',
        initialState: 'pending',
        url: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/123456789',
        wildcard: false,
        challenges: [
          {
            type: 'http-01',
            token: 'abc123def456',
            url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/123456789/http01',
          },
          {
            type: 'dns-01',
            token: 'abc123def456',
            url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/123456789/dns01',
          },
        ],
      },
      {
        identifier: 'www.example.com',
        initialState: 'pending',
        url: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/987654321',
        wildcard: false,
        challenges: [
          {
            type: 'http-01',
            token: 'ghi789jkl012',
            url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/987654321/http01',
          },
        ],
      },
    ],
  },
};

const validOrder: MockOrderDetail = {
  metadata: {
    name: 'api-example-com-tls-1-987654321',
    namespace: 'production',
    creationTimestamp: '2024-01-15T10:25:00Z',
    uid: 'order-2',
  },
  spec: {
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FE...',
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
    },
    commonName: 'api.example.com',
    dnsNames: ['api.example.com'],
    duration: '2160h',
  },
  status: {
    state: 'valid',
    url: 'https://acme-v02.api.letsencrypt.org/acme/order/987654321',
    finalizeURL: 'https://acme-v02.api.letsencrypt.org/acme/finalize/987654321',
    certificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURJVENDQWdtZ0F3SUJBZ0lSQU9GQktr...',
    authorizations: [
      {
        identifier: 'api.example.com',
        initialState: 'valid',
        url: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/555666777',
        wildcard: false,
        challenges: [
          {
            type: 'http-01',
            token: 'mno345pqr678',
            url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/555666777/http01',
          },
        ],
      },
    ],
  },
};

const wildcardOrder: MockOrderDetail = {
  metadata: {
    name: 'wildcard-example-com-tls-1-111222333',
    namespace: 'default',
    creationTimestamp: '2024-01-15T10:20:00Z',
    uid: 'order-3',
  },
  spec: {
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FE...',
    issuerRef: {
      name: 'letsencrypt-dns',
      kind: 'ClusterIssuer',
    },
    dnsNames: ['*.example.com', 'example.com'],
    duration: '2160h',
  },
  status: {
    state: 'ready',
    url: 'https://acme-v02.api.letsencrypt.org/acme/order/111222333',
    finalizeURL: 'https://acme-v02.api.letsencrypt.org/acme/finalize/111222333',
    authorizations: [
      {
        identifier: '*.example.com',
        initialState: 'valid',
        url: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/111222333',
        wildcard: true,
        challenges: [
          {
            type: 'dns-01',
            token: 'stu901vwx234',
            url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/111222333/dns01',
          },
        ],
      },
      {
        identifier: 'example.com',
        initialState: 'valid',
        url: 'https://acme-v02.api.letsencrypt.org/acme/authz-v3/444555666',
        wildcard: false,
        challenges: [
          {
            type: 'dns-01',
            token: 'yza567bcd890',
            url: 'https://acme-v02.api.letsencrypt.org/acme/chall-v3/444555666/dns01',
          },
        ],
      },
    ],
  },
};

const failedOrder: MockOrderDetail = {
  metadata: {
    name: 'staging-tls-1-444555666',
    namespace: 'staging',
    creationTimestamp: '2024-01-15T10:15:00Z',
    uid: 'order-4',
  },
  spec: {
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FE...',
    issuerRef: {
      name: 'letsencrypt-staging',
      kind: 'Issuer',
    },
    commonName: 'staging.example.com',
    dnsNames: ['staging.example.com'],
    duration: '2160h',
  },
  status: {
    state: 'invalid',
    url: 'https://acme-staging-v02.api.letsencrypt.org/acme/order/444555666',
    finalizeURL: 'https://acme-staging-v02.api.letsencrypt.org/acme/finalize/444555666',
    failureTime: '2024-01-15T10:20:00Z',
    reason:
      'Failed to finalize Order: The server could not connect to the client to verify the domain',
    authorizations: [
      {
        identifier: 'staging.example.com',
        initialState: 'invalid',
        url: 'https://acme-staging-v02.api.letsencrypt.org/acme/authz-v3/777888999',
        wildcard: false,
        challenges: [
          {
            type: 'http-01',
            token: 'efg123hij456',
            url: 'https://acme-staging-v02.api.letsencrypt.org/acme/chall-v3/777888999/http01',
          },
        ],
      },
    ],
  },
};

const erroredOrder: MockOrderDetail = {
  metadata: {
    name: 'rate-limited-tls-1-777888999',
    namespace: 'production',
    creationTimestamp: '2024-01-15T10:10:00Z',
    uid: 'order-5',
  },
  spec: {
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FE...',
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
    },
    commonName: 'app.example.com',
    dnsNames: ['app.example.com'],
    duration: '2160h',
  },
  status: {
    state: 'errored',
    failureTime: '2024-01-15T10:15:00Z',
    reason: 'Error creating new order: rateLimited: too many orders recently',
  },
};

const minimalOrder: MockOrderDetail = {
  metadata: {
    name: 'minimal-tls-1-000111222',
    namespace: 'default',
    creationTimestamp: '2024-01-15T10:05:00Z',
    uid: 'order-6',
  },
  spec: {
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FE...',
    issuerRef: {
      name: 'self-signed',
      kind: 'Issuer',
    },
    dnsNames: ['localhost'],
  },
  status: {
    state: 'valid',
  },
};

// Stories
export const Pending = Template.bind({});
Pending.args = {
  order: pendingOrder,
  isCertManagerInstalled: true,
};

export const Valid = Template.bind({});
Valid.args = {
  order: validOrder,
  isCertManagerInstalled: true,
};

export const Ready = Template.bind({});
Ready.args = {
  order: wildcardOrder,
  isCertManagerInstalled: true,
};

export const WildcardOrder = Template.bind({});
WildcardOrder.args = {
  order: wildcardOrder,
  isCertManagerInstalled: true,
};

export const Invalid = Template.bind({});
Invalid.args = {
  order: failedOrder,
  isCertManagerInstalled: true,
};

export const Errored = Template.bind({});
Errored.args = {
  order: erroredOrder,
  isCertManagerInstalled: true,
};

export const Minimal = Template.bind({});
Minimal.args = {
  order: minimalOrder,
  isCertManagerInstalled: true,
};

export const MultipleAuthorizations = Template.bind({});
MultipleAuthorizations.args = {
  order: pendingOrder,
  isCertManagerInstalled: true,
};

export const NotFound = Template.bind({});
NotFound.args = {
  order: null,
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  order: null,
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  order: null,
  isCertManagerInstalled: false,
  isLoading: true,
};

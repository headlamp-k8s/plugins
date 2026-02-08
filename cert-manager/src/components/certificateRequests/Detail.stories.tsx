import {
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Condition, IssuerReference } from '../../resources/common';
import {
  ConditionsTable,
  CopyToClipboard,
  IssuerRef,
  NotInstalledBanner,
} from '../common/CommonComponents';

// Mock certificate request data structure for stories
interface MockCertificateRequestDetail {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    uid: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    issuerRef: IssuerReference;
    request: string;
    username?: string;
    duration?: string;
    isCA?: boolean;
    usages?: string[];
  };
  status: {
    conditions: Condition[];
    certificate?: string;
    ca?: string;
    failureTime?: string;
  };
  ready: boolean;
  approved: string;
  denied: string;
}

interface PureCertificateRequestDetailProps {
  certificateRequest: MockCertificateRequestDetail | null;
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureCertificateRequestDetail({
  certificateRequest,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureCertificateRequestDetailProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  if (!certificateRequest) {
    return (
      <Box p={2}>
        <SectionHeader title="Certificate Request Details" />
        <Box>Certificate request not found</Box>
      </Box>
    );
  }

  return (
    <Box>
      <SectionHeader title={`Certificate Request: ${certificateRequest.metadata.name}`} />

      {/* Main Info */}
      <SectionBox title="Info">
        <NameValueTable
          rows={[
            {
              name: 'Name',
              value: certificateRequest.metadata.name,
            },
            {
              name: 'Namespace',
              value: certificateRequest.metadata.namespace,
            },
            {
              name: 'Ready',
              value: certificateRequest.ready ? 'Ready' : 'Not Ready',
            },
            {
              name: 'Approved',
              value: certificateRequest.approved === 'True' ? 'Yes' : 'No',
            },
            {
              name: 'Denied',
              value: certificateRequest.denied === 'True' ? 'Yes' : 'No',
            },
            {
              name: 'Duration',
              value: certificateRequest.spec?.duration || '-',
            },
            {
              name: 'Is CA',
              value: certificateRequest.spec?.isCA ? 'Yes' : 'No',
            },
            {
              name: 'Usages',
              value:
                certificateRequest.spec?.usages?.length > 0 ? (
                  <NameValueTable
                    rows={certificateRequest.spec.usages.map((usage, index) => ({
                      name: `Usage ${index + 1}`,
                      value: usage,
                    }))}
                  />
                ) : (
                  '-'
                ),
            },
            {
              name: 'Issuer Ref',
              value: certificateRequest.spec.issuerRef && (
                <IssuerRef
                  issuerRef={certificateRequest.spec.issuerRef}
                  namespace={certificateRequest.metadata.namespace}
                />
              ),
            },
            {
              name: 'Request',
              value: <CopyToClipboard text={certificateRequest.spec.request} />,
            },
            {
              name: 'Certificate',
              value: certificateRequest.status?.certificate ? (
                <CopyToClipboard text={certificateRequest.status.certificate} />
              ) : (
                '-'
              ),
            },
            {
              name: 'CA',
              value: certificateRequest.status?.ca ? (
                <CopyToClipboard text={certificateRequest.status.ca} />
              ) : (
                '-'
              ),
            },
            {
              name: 'Failure Time',
              value: certificateRequest.status?.failureTime || '-',
            },
          ]}
        />
      </SectionBox>

      {/* Conditions */}
      {certificateRequest.status?.conditions && certificateRequest.status.conditions.length > 0 && (
        <ConditionsTable conditions={certificateRequest.status.conditions} />
      )}
    </Box>
  );
}

export default {
  title: 'cert-manager/CertificateRequests/Detail',
  component: PureCertificateRequestDetail,
  decorators: [
    (Story: StoryFn) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} as Meta;

const Template: StoryFn<PureCertificateRequestDetailProps> = args => (
  <PureCertificateRequestDetail {...args} />
);

// Sample mock data
const approvedAndReadyRequest: MockCertificateRequestDetail = {
  metadata: {
    name: 'example-com-tls-1',
    namespace: 'default',
    creationTimestamp: '2024-01-15T10:30:00Z',
    uid: 'cr-1',
    labels: {
      'cert-manager.io/certificate-name': 'example-com-tls',
    },
  },
  spec: {
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
      group: 'cert-manager.io',
    },
    request:
      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FEQUJCZ05WQkFNVENHVjRZVzF3YkdVd2...',
    username: 'system:serviceaccount:cert-manager:cert-manager',
    duration: '2160h',
    isCA: false,
    usages: ['digital signature', 'key encipherment', 'server auth'],
  },
  status: {
    conditions: [
      {
        type: 'Approved',
        status: 'True',
        reason: 'cert-manager.io',
        message: 'Certificate request has been approved by cert-manager.io',
        lastTransitionTime: '2024-01-15T10:31:00Z',
      },
      {
        type: 'Ready',
        status: 'True',
        reason: 'Issued',
        message: 'Certificate fetched from issuer successfully',
        lastTransitionTime: '2024-01-15T10:35:00Z',
      },
    ],
    certificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURJVENDQWdtZ0F3SUJBZ0lSQU9GQktrNjJya...',
    ca: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUV4VENDQXF5Z0F3SUJBZ0lSQU9GQktr...',
  },
  ready: true,
  approved: 'True',
  denied: 'False',
};

const pendingRequest: MockCertificateRequestDetail = {
  metadata: {
    name: 'pending-tls-request',
    namespace: 'staging',
    creationTimestamp: '2024-01-20T14:00:00Z',
    uid: 'cr-2',
  },
  spec: {
    issuerRef: {
      name: 'letsencrypt-staging',
      kind: 'Issuer',
    },
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FEQ...',
    username: 'system:serviceaccount:staging:web-app',
    duration: '2160h',
    isCA: false,
    usages: ['digital signature', 'key encipherment', 'server auth'],
  },
  status: {
    conditions: [
      {
        type: 'Approved',
        status: 'True',
        reason: 'cert-manager.io',
        message: 'Certificate request has been approved',
        lastTransitionTime: '2024-01-20T14:00:30Z',
      },
      {
        type: 'Ready',
        status: 'False',
        reason: 'Pending',
        message: 'Waiting for certificate to be issued',
        lastTransitionTime: '2024-01-20T14:00:00Z',
      },
    ],
  },
  ready: false,
  approved: 'True',
  denied: 'False',
};

const deniedRequest: MockCertificateRequestDetail = {
  metadata: {
    name: 'denied-request',
    namespace: 'default',
    creationTimestamp: '2024-01-19T11:00:00Z',
    uid: 'cr-3',
  },
  spec: {
    issuerRef: {
      name: 'restricted-issuer',
      kind: 'Issuer',
    },
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FE...',
    username: 'system:serviceaccount:default:unauthorized-sa',
    duration: '8760h',
    isCA: true,
    usages: ['cert sign', 'crl sign'],
  },
  status: {
    conditions: [
      {
        type: 'Denied',
        status: 'True',
        reason: 'policy.cert-manager.io',
        message:
          'Request denied by CertificateRequestPolicy: isCA certificates are not allowed by this policy',
        lastTransitionTime: '2024-01-19T11:01:00Z',
      },
      {
        type: 'Ready',
        status: 'False',
        reason: 'Denied',
        message: 'Certificate request was denied',
        lastTransitionTime: '2024-01-19T11:01:00Z',
      },
    ],
  },
  ready: false,
  approved: 'False',
  denied: 'True',
};

const failedRequest: MockCertificateRequestDetail = {
  metadata: {
    name: 'failed-request',
    namespace: 'production',
    creationTimestamp: '2024-01-18T09:00:00Z',
    uid: 'cr-4',
  },
  spec: {
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
    },
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FE...',
    username: 'system:serviceaccount:production:api-service',
    duration: '2160h',
    isCA: false,
    usages: ['digital signature', 'key encipherment', 'server auth'],
  },
  status: {
    conditions: [
      {
        type: 'Approved',
        status: 'True',
        reason: 'cert-manager.io',
        message: 'Certificate request has been approved',
        lastTransitionTime: '2024-01-18T09:01:00Z',
      },
      {
        type: 'Ready',
        status: 'False',
        reason: 'Failed',
        message:
          'The certificate request has failed to complete and will be retried: Error finalizing order: ACME server error: rateLimited',
        lastTransitionTime: '2024-01-18T09:05:00Z',
      },
    ],
    failureTime: '2024-01-18T09:05:00Z',
  },
  ready: false,
  approved: 'True',
  denied: 'False',
};

const caRequest: MockCertificateRequestDetail = {
  metadata: {
    name: 'internal-ca-request',
    namespace: 'cert-manager',
    creationTimestamp: '2024-01-01T00:00:00Z',
    uid: 'cr-5',
  },
  spec: {
    issuerRef: {
      name: 'self-signed-issuer',
      kind: 'Issuer',
    },
    request: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ3dqQ0NBYWtDQVFBd0FE...',
    username: 'system:serviceaccount:cert-manager:cert-manager',
    duration: '87600h',
    isCA: true,
    usages: ['cert sign', 'crl sign', 'digital signature'],
  },
  status: {
    conditions: [
      {
        type: 'Approved',
        status: 'True',
        reason: 'cert-manager.io',
        message: 'Certificate request has been approved',
        lastTransitionTime: '2024-01-01T00:00:30Z',
      },
      {
        type: 'Ready',
        status: 'True',
        reason: 'Issued',
        message: 'Certificate fetched from issuer successfully',
        lastTransitionTime: '2024-01-01T00:01:00Z',
      },
    ],
    certificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURJVENDQWdtZ0F3SUJBZ0lSQU9GQktrNjJya...',
  },
  ready: true,
  approved: 'True',
  denied: 'False',
};

// Stories
export const ApprovedAndReady = Template.bind({});
ApprovedAndReady.args = {
  certificateRequest: approvedAndReadyRequest,
  isCertManagerInstalled: true,
};

export const Pending = Template.bind({});
Pending.args = {
  certificateRequest: pendingRequest,
  isCertManagerInstalled: true,
};

export const Denied = Template.bind({});
Denied.args = {
  certificateRequest: deniedRequest,
  isCertManagerInstalled: true,
};

export const Failed = Template.bind({});
Failed.args = {
  certificateRequest: failedRequest,
  isCertManagerInstalled: true,
};

export const CARequest = Template.bind({});
CARequest.args = {
  certificateRequest: caRequest,
  isCertManagerInstalled: true,
};

export const NotFound = Template.bind({});
NotFound.args = {
  certificateRequest: null,
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  certificateRequest: null,
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  certificateRequest: null,
  isCertManagerInstalled: false,
  isLoading: true,
};

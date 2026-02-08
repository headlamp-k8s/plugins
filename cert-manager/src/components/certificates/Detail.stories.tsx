import {
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Condition, IssuerReference, SecretKeySelector } from '../../resources/common';
import {
  ConditionsTable,
  IssuerRef,
  NotInstalledBanner,
  StringArray,
} from '../common/CommonComponents';

// Mock certificate data structure for stories
interface MockCertificateDetail {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    uid: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    secretName: string;
    issuerRef: IssuerReference;
    commonName?: string;
    dnsNames?: string[];
    emailAddresses?: string[];
    ipAddresses?: string[];
    uris?: string[];
    duration?: string;
    renewBefore?: string;
    isCA?: boolean;
    usages?: string[];
    revisionHistoryLimit?: number;
    subject?: {
      organizations?: string[];
      countries?: string[];
      organizationalUnits?: string[];
      localities?: string[];
      provinces?: string[];
      streetAddresses?: string[];
      postalCodes?: string[];
      serialNumber?: string;
    };
    privateKey?: {
      algorithm?: string;
      size?: number;
      encoding?: string;
      rotationPolicy?: string;
    };
    keystores?: {
      jks?: {
        create: boolean;
        passwordSecretRef?: SecretKeySelector;
      };
      pkcs12?: {
        create: boolean;
        passwordSecretRef?: SecretKeySelector;
      };
    };
  };
  status: {
    conditions: Condition[];
    notBefore?: string;
    notAfter?: string;
    renewalTime?: string;
    revision?: number;
    nextPrivateKeySecretName?: string;
  };
  ready: boolean;
}

interface PureCertificateDetailProps {
  certificate: MockCertificateDetail | null;
  isLoading?: boolean;
  isCertManagerInstalled?: boolean;
}

// Pure component for Storybook testing
export function PureCertificateDetail({
  certificate,
  isLoading = false,
  isCertManagerInstalled = true,
}: PureCertificateDetailProps) {
  if (!isCertManagerInstalled) {
    return <NotInstalledBanner isLoading={isLoading} />;
  }

  if (!certificate) {
    return (
      <Box p={2}>
        <SectionHeader title="Certificate Details" />
        <Box>Certificate not found</Box>
      </Box>
    );
  }

  return (
    <Box>
      <SectionHeader title={`Certificate: ${certificate.metadata.name}`} />

      {/* Main Info */}
      <SectionBox title="Info">
        <NameValueTable
          rows={[
            {
              name: 'Name',
              value: certificate.metadata.name,
            },
            {
              name: 'Namespace',
              value: certificate.metadata.namespace,
            },
            {
              name: 'Ready',
              value: certificate.ready ? 'Ready' : 'Not Ready',
            },
            {
              name: 'Common Name',
              value: certificate.spec?.commonName || '-',
            },
            {
              name: 'DNS Names',
              value: <StringArray items={certificate.spec?.dnsNames} />,
            },
            {
              name: 'Email Addresses',
              value: <StringArray items={certificate.spec?.emailAddresses} />,
            },
            {
              name: 'IP Addresses',
              value: <StringArray items={certificate.spec?.ipAddresses} />,
            },
            {
              name: 'URIs',
              value: <StringArray items={certificate.spec?.uris} />,
            },
            {
              name: 'Duration',
              value: certificate.spec?.duration || '-',
            },
            {
              name: 'Renew Before',
              value: certificate.spec?.renewBefore || '-',
            },
            {
              name: 'Is CA',
              value: certificate.spec?.isCA ? 'Yes' : 'No',
            },
            {
              name: 'Usages',
              value: <StringArray items={certificate.spec?.usages} />,
            },
            {
              name: 'Revision History Limit',
              value: certificate.spec?.revisionHistoryLimit?.toString() || '-',
            },
            {
              name: 'Secret Name',
              value: certificate.spec.secretName,
            },
            {
              name: 'Issuer Ref',
              value: certificate.spec.issuerRef && (
                <IssuerRef
                  issuerRef={certificate.spec.issuerRef}
                  namespace={certificate.metadata.namespace}
                />
              ),
            },
          ]}
        />
      </SectionBox>

      {/* Subject Section */}
      {certificate.spec.subject && (
        <SectionBox title="Subject">
          <NameValueTable
            rows={[
              {
                name: 'Organizations',
                value: <StringArray items={certificate.spec.subject?.organizations} />,
              },
              {
                name: 'Countries',
                value: <StringArray items={certificate.spec.subject?.countries} />,
              },
              {
                name: 'Organizational Units',
                value: <StringArray items={certificate.spec.subject?.organizationalUnits} />,
              },
              {
                name: 'Localities',
                value: <StringArray items={certificate.spec.subject?.localities} />,
              },
              {
                name: 'Provinces',
                value: <StringArray items={certificate.spec.subject?.provinces} />,
              },
              {
                name: 'Street Addresses',
                value: <StringArray items={certificate.spec.subject?.streetAddresses} />,
              },
              {
                name: 'Postal Codes',
                value: <StringArray items={certificate.spec.subject?.postalCodes} />,
              },
              {
                name: 'Serial Number',
                value: certificate.spec.subject?.serialNumber || '-',
              },
            ]}
          />
        </SectionBox>
      )}

      {/* Private Key Section */}
      {certificate.spec.privateKey && (
        <SectionBox title="Private Key">
          <NameValueTable
            rows={[
              {
                name: 'Algorithm',
                value: certificate.spec.privateKey?.algorithm || '-',
              },
              {
                name: 'Size',
                value: certificate.spec.privateKey?.size?.toString() || '-',
              },
              {
                name: 'Encoding',
                value: certificate.spec.privateKey?.encoding || '-',
              },
              {
                name: 'Rotation Policy',
                value: certificate.spec.privateKey?.rotationPolicy || '-',
              },
            ]}
          />
        </SectionBox>
      )}

      {/* Keystores Section */}
      {certificate.spec.keystores && (
        <SectionBox title="Keystores">
          <NameValueTable
            rows={[
              {
                name: 'JKS',
                value: certificate.spec.keystores?.jks
                  ? `Create: ${certificate.spec.keystores.jks.create}`
                  : '-',
              },
              {
                name: 'PKCS12',
                value: certificate.spec.keystores?.pkcs12
                  ? `Create: ${certificate.spec.keystores.pkcs12.create}`
                  : '-',
              },
            ]}
          />
        </SectionBox>
      )}

      {/* Status Section */}
      {certificate.status && (
        <SectionBox title="Status">
          <NameValueTable
            rows={[
              {
                name: 'Not Before',
                value: certificate.status?.notBefore || '-',
              },
              {
                name: 'Not After',
                value: certificate.status?.notAfter || '-',
              },
              {
                name: 'Renewal Time',
                value: certificate.status?.renewalTime || '-',
              },
              {
                name: 'Revision',
                value: certificate.status?.revision?.toString() || '-',
              },
              {
                name: 'Next Private Key Secret',
                value: certificate.status?.nextPrivateKeySecretName || '-',
              },
            ]}
          />
        </SectionBox>
      )}

      {/* Conditions */}
      {certificate.status?.conditions && certificate.status.conditions.length > 0 && (
        <ConditionsTable conditions={certificate.status.conditions} />
      )}
    </Box>
  );
}

export default {
  title: 'cert-manager/Certificates/Detail',
  component: PureCertificateDetail,
  decorators: [
    (Story: StoryFn) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} as Meta;

const Template: StoryFn<PureCertificateDetailProps> = args => <PureCertificateDetail {...args} />;

// Sample mock data
const readyCertificate: MockCertificateDetail = {
  metadata: {
    name: 'example-com-tls',
    namespace: 'default',
    creationTimestamp: '2024-01-15T10:30:00Z',
    uid: 'cert-1',
    labels: {
      app: 'example',
      environment: 'production',
    },
  },
  spec: {
    secretName: 'example-com-tls-secret',
    issuerRef: {
      name: 'letsencrypt-prod',
      kind: 'ClusterIssuer',
      group: 'cert-manager.io',
    },
    commonName: 'example.com',
    dnsNames: ['example.com', 'www.example.com', 'api.example.com'],
    duration: '2160h',
    renewBefore: '360h',
    isCA: false,
    usages: ['digital signature', 'key encipherment', 'server auth'],
    revisionHistoryLimit: 1,
    privateKey: {
      algorithm: 'RSA',
      size: 2048,
      encoding: 'PKCS1',
      rotationPolicy: 'Never',
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
      {
        type: 'Issuing',
        status: 'False',
        reason: 'Issued',
        message: 'Certificate issued successfully',
        lastTransitionTime: '2024-01-15T10:34:00Z',
      },
    ],
    notBefore: '2024-01-15T10:30:00Z',
    notAfter: '2024-04-15T10:30:00Z',
    renewalTime: '2024-04-01T10:30:00Z',
    revision: 1,
  },
  ready: true,
};

const caCertificate: MockCertificateDetail = {
  metadata: {
    name: 'internal-ca',
    namespace: 'cert-manager',
    creationTimestamp: '2024-01-01T00:00:00Z',
    uid: 'cert-ca-1',
  },
  spec: {
    secretName: 'internal-ca-secret',
    issuerRef: {
      name: 'self-signed-issuer',
      kind: 'Issuer',
    },
    commonName: 'Internal CA',
    duration: '87600h', // 10 years
    isCA: true,
    usages: ['cert sign', 'crl sign'],
    subject: {
      organizations: ['My Company Inc.'],
      countries: ['US'],
      organizationalUnits: ['Security'],
      localities: ['San Francisco'],
      provinces: ['California'],
    },
    privateKey: {
      algorithm: 'ECDSA',
      size: 256,
      encoding: 'PKCS8',
    },
  },
  status: {
    conditions: [
      {
        type: 'Ready',
        status: 'True',
        reason: 'Ready',
        message: 'Certificate is up to date and has not expired',
        lastTransitionTime: '2024-01-01T00:05:00Z',
      },
    ],
    notBefore: '2024-01-01T00:00:00Z',
    notAfter: '2034-01-01T00:00:00Z',
    revision: 1,
  },
  ready: true,
};

const failedCertificate: MockCertificateDetail = {
  metadata: {
    name: 'failed-tls',
    namespace: 'staging',
    creationTimestamp: '2024-01-20T14:00:00Z',
    uid: 'cert-failed-1',
  },
  spec: {
    secretName: 'failed-tls-secret',
    issuerRef: {
      name: 'letsencrypt-staging',
      kind: 'Issuer',
    },
    commonName: 'staging.example.com',
    dnsNames: ['staging.example.com'],
    duration: '2160h',
    renewBefore: '360h',
    isCA: false,
    usages: ['digital signature', 'key encipherment', 'server auth'],
  },
  status: {
    conditions: [
      {
        type: 'Ready',
        status: 'False',
        reason: 'Failed',
        message: 'The certificate request failed: ACME server error: rate limit exceeded',
        lastTransitionTime: '2024-01-20T14:05:00Z',
      },
      {
        type: 'Issuing',
        status: 'True',
        reason: 'Pending',
        message: 'Issuing certificate as Secret does not contain a certificate',
        lastTransitionTime: '2024-01-20T14:00:00Z',
      },
    ],
  },
  ready: false,
};

const certificateWithKeystores: MockCertificateDetail = {
  metadata: {
    name: 'java-app-tls',
    namespace: 'apps',
    creationTimestamp: '2024-01-18T08:00:00Z',
    uid: 'cert-keystore-1',
  },
  spec: {
    secretName: 'java-app-tls-secret',
    issuerRef: {
      name: 'internal-ca',
      kind: 'Issuer',
    },
    commonName: 'java-app.apps.svc.cluster.local',
    dnsNames: ['java-app', 'java-app.apps', 'java-app.apps.svc.cluster.local'],
    duration: '8760h',
    renewBefore: '720h',
    isCA: false,
    usages: ['digital signature', 'key encipherment', 'server auth', 'client auth'],
    privateKey: {
      algorithm: 'RSA',
      size: 4096,
      encoding: 'PKCS8',
      rotationPolicy: 'Always',
    },
    keystores: {
      jks: {
        create: true,
        passwordSecretRef: {
          name: 'keystore-password',
          key: 'password',
        },
      },
      pkcs12: {
        create: true,
        passwordSecretRef: {
          name: 'keystore-password',
          key: 'password',
        },
      },
    },
  },
  status: {
    conditions: [
      {
        type: 'Ready',
        status: 'True',
        reason: 'Ready',
        message: 'Certificate is up to date and has not expired',
        lastTransitionTime: '2024-01-18T08:05:00Z',
      },
    ],
    notBefore: '2024-01-18T08:00:00Z',
    notAfter: '2025-01-18T08:00:00Z',
    renewalTime: '2024-12-18T08:00:00Z',
    revision: 3,
    nextPrivateKeySecretName: 'java-app-tls-next-key',
  },
  ready: true,
};

const minimalCertificate: MockCertificateDetail = {
  metadata: {
    name: 'minimal-tls',
    namespace: 'default',
    creationTimestamp: '2024-01-22T16:00:00Z',
    uid: 'cert-minimal-1',
  },
  spec: {
    secretName: 'minimal-tls-secret',
    issuerRef: {
      name: 'self-signed',
      kind: 'Issuer',
    },
    dnsNames: ['localhost'],
  },
  status: {
    conditions: [
      {
        type: 'Ready',
        status: 'True',
        reason: 'Ready',
        message: 'Certificate is up to date',
        lastTransitionTime: '2024-01-22T16:01:00Z',
      },
    ],
    notBefore: '2024-01-22T16:00:00Z',
    notAfter: '2024-04-22T16:00:00Z',
    revision: 1,
  },
  ready: true,
};

// Stories
export const Ready = Template.bind({});
Ready.args = {
  certificate: readyCertificate,
  isCertManagerInstalled: true,
};

export const CACertificate = Template.bind({});
CACertificate.args = {
  certificate: caCertificate,
  isCertManagerInstalled: true,
};

export const Failed = Template.bind({});
Failed.args = {
  certificate: failedCertificate,
  isCertManagerInstalled: true,
};

export const WithKeystores = Template.bind({});
WithKeystores.args = {
  certificate: certificateWithKeystores,
  isCertManagerInstalled: true,
};

export const Minimal = Template.bind({});
Minimal.args = {
  certificate: minimalCertificate,
  isCertManagerInstalled: true,
};

export const NotFound = Template.bind({});
NotFound.args = {
  certificate: null,
  isCertManagerInstalled: true,
};

export const CertManagerNotInstalled = Template.bind({});
CertManagerNotInstalled.args = {
  certificate: null,
  isCertManagerInstalled: false,
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  certificate: null,
  isCertManagerInstalled: false,
  isLoading: true,
};

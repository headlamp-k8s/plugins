import { Meta, StoryFn } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Certificate } from '../../resources/certificate';
import { CertificatesOverview, CertificatesOverviewProps } from './Overview';

function mockCertificate(name: string, namespace: string, notAfter: string): Certificate {
  return new Certificate({
    apiVersion: 'cert-manager.io/v1',
    kind: 'Certificate',
    metadata: {
      name,
      namespace,
      uid: `${namespace}-${name}`,
      creationTimestamp: new Date().toISOString(),
    },
    spec: {
      secretName: `${name}-tls`,
      issuerRef: { name: 'letsencrypt', kind: 'Issuer' },
    },
    status: { conditions: [], notAfter },
  });
}

const soonCertificates = [
  mockCertificate('api-tls', 'production', new Date(Date.now() + 3 * 864e5).toISOString()),
  mockCertificate('web-tls', 'default', new Date(Date.now() + 15 * 864e5).toISOString()),
  mockCertificate('old-cert', 'staging', new Date(Date.now() - 1 * 864e5).toISOString()),
  mockCertificate('legacy-cert', 'default', new Date(Date.now() - 30 * 864e5).toISOString()),
];

const healthyCertificates = [
  mockCertificate('healthy-api', 'production', new Date(Date.now() + 60 * 864e5).toISOString()),
  mockCertificate('healthy-web', 'default', new Date(Date.now() + 90 * 864e5).toISOString()),
];

const expiredCertificates = soonCertificates.filter(
  certificate => Date.parse(certificate.status.notAfter ?? '') < Date.now()
);

export default {
  title: 'cert-manager/Certificates/Overview',
  component: CertificatesOverview,
  decorators: [
    (Story: StoryFn) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} as Meta;

const Template: StoryFn<CertificatesOverviewProps> = args => <CertificatesOverview {...args} />;

const defaultArgs: CertificatesOverviewProps = {
  certificates: soonCertificates,
  certificatesError: null,
  isManagerInstalled: true,
  isCertManagerCheckLoading: false,
};

export const WithExpiringSoon = Template.bind({});
WithExpiringSoon.args = defaultArgs;

export const AllHealthy = Template.bind({});
AllHealthy.args = { ...defaultArgs, certificates: healthyCertificates };

export const OnlyExpired = Template.bind({});
OnlyExpired.args = { ...defaultArgs, certificates: expiredCertificates };

export const Loading = Template.bind({});
Loading.args = { ...defaultArgs, certificates: null };

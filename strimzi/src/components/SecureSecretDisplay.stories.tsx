import { Meta, StoryObj } from '@storybook/react';
import { SecureSecretDisplay } from './SecureSecretDisplay';

const meta: Meta<typeof SecureSecretDisplay> = {
  title: 'strimzi/SecureSecretDisplay',
  component: SecureSecretDisplay,
  argTypes: {
    onClose: { action: 'onClose' },
  },
};
export default meta;

type Story = StoryObj<typeof SecureSecretDisplay>;

export const SecurityWarning: Story = {
  args: {
    isOpen: true,
    secretValue: 'would-be-secret',
    secretType: 'password',
    resourceName: 'default/app-producer',
    onClose: () => {},
  },
};

export const CertificateFlow: Story = {
  args: {
    isOpen: true,
    secretValue: '-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----',
    secretType: 'certificate',
    resourceName: 'kafka/tls-client',
    onClose: () => {},
  },
};

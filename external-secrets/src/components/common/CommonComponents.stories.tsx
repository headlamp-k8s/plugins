import { Meta, StoryFn } from '@storybook/react';
import { NotInstalledBanner, ReadyStatusLabel, SecretDataSection } from './CommonComponents';

export default {
  title: 'ExternalSecrets/CommonComponents',
} as Meta;

export const NotInstalled: StoryFn = () => <NotInstalledBanner />;

export const NotInstalledLoading: StoryFn = () => <NotInstalledBanner isLoading />;

export const ReadyLabel: StoryFn = () => <ReadyStatusLabel ready />;

export const NotReadyLabel: StoryFn = () => (
  <ReadyStatusLabel ready={false} reason="SecretSyncedError" />
);

export const DataMappings: StoryFn = () => (
  <SecretDataSection
    data={[
      { secretKey: 'username', remoteRef: { key: 'prod/db', property: 'user' } },
      { secretKey: 'password', remoteRef: { key: 'prod/db', property: 'pass' } },
    ]}
    dataFrom={[{ extract: { key: 'prod/db-extras' } }]}
  />
);

export const DataMappingsEmpty: StoryFn = () => <SecretDataSection />;

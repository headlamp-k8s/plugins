import { Icon } from '@iconify/react';
import {
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Typography } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ReduxDecorator } from '../../../../../helpers/storybook';
import { Container } from '../../../../../resources/knative';
import { PureContainerSectionProps, ResourceRow } from './ContainerSection';

type EnvVar = NonNullable<Container['env']>[number];

function PureContainerSection({ containers }: PureContainerSectionProps) {
  if (!containers || containers.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No containers defined.
      </Typography>
    );
  }

  return (
    <>
      {containers.map((container, idx) => {
        const resourceData: ResourceRow[] = [];
        if (container.resources?.requests) {
          resourceData.push({
            type: 'Requests',
            cpu: container.resources.requests.cpu || '-',
            memory: container.resources.requests.memory || '-',
          });
        }
        if (container.resources?.limits) {
          resourceData.push({
            type: 'Limits',
            cpu: container.resources.limits.cpu || '-',
            memory: container.resources.limits.memory || '-',
          });
        }

        const envData = container.env || [];

        return (
          <SectionBox title={`Container: ${container.name || 'user-container'}`} key={idx}>
            <NameValueTable
              rows={[
                {
                  name: 'Image',
                  value: (
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {container.image}
                    </Typography>
                  ),
                },
                {
                  name: 'Ports',
                  value:
                    container.ports
                      ?.map(p => `${p.containerPort}${p.name ? ` (${p.name})` : ''}`)
                      .join(', ') || '-',
                },
              ]}
            />

            {resourceData.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem' }}>
                  Compute Resources
                </Typography>
                <SimpleTable
                  columns={[
                    { label: 'Type', getter: (row: ResourceRow) => row.type },
                    { label: 'CPU', getter: (row: ResourceRow) => row.cpu },
                    { label: 'Memory', getter: (row: ResourceRow) => row.memory },
                  ]}
                  data={resourceData}
                />
              </Box>
            )}

            {envData.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem' }}>
                  Environment Variables
                </Typography>
                <SimpleTable
                  columns={[
                    {
                      label: 'Name',
                      getter: (env: EnvVar) => (
                        <Typography sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                          {env.name}
                        </Typography>
                      ),
                    },
                    {
                      label: 'Value',
                      getter: (env: EnvVar) => {
                        if (env.value !== undefined) {
                          return (
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {env.value}
                            </Typography>
                          );
                        }
                        if (env.valueFrom?.secretKeyRef) {
                          return (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Icon icon="mdi:lock-outline" />
                              <Typography variant="body2">
                                {env.valueFrom.secretKeyRef.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                (key: {env.valueFrom.secretKeyRef.key})
                              </Typography>
                            </Box>
                          );
                        }
                        if (env.valueFrom?.configMapKeyRef) {
                          return (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {env.valueFrom.configMapKeyRef.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                (key: {env.valueFrom.configMapKeyRef.key})
                              </Typography>
                            </Box>
                          );
                        }
                        return '-';
                      },
                    },
                  ]}
                  data={envData}
                />
              </Box>
            )}
          </SectionBox>
        );
      })}
    </>
  );
}

export default {
  title: 'knative/Revisions/Detail/ContainerSection',
  component: PureContainerSection,
  decorators: [
    ReduxDecorator,
    (Story: StoryFn) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} as Meta;

const Template: StoryFn<PureContainerSectionProps> = args => <PureContainerSection {...args} />;

const singleContainer: Container[] = [
  {
    name: 'user-container',
    image: 'gcr.io/knative-samples/helloworld-go:latest',
    ports: [{ containerPort: 8080, name: 'http1' }],
    resources: {
      requests: { cpu: '100m', memory: '128Mi' },
      limits: { cpu: '1', memory: '512Mi' },
    },
    env: [
      { name: 'TARGET', value: 'Go Sample v1' },
      { name: 'PORT', value: '8080' },
    ],
  },
];

export const SingleContainer = Template.bind({});
SingleContainer.args = {
  containers: singleContainer,
  namespace: 'default',
};

export const MultipleContainers = Template.bind({});
MultipleContainers.args = {
  containers: [
    ...singleContainer,
    {
      name: 'sidecar',
      image: 'envoyproxy/envoy:v1.28-latest',
      ports: [{ containerPort: 15001, name: 'envoy' }],
      resources: {
        requests: { cpu: '50m', memory: '64Mi' },
        limits: { cpu: '500m', memory: '256Mi' },
      },
      env: [{ name: 'LOG_LEVEL', value: 'info' }],
    },
  ],
  namespace: 'default',
};

export const WithSecretRefs = Template.bind({});
WithSecretRefs.args = {
  containers: [
    {
      name: 'app',
      image: 'myapp:v2',
      ports: [{ containerPort: 3000 }],
      env: [
        { name: 'APP_ENV', value: 'production' },
        {
          name: 'DB_PASSWORD',
          valueFrom: { secretKeyRef: { name: 'db-credentials', key: 'password' } },
        },
        {
          name: 'API_KEY',
          valueFrom: { secretKeyRef: { name: 'api-secrets', key: 'key' } },
        },
        {
          name: 'CONFIG_VALUE',
          valueFrom: { configMapKeyRef: { name: 'app-config', key: 'config.json' } },
        },
      ],
    },
  ],
  namespace: 'production',
};

export const Minimal = Template.bind({});
Minimal.args = {
  containers: [
    {
      image: 'nginx:latest',
    },
  ],
  namespace: 'default',
};

export const NoContainers = Template.bind({});
NoContainers.args = {
  containers: [],
  namespace: 'default',
};

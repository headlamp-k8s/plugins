import {
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import { NotebookStatusBadge } from '../common/NotebookStatusBadge';
import { NotebookTypeBadge } from '../common/NotebookTypeBadge';
import { TestProvider } from '../common/TestProvider';
import {
  allNotebooks,
  notebookFailed,
  notebookPending,
  notebookRunning,
  notebookTerminated,
} from './__fixtures__/mockData';

/**
 * Isolated presentational view of a single Notebook detail — mirrors
 * what NotebooksDetail.tsx renders via Headlamp's DetailsGrid but fully
 * decoupled from the cluster for Storybook.
 */
function NotebookDetailContent({ notebook }: { notebook: any }) {
  const containers: any[] = notebook?.spec?.template?.spec?.containers || [];
  const volumes: any[] = notebook?.spec?.template?.spec?.volumes || [];
  const firstContainer = containers[0] || {};
  const requests = firstContainer.resources?.requests || {};
  const limits = firstContainer.resources?.limits || {};
  const ports: any[] = firstContainer.ports || [];
  const serviceAccountName = notebook?.spec?.template?.spec?.serviceAccountName;

  return (
    <Box sx={{ padding: '24px 16px' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {notebook?.metadata?.name}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {notebook?.metadata?.namespace}
      </Typography>

      <NameValueTable
        rows={[
          {
            name: 'Status',
            value: <NotebookStatusBadge jsonData={notebook} />,
          },
          {
            name: 'Type',
            value: firstContainer.image ? <NotebookTypeBadge image={firstContainer.image} /> : '-',
          },
          { name: 'Container Image', value: firstContainer.image || '-' },
          {
            name: 'Container Port',
            value:
              ports.map((p: any) => `${p.name || 'unnamed'}:${p.containerPort}`).join(', ') || '-',
          },
          {
            name: 'Service Account',
            value: serviceAccountName || '-',
          },
          {
            name: 'CPU Request / Limit',
            value: `${requests.cpu || '-'} / ${limits.cpu || '-'}`,
          },
          {
            name: 'Memory Request / Limit',
            value: `${requests.memory || '-'} / ${limits.memory || '-'}`,
          },
          {
            name: 'GPU Limit',
            value:
              limits['nvidia.com/gpu'] || limits['amd.com/gpu']
                ? `${limits['nvidia.com/gpu'] || limits['amd.com/gpu']} GPU(s)`
                : 'None',
          },
        ]}
      />

      {containers.length > 1 && (
        <SectionBox title="Additional Containers">
          <NameValueTable
            rows={containers.slice(1).map((c: any) => ({
              name: c.name,
              value: c.image || '-',
            }))}
          />
        </SectionBox>
      )}

      {volumes.length > 0 && (
        <SectionBox title="Volumes">
          <NameValueTable
            rows={volumes.map((vol: any) => {
              let type: React.ReactNode = 'Unknown';
              if (vol.persistentVolumeClaim) {
                const claimName = vol.persistentVolumeClaim.claimName;
                type = (
                  <Box component="span">
                    PVC:{' '}
                    <HeadlampLink
                      route={`/c/${notebook?.cluster || 'main'}/persistentvolumeclaims/${
                        notebook?.metadata?.namespace
                      }/${claimName}`}
                    >
                      {claimName}
                    </HeadlampLink>
                  </Box>
                );
              } else if (vol.emptyDir !== undefined) type = 'EmptyDir';
              else if (vol.configMap) type = `ConfigMap: ${vol.configMap.name}`;
              else if (vol.secret) type = `Secret: ${vol.secret.secretName}`;
              return { name: vol.name, value: type };
            })}
          />
        </SectionBox>
      )}

      {firstContainer.env && firstContainer.env.length > 0 && (
        <SectionBox title="Environment Variables">
          <NameValueTable
            rows={firstContainer.env.map((env: any) => ({
              name: env.name,
              value: (() => {
                if (env.value !== undefined) return env.value;
                if (env.valueFrom?.secretKeyRef) {
                  return `Secret: ${env.valueFrom.secretKeyRef.name}/${env.valueFrom.secretKeyRef.key}`;
                }
                return '-';
              })(),
            }))}
          />
        </SectionBox>
      )}
    </Box>
  );
}

const meta: Meta<typeof NotebookDetailContent> = {
  title: 'Kubeflow/Notebooks/NotebookDetail',
  component: NotebookDetailContent,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Detail view for a Kubeflow Notebook showing status, type, resources, volumes, and environment variables.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NotebookDetailContent>;

export const Running: Story = {
  args: { notebook: notebookRunning },
};

export const Pending: Story = {
  args: { notebook: notebookPending },
};

export const Failed: Story = {
  args: { notebook: notebookFailed },
};

export const Terminated: Story = {
  args: { notebook: notebookTerminated },
};

/** All notebooks rendered for comparison. */
export const All: Story = {
  render: () => (
    <>
      {allNotebooks.map(nb => (
        <NotebookDetailContent key={nb.metadata.uid} notebook={nb} />
      ))}
    </>
  ),
};

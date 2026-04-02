import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Stack, Typography } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import type React from 'react';
import { ReduxDecorator } from '../../../../../../../helpers/storybook';
import { HttpRouteRow, PureHttpRoutesSectionProps } from './HttpRoutesSection';

function SimpleTable({
  columns,
  data,
}: {
  columns: { label: string; render: (row: HttpRouteRow) => React.ReactNode }[];
  data: HttpRouteRow[];
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {columns.map(col => (
            <th
              key={col.label}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                borderBottom: '2px solid #e0e0e0',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              style={{ textAlign: 'center', padding: '16px', color: '#999' }}
            >
              No items
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.label} style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function PureHttpRoutesSection({ title, routes = [] }: PureHttpRoutesSectionProps) {
  const columns = [
    {
      label: 'Name',
      render: (row: HttpRouteRow) => <Typography variant="body2">{row.name}</Typography>,
    },
    {
      label: 'Role',
      render: (row: HttpRouteRow) => {
        if (!row.isMain && row.tags.length === 0 && !row.rolloutInvalidJson) {
          return (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          );
        }
        return (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {row.isMain && <Chip label="main" size="small" color="primary" />}
            {row.tags.map(t => (
              <Chip key={t} label={`tag: ${t}`} size="small" color="default" />
            ))}
            {row.rolloutInvalidJson && (
              <Chip label="rollout: invalid" size="small" color="warning" />
            )}
          </Stack>
        );
      },
    },
    {
      label: 'Origin',
      render: (row: HttpRouteRow) =>
        row.origins.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        ) : (
          <Stack direction="row" spacing={0.5}>
            {row.origins.map(o => (
              <Chip
                key={o}
                label={o}
                size="small"
                color={o === 'DomainMapping' ? 'info' : 'default'}
              />
            ))}
          </Stack>
        ),
    },
    {
      label: 'Hostnames',
      render: (row: HttpRouteRow) =>
        row.hostnames.length > 0 ? (
          <Typography variant="caption" color="text.secondary">
            {row.hostnames.join(', ')}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        ),
    },
    {
      label: 'Age',
      render: (row: HttpRouteRow) => <Typography variant="body2">{row.age}</Typography>,
    },
  ];

  return (
    <SectionBox title={title}>
      <SimpleTable columns={columns} data={routes} />
    </SectionBox>
  );
}

export default {
  title: 'knative/Networking/HttpRoutesSection',
  component: PureHttpRoutesSection,
  decorators: [ReduxDecorator],
  tags: [],
} as Meta;

const Template: StoryFn<PureHttpRoutesSectionProps> = args => <PureHttpRoutesSection {...args} />;

export const ExternalRoutes = Template.bind({});
ExternalRoutes.args = {
  title: 'HTTPRoutes (external)',
  routes: [
    {
      name: 'hello-world.default.svc.cluster.local',
      isMain: true,
      tags: [],
      origins: ['KService'],
      hostnames: ['hello-world.default.example.com'],
      age: '5d',
    },
    {
      name: 'canary-hello-world.default.svc.cluster.local',
      isMain: false,
      tags: ['canary'],
      origins: ['KService'],
      hostnames: ['canary-hello-world.default.example.com'],
      age: '2d',
    },
    {
      name: 'app.example.com',
      isMain: false,
      tags: [],
      origins: ['DomainMapping'],
      hostnames: ['app.example.com'],
      age: '10d',
    },
  ],
};

export const InternalRoutes = Template.bind({});
InternalRoutes.args = {
  title: 'HTTPRoutes (internal)',
  routes: [
    {
      name: 'hello-world.default.svc.cluster.local',
      isMain: true,
      tags: [],
      origins: ['KService'],
      hostnames: ['hello-world.default.svc.cluster.local'],
      age: '5d',
    },
  ],
};

export const EmptyRoutes = Template.bind({});
EmptyRoutes.args = {
  title: 'HTTPRoutes (external)',
  routes: [],
};

export const WithInvalidRollout = Template.bind({});
WithInvalidRollout.args = {
  title: 'HTTPRoutes (external)',
  routes: [
    {
      name: 'hello-world.default.svc.cluster.local',
      isMain: true,
      tags: [],
      origins: ['KService'],
      hostnames: ['hello-world.default.example.com'],
      rolloutInvalidJson: true,
      age: '3d',
    },
  ],
};

export const MultipleTags = Template.bind({});
MultipleTags.args = {
  title: 'HTTPRoutes (external)',
  routes: [
    {
      name: 'hello-world.default.svc.cluster.local',
      isMain: true,
      tags: ['v1', 'stable'],
      origins: ['KService'],
      hostnames: ['hello-world.default.example.com'],
      age: '7d',
    },
    {
      name: 'canary-hello-world.default.svc.cluster.local',
      isMain: false,
      tags: ['canary'],
      origins: ['KService'],
      hostnames: ['canary-hello-world.default.example.com'],
      age: '1d',
    },
  ],
};

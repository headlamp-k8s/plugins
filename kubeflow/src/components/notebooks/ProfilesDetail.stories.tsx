import {
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ProfileStatusBadge } from '../common/ProfileStatusBadge';
import {
  allProfiles,
  profileNoConditions,
  profileNotReady,
  profileReady,
} from './__fixtures__/mockData';

/**
 * Isolated presentational view of a single Profile detail — mirrors
 * what ProfilesDetail.tsx renders via Headlamp's DetailsGrid but is
 * fully decoupled from the cluster for Storybook.
 */
function ProfileDetailContent({ profile }: { profile: any }) {
  const spec = profile?.spec || {};
  const owner = spec.owner || {};
  const hard = spec.resourceQuotaSpec?.hard || {};
  const plugins = spec.plugins || [];
  const conditions = profile?.status?.conditions || [];

  return (
    <Box sx={{ padding: '24px 16px' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        {profile?.metadata?.name}
      </Typography>

      <NameValueTable
        rows={[
          { name: 'Owner Kind', value: owner.kind || '-' },
          { name: 'Owner Name', value: owner.name || '-' },
          {
            name: 'Status',
            value: <ProfileStatusBadge jsonData={profile} />,
          },
        ]}
      />

      {Object.keys(hard).length > 0 && (
        <SectionBox title="Resource Quota">
          <NameValueTable
            rows={Object.entries(hard).map(([key, value]) => ({
              name: key,
              value: String(value),
            }))}
          />
        </SectionBox>
      )}

      {plugins.length > 0 && (
        <SectionBox title="Plugins">
          <NameValueTable
            rows={plugins.map((plugin: any, index: number) => ({
              name: `Plugin ${index + 1} (${plugin.kind || 'Unknown'})`,
              value: (
                <Box
                  sx={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#f5f5f5',
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  {JSON.stringify(plugin.spec || {}, null, 2)}
                </Box>
              ),
            }))}
          />
        </SectionBox>
      )}

      {conditions.length > 0 && (
        <SectionBox title="Conditions">
          <NameValueTable
            rows={conditions.map((cond: any) => ({
              name: cond.type,
              value: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatusLabel
                    status={
                      cond.status === 'True'
                        ? 'success'
                        : cond.type === 'Failed' || cond.type?.includes('Error')
                        ? 'error'
                        : ''
                    }
                  >
                    {cond.status}
                  </StatusLabel>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {cond.reason ? `${cond.reason} — ` : ''}
                    {cond.message || ''}
                  </Typography>
                </Box>
              ),
            }))}
          />
        </SectionBox>
      )}
    </Box>
  );
}

const meta: Meta<typeof ProfileDetailContent> = {
  title: 'Kubeflow/Profiles/ProfileDetail',
  component: ProfileDetailContent,
  parameters: {
    docs: {
      description: {
        component:
          'Detail view for a Kubeflow Profile showing owner, resource quota, plugins, and status conditions.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ProfileDetailContent>;

/** Ready profile with resource quota, GPU allocation, and a WorkloadIdentity plugin. */
export const Ready: Story = {
  args: { profile: profileReady },
};

/** Not-ready profile with a failure reason in the Ready condition. */
export const NotReady: Story = {
  args: { profile: profileNotReady },
};

/** Profile with no conditions (defaults to "Active" status). */
export const NoConditions: Story = {
  args: { profile: profileNoConditions },
};

/** All profiles rendered side by side for a quick comparison. */
export const All: Story = {
  render: () => (
    <>
      {allProfiles.map(profile => (
        <ProfileDetailContent key={profile.metadata.uid} profile={profile} />
      ))}
    </>
  ),
};

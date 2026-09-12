import type { Meta, StoryObj } from '@storybook/react';
import { TopologyControlledAction, TopologyHeaderAction } from './util';

const meta = {
  title: 'Common/TopologyHeaderAction',
  component: TopologyHeaderAction,
  parameters: {
    layout: 'centered',
  },
  args: {
    item: {
      kind: 'MachineDeployment',
      jsonData: {
        metadata: {
          labels: {
            'topology.cluster.x-k8s.io/owned': '',
          },
        },
      },
    },
  },
} satisfies Meta<typeof TopologyHeaderAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopologyControlledMachineDeployment: Story = {};

export const TopologyControlledControlPlane: Story = {
  args: {
    item: {
      kind: 'KubeadmControlPlane',
      jsonData: {
        metadata: {
          labels: {
            'topology.cluster.x-k8s.io/owned': 'true',
          },
        },
      },
    },
  },
};

export const UnsupportedKindDoesNotRender: Story = {
  args: {
    item: {
      kind: 'Cluster',
      jsonData: {
        metadata: {
          labels: {
            'topology.cluster.x-k8s.io/owned': 'true',
          },
        },
      },
    },
  },
};

export const MissingTopologyLabelDoesNotRender: Story = {
  args: {
    item: {
      kind: 'MachinePool',
      jsonData: {
        metadata: {
          labels: {},
        },
      },
    },
  },
};

export const BadgeOnDarkBackground: StoryObj<typeof TopologyControlledAction> = {
  render: () => <TopologyControlledAction />,
  decorators: [
    Story => (
      <div style={{ background: '#111', padding: 20, display: 'inline-block' }}>
        <Story />
      </div>
    ),
  ],
};

import { Meta, Story } from '@storybook/react/types-6-0';
import { OpencostDetailSectionPure } from './detail';

export default {
  title: 'OpencostDetails',
  component: OpencostDetailSectionPure,
} as Meta;

const Template: Story = args => <OpencostDetailSectionPure {...args} />;

export const LoadingState = Template.bind({});
LoadingState.args = {
  installed: true,
  displayTimespan: '24h',
  tsData: null,
  displayCurrency: '$',
  accumulatedData: null,
  learnMoreLink: 'http://localhost:3000/docs',
  handleDisplayTimespanChange: timespan => {
    console.log(timespan);
  },
};

export const NotInstalled = Template.bind({});
NotInstalled.args = {
  installed: false,
  displayTimespan: '24h',
  tsData: null,
  displayCurrency: '$',
  accumulatedData: null,
  learnMoreLink: 'http://localhost:3000/docs',
  handleDisplayTimespanChange: timespan => {
    console.log(timespan);
  },
};

export const NoData = Template.bind({});
NoData.args = {
  installed: true,
  displayTimespan: '24h',
  tsData: {},
  displayCurrency: '$',
  accumulatedData: {},
  learnMoreLink: 'http://localhost:3000/docs',
  handleDisplayTimespanChange: timespan => {
    console.log(timespan);
  },
};

const accumulatedDataWeek = {
  name: 'pod-name',
  properties: {
    cluster: 'default-cluster',
    node: 'node-name',
    namespace: 'kube-system',
    pod: 'pod-name',
  },
  window: { start: '2024-04-28T00:00:00Z', end: '2024-05-02T00:00:00Z' },
  start: '2024-04-28T00:00:00Z',
  end: '2024-05-01T15:45:00Z',
  minutes: 5265,
  cpuCores: 0.25,
  cpuCoreRequestAverage: 0.25,
  cpuCoreUsageAverage: 0.00811,
  cpuCoreHours: 21.9375,
  cpuCost: 0.85556,
  cpuCostAdjustment: 0,
  cpuEfficiency: 0.03242,
  gpuCount: 0,
  gpuHours: 0,
  gpuCost: 0,
  gpuCostAdjustment: 0,
  networkTransferBytes: 992643327.41557,
  networkReceiveBytes: 1817414461.05938,
  networkCost: 0,
  networkCrossZoneCost: 0,
  networkCrossRegionCost: 0,
  networkInternetCost: 0,
  networkCostAdjustment: 0,
  loadBalancerCost: 0,
  loadBalancerCostAdjustment: 0,
  pvBytes: 0,
  pvByteHours: 0,
  pvCost: 0,
  pvs: null,
  pvCostAdjustment: 0,
  ramBytes: 367001600,
  ramByteRequestAverage: 367001600,
  ramByteUsageAverage: 537410597.1611,
  ramByteHours: 32204390400,
  ramCost: 0.0575,
  ramCostAdjustment: 0,
  ramEfficiency: 1.46433,
  externalCost: 0,
  sharedCost: 0,
  totalCost: 0.91306,
  totalEfficiency: 0.12259,
  proportionalAssetResourceCosts: {},
  lbAllocations: null,
  sharedCostBreakdown: {},
};
const tsDataWeek = [
  { date: '2024-04-28T15:44:04.180Z', cpuCost: 0.234, ramCost: 0.01573, pvCost: 0, gpuCost: 0 },
  { date: '2024-04-29T15:44:04.180Z', cpuCost: 0.234, ramCost: 0.01573, pvCost: 0, gpuCost: 0 },
  { date: '2024-04-30T15:44:04.180Z', cpuCost: 0.234, ramCost: 0.01573, pvCost: 0, gpuCost: 0 },
  { date: '2024-05-01T15:44:04.180Z', cpuCost: 0.15356, ramCost: 0.01032, pvCost: 0, gpuCost: 0 },
];

export const WeekData = Template.bind({});
WeekData.args = {
  installed: true,
  displayTimespan: '24h',
  tsData: tsDataWeek,
  displayCurrency: '$',
  accumulatedData: accumulatedDataWeek,
  learnMoreLink: 'http://localhost:3000/docs',
  handleDisplayTimespanChange: timespan => {
    console.log(timespan);
  },
};

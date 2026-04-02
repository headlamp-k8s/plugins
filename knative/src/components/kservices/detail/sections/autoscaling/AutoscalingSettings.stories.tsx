/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { ReduxDecorator } from '../../../../../helpers/storybook';
import { MetricType, PureAutoscalingSettingsProps } from './AutoscalingSettings';

const renderReadonly = (value: string, fallbackInfo?: string) => (
  <Typography variant="body2">
    {value !== '' ? (
      value
    ) : (
      <Typography component="span" color="text.secondary">
        Not set {fallbackInfo ? `(${fallbackInfo})` : ''}
      </Typography>
    )}
  </Typography>
);

function PureAutoscalingSettings({
  metric = '',
  target = '',
  util = '',
  hard = '',
  isReadOnly = true,
  defaults,
}: PureAutoscalingSettingsProps) {
  const [metricState, setMetric] = React.useState<MetricType>(metric);
  const [targetState, setTarget] = React.useState(target);
  const [utilState, setUtil] = React.useState(util);
  const [hardState, setHard] = React.useState(hard);

  const effectiveMetric = metricState || 'concurrency';
  const resolvedDefaultTarget =
    effectiveMetric === 'rps' ? defaults?.rpsTarget : defaults?.concurrencyTarget;
  const resolvedDefaultUtil = defaults?.targetUtilizationPercentage;
  const resolvedDefaultHard = defaults?.containerConcurrency;

  const rows = React.useMemo(
    () => [
      {
        name: 'Metric',
        value: isReadOnly ? (
          <Typography variant="body2">
            {metricState === 'concurrency' ? (
              'Concurrency'
            ) : metricState === 'rps' ? (
              'RPS'
            ) : (
              <Typography component="span" color="text.secondary">
                Unset (cluster default)
              </Typography>
            )}
          </Typography>
        ) : (
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="metric-label">Metric</InputLabel>
            <Select
              size="small"
              labelId="metric-label"
              label="Metric"
              value={metricState}
              onChange={e => setMetric(e.target.value as MetricType)}
            >
              <MenuItem value="">
                <em>Unset (use cluster default)</em>
              </MenuItem>
              <MenuItem value="concurrency">Concurrency</MenuItem>
              <MenuItem value="rps">RPS</MenuItem>
            </Select>
          </FormControl>
        ),
      },
      {
        name: effectiveMetric === 'rps' ? 'RPS Target' : 'Concurrency Target',
        value: isReadOnly ? (
          renderReadonly(
            targetState,
            resolvedDefaultTarget !== undefined ? `Default: ${resolvedDefaultTarget}` : undefined
          )
        ) : (
          <TextField
            size="small"
            type="number"
            value={targetState}
            onChange={e => setTarget(e.target.value)}
            inputProps={{ min: 1, step: 1 }}
            disabled={!metricState}
            sx={{ maxWidth: 400 }}
          />
        ),
      },
      {
        name: 'Target Utilization %',
        value: isReadOnly ? (
          renderReadonly(
            utilState,
            resolvedDefaultUtil !== undefined ? `Default: ${resolvedDefaultUtil}%` : undefined
          )
        ) : (
          <TextField
            size="small"
            type="number"
            value={utilState}
            onChange={e => setUtil(e.target.value)}
            inputProps={{ min: 1, max: 100, step: 1 }}
            sx={{ maxWidth: 400 }}
          />
        ),
      },
      {
        name: 'Hard limit (container concurrency)',
        value: isReadOnly ? (
          renderReadonly(
            hardState,
            resolvedDefaultHard !== undefined ? `Default: ${resolvedDefaultHard}` : undefined
          )
        ) : (
          <TextField
            size="small"
            type="number"
            value={hardState}
            onChange={e => setHard(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
            sx={{ maxWidth: 400 }}
          />
        ),
      },
    ],
    [
      isReadOnly,
      metricState,
      effectiveMetric,
      targetState,
      resolvedDefaultTarget,
      utilState,
      resolvedDefaultUtil,
      hardState,
      resolvedDefaultHard,
    ]
  );

  return (
    <SectionBox title="Autoscaling metrics & concurrency">
      <Stack spacing={2}>
        <NameValueTable rows={rows} />
      </Stack>
    </SectionBox>
  );
}

export default {
  title: 'knative/KService/Detail/AutoscalingSettings',
  decorators: [ReduxDecorator],
  tags: [],
  parameters: {
    docs: { disable: true },
  },
} as Meta;

const Template: StoryFn<PureAutoscalingSettingsProps> = args => (
  <PureAutoscalingSettings {...args} />
);

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  metric: 'concurrency',
  target: '100',
  util: '70',
  hard: '0',
  isReadOnly: true,
  defaults: {
    concurrencyTarget: 100,
    rpsTarget: 200,
    targetUtilizationPercentage: 70,
    containerConcurrency: 0,
  },
};

export const ReadOnlyRPS = Template.bind({});
ReadOnlyRPS.args = {
  metric: 'rps',
  target: '200',
  util: '',
  hard: '',
  isReadOnly: true,
  defaults: {
    concurrencyTarget: 100,
    rpsTarget: 200,
    targetUtilizationPercentage: 70,
    containerConcurrency: 0,
  },
};

export const ReadOnlyUnset = Template.bind({});
ReadOnlyUnset.args = {
  metric: '',
  target: '',
  util: '',
  hard: '',
  isReadOnly: true,
  defaults: {
    concurrencyTarget: 100,
    rpsTarget: 200,
    targetUtilizationPercentage: 70,
    containerConcurrency: 0,
  },
};

export const EditMode = Template.bind({});
EditMode.args = {
  metric: 'concurrency',
  target: '50',
  util: '80',
  hard: '10',
  isReadOnly: false,
  defaults: {
    concurrencyTarget: 100,
    rpsTarget: 200,
    targetUtilizationPercentage: 70,
    containerConcurrency: 0,
  },
};

export const EditModeEmpty = Template.bind({});
EditModeEmpty.args = {
  metric: '',
  target: '',
  util: '',
  hard: '',
  isReadOnly: false,
  defaults: {
    concurrencyTarget: 100,
    rpsTarget: 200,
    targetUtilizationPercentage: 70,
    containerConcurrency: 0,
  },
};

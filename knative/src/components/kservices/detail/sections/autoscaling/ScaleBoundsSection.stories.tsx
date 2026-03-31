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
import { Stack, TextField, Typography } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { ReduxDecorator } from '../../../../../helpers/storybook';
import { PureScaleBoundsSectionProps } from './ScaleBoundsSection';

function PureScaleBoundsSection({
  minScale: minScaleInit,
  maxScale: maxScaleInit,
  initialScale: initialScaleInit,
  activationScale: activationScaleInit,
  stableWindow: stableWindowInit,
  scaleDownDelay: scaleDownDelayInit,
  isReadOnly,
  defaults,
}: PureScaleBoundsSectionProps) {
  const [minScale, setMinScale] = React.useState(minScaleInit);
  const [maxScale, setMaxScale] = React.useState(maxScaleInit);
  const [initialScale, setInitialScale] = React.useState(initialScaleInit);
  const [activationScale, setActivationScale] = React.useState(activationScaleInit);
  const [stableWindow, setStableWindow] = React.useState(stableWindowInit);
  const [scaleDownDelay, setScaleDownDelay] = React.useState(scaleDownDelayInit);

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

  return (
    <SectionBox title="Scale bounds & windows">
      <Stack spacing={2}>
        <NameValueTable
          rows={[
            {
              name: 'Min replicas (min-scale)',
              value: isReadOnly ? (
                renderReadonly(
                  minScale,
                  defaults?.minScale !== undefined ? `Default: ${defaults.minScale}` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={minScale}
                  onChange={e => setMinScale(e.target.value)}
                  inputProps={{ min: 0, step: 1 }}
                  helperText={
                    defaults?.minScale !== undefined ? `Default: ${defaults.minScale}` : undefined
                  }
                  sx={{ maxWidth: 400 }}
                />
              ),
            },
            {
              name: 'Max replicas (max-scale)',
              value: isReadOnly ? (
                renderReadonly(
                  maxScale,
                  defaults?.maxScale !== undefined ? `Default: ${defaults.maxScale}` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={maxScale}
                  onChange={e => setMaxScale(e.target.value)}
                  inputProps={{ min: 0, step: 1 }}
                  helperText={
                    defaults?.maxScale !== undefined ? `Default: ${defaults.maxScale}` : undefined
                  }
                />
              ),
            },
            {
              name: 'Initial scale',
              value: isReadOnly ? (
                renderReadonly(
                  initialScale,
                  defaults?.initialScale !== undefined
                    ? `Default: ${defaults.initialScale}`
                    : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={initialScale}
                  onChange={e => setInitialScale(e.target.value)}
                  inputProps={{ min: 0, step: 1 }}
                  helperText={
                    defaults?.initialScale !== undefined
                      ? defaults.allowZeroInitialScale
                        ? `Default: ${defaults.initialScale} (zero allowed)`
                        : `Default: ${defaults.initialScale}`
                      : undefined
                  }
                />
              ),
            },
            {
              name: 'Activation scale',
              value: isReadOnly ? (
                renderReadonly(
                  activationScale,
                  defaults?.activationScaleDefault !== undefined
                    ? `Default: ${defaults.activationScaleDefault}`
                    : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={activationScale}
                  onChange={e => setActivationScale(e.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                  helperText={
                    defaults?.activationScaleDefault !== undefined
                      ? `Default: ${defaults.activationScaleDefault}`
                      : undefined
                  }
                />
              ),
            },
            {
              name: 'Stable window',
              value: isReadOnly ? (
                renderReadonly(
                  stableWindow,
                  defaults?.stableWindow ? `Default: ${defaults.stableWindow}` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  placeholder="e.g., 60s"
                  value={stableWindow}
                  onChange={e => setStableWindow(e.target.value)}
                  helperText={`Default: ${defaults?.stableWindow ?? '60s'} (6s to 1h)`}
                />
              ),
            },
            {
              name: 'Scale down delay',
              value: isReadOnly ? (
                renderReadonly(
                  scaleDownDelay,
                  defaults?.scaleDownDelay ? `Default: ${defaults.scaleDownDelay}` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  placeholder="e.g., 15m"
                  value={scaleDownDelay}
                  onChange={e => setScaleDownDelay(e.target.value)}
                  helperText={`Default: ${defaults?.scaleDownDelay ?? '0s'} (0s to 1h)`}
                />
              ),
            },
          ]}
        />
      </Stack>
    </SectionBox>
  );
}

export default {
  title: 'knative/KService/Detail/ScaleBoundsSection',
  component: PureScaleBoundsSection,
  decorators: [ReduxDecorator],
  tags: [],
  parameters: {
    docs: { disable: true },
  },
} as Meta;

const Template: StoryFn<PureScaleBoundsSectionProps> = args => <PureScaleBoundsSection {...args} />;

const clusterDefaults = {
  minScale: 0,
  maxScale: 0,
  initialScale: 1,
  allowZeroInitialScale: false,
  stableWindow: '60s',
  scaleDownDelay: '0s',
  activationScaleDefault: 1,
};

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  minScale: '1',
  maxScale: '10',
  initialScale: '1',
  activationScale: '1',
  stableWindow: '60s',
  scaleDownDelay: '0s',
  isReadOnly: true,
  defaults: clusterDefaults,
};

export const ReadOnlyUnset = Template.bind({});
ReadOnlyUnset.args = {
  minScale: '',
  maxScale: '',
  initialScale: '',
  activationScale: '',
  stableWindow: '',
  scaleDownDelay: '',
  isReadOnly: true,
  defaults: clusterDefaults,
};

export const EditMode = Template.bind({});
EditMode.args = {
  minScale: '2',
  maxScale: '20',
  initialScale: '3',
  activationScale: '1',
  stableWindow: '120s',
  scaleDownDelay: '30s',
  isReadOnly: false,
  defaults: clusterDefaults,
};

export const EditModeEmpty = Template.bind({});
EditModeEmpty.args = {
  minScale: '',
  maxScale: '',
  initialScale: '',
  activationScale: '',
  stableWindow: '',
  scaleDownDelay: '',
  isReadOnly: false,
  defaults: clusterDefaults,
};

export const WithMaxScaleLimit = Template.bind({});
WithMaxScaleLimit.args = {
  minScale: '1',
  maxScale: '50',
  initialScale: '1',
  activationScale: '1',
  stableWindow: '60s',
  scaleDownDelay: '0s',
  isReadOnly: true,
  defaults: { ...clusterDefaults, maxScaleLimit: 100 },
};

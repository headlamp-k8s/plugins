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

import { Meta, StoryFn } from '@storybook/react';
import type React from 'react';
import { ReduxDecorator } from '../../helpers/storybook';
import type { Condition } from '../../resources/knative/common';
import ConditionsSection from './ConditionsSection';

export default {
  title: 'knative/Common/ConditionsSection',
  component: ConditionsSection,
  decorators: [ReduxDecorator],
} as Meta;

type ConditionsSectionProps = React.ComponentProps<typeof ConditionsSection>;

const Template: StoryFn<ConditionsSectionProps> = args => <ConditionsSection {...args} />;

const allReadyConditions: Condition[] = [
  {
    type: 'Ready',
    status: 'True',
    reason: 'Ready',
    message: 'Service is ready',
    lastTransitionTime: '2025-03-20T10:00:00Z',
  },
  {
    type: 'ConfigurationsReady',
    status: 'True',
    reason: 'LatestCreated',
    message: 'Configuration is ready',
    lastTransitionTime: '2025-03-20T09:55:00Z',
  },
  {
    type: 'RoutesReady',
    status: 'True',
    reason: 'Ready',
    message: 'Route is ready',
    lastTransitionTime: '2025-03-20T09:56:00Z',
  },
];

const mixedConditions: Condition[] = [
  {
    type: 'Ready',
    status: 'False',
    reason: 'RevisionFailed',
    message: 'Revision "hello-00003" failed with message: Initial scale was never achieved.',
    lastTransitionTime: '2025-03-20T12:30:00Z',
  },
  {
    type: 'ConfigurationsReady',
    status: 'False',
    reason: 'RevisionFailed',
    message: 'Revision "hello-00003" failed with message: Initial scale was never achieved.',
    lastTransitionTime: '2025-03-20T12:30:00Z',
  },
  {
    type: 'RoutesReady',
    status: 'True',
    reason: 'Ready',
    lastTransitionTime: '2025-03-20T10:00:00Z',
  },
];

export const AllReady = Template.bind({});
AllReady.args = {
  conditions: allReadyConditions,
};

export const MixedConditions = Template.bind({});
MixedConditions.args = {
  conditions: mixedConditions,
};

export const SingleCondition = Template.bind({});
SingleCondition.args = {
  conditions: [allReadyConditions[0]],
};

export const Empty = Template.bind({});
Empty.args = {
  conditions: [],
};

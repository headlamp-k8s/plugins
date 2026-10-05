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

import type { Meta, StoryObj } from '@storybook/react';
import { evaluateGatewayReadiness, evaluateServiceReadiness } from '../../config/gatewayReadiness';
import { ReduxDecorator } from '../../helpers/storybook';
import { GatewayReadinessDetails } from './GatewayReadiness';

const meta = {
  title: 'knative/Networking/GatewayReadiness',
  component: GatewayReadinessDetails,
  decorators: [ReduxDecorator],
} satisfies Meta<typeof GatewayReadinessDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PendingLoadBalancer: Story = {
  args: {
    gatewayReadiness: evaluateGatewayReadiness({
      conditions: [
        { type: 'Accepted', status: 'True' },
        {
          type: 'Programmed',
          status: 'False',
          reason: 'AddressNotAssigned',
          message: 'No addresses have been assigned to the Gateway',
        },
      ],
    }),
    serviceReadiness: evaluateServiceReadiness({
      spec: {
        type: 'LoadBalancer',
        ports: [
          { port: 80, nodePort: 30080, protocol: 'TCP' },
          { port: 443, nodePort: 30443, protocol: 'TCP' },
        ],
      },
      status: { loadBalancer: {} },
    }),
  },
};

export const ReadyNodePort: Story = {
  args: {
    gatewayReadiness: evaluateGatewayReadiness({
      conditions: [
        { type: 'Accepted', status: 'True' },
        { type: 'Programmed', status: 'True' },
      ],
    }),
    serviceReadiness: evaluateServiceReadiness({
      spec: {
        type: 'NodePort',
        ports: [
          { port: 80, nodePort: 30080, protocol: 'TCP' },
          { port: 443, nodePort: 30443, protocol: 'TCP' },
        ],
      },
    }),
  },
};

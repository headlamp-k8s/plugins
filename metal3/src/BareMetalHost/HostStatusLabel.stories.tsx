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
import { HostStatusLabel } from './HostStatusLabel';

// Minimal jsonData shape the component reads from a host.
function host(status: Record<string, unknown>) {
  return { jsonData: { status } } as any;
}

const meta: Meta<typeof HostStatusLabel> = {
  title: 'Metal3/HostStatusLabel',
  component: HostStatusLabel,
};
export default meta;

type Story = StoryObj<typeof HostStatusLabel>;

// Healthy host: OK headline with the lifecycle stage beneath, no error badge.
export const Healthy: Story = {
  args: { host: host({ operationalStatus: 'OK', provisioning: { state: 'available' } }) },
};

// The defining case: provisioned (fully deployed) yet operationally in error,
// so both signals are shown at once.
export const ProvisionedAndErrored: Story = {
  args: {
    host: host({
      operationalStatus: 'error',
      provisioning: { state: 'provisioned' },
      errorType: 'provisioned registration error',
      errorMessage: 'Failed to reach BMC: connection timed out',
    }),
  },
};

// A transient lifecycle stage while the host is healthy.
export const Inspecting: Story = {
  args: { host: host({ operationalStatus: 'OK', provisioning: { state: 'inspecting' } }) },
};

// Unknown/future operational value: renders with a neutral severity and never breaks.
export const UnknownStatus: Story = {
  args: {
    host: host({ operationalStatus: 'some-future-state', provisioning: { state: 'registering' } }),
  },
};

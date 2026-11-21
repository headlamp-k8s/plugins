/*
 * Copyright 2026 The Kubernetes Authors
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

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KnativeTrigger } from '../../resources/knative';
import { triggerFormSections } from './CreateTriggerForm';
import { TriggersList } from './List';

const state = vi.hoisted(() => ({
  installed: true,
  createButtons: [] as { resourceClass: unknown; sections: unknown }[],
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ResourceListView: ({
    title,
    headerProps,
  }: {
    title: string;
    headerProps?: { titleSideActions?: React.ReactNode[] };
  }) => (
    <div>
      <h1>{title}</h1>
      {headerProps?.titleSideActions}
    </div>
  ),
}));

vi.mock('../../hooks/useClusters', () => ({ useClusters: () => ['cluster-a'] }));

vi.mock('../../hooks/useKnativeInstalled', () => ({
  useKnativeInstalled: () => ({
    isKnativeInstalled: state.installed,
    isKnativeCheckLoading: false,
  }),
}));

vi.mock('../../resources/knative', () => ({ KnativeTrigger: class {} }));

vi.mock('./CreateTriggerForm', () => ({ triggerFormSections: () => [] }));

vi.mock('./BrokerLink', () => ({ BrokerLink: () => null }));

vi.mock('../common/CreateFormButton', () => ({
  CreateFormButton: (props: { resourceClass: unknown; sections: unknown }) => {
    state.createButtons.push(props);
    return <button>Create Trigger</button>;
  },
}));

vi.mock('../common/DestinationLink', () => ({ destinationColumn: () => ({ id: 'subscriber' }) }));

vi.mock('../common/NotInstalledBanner', () => ({
  NotInstalledBanner: () => <div>Knative Eventing is not installed</div>,
}));

vi.mock('../common/ResourceListCells', () => ({ getReadinessColumns: () => [] }));

beforeEach(() => {
  state.installed = true;
  state.createButtons = [];
});

describe('TriggersList', () => {
  it('offers to create a Trigger with the Trigger form', () => {
    render(
      <React.StrictMode>
        <TriggersList />
      </React.StrictMode>
    );
    expect(screen.queryByRole('button', { name: 'Create Trigger' })).not.toBeNull();
    expect(state.createButtons[0]).toEqual({
      resourceClass: KnativeTrigger,
      sections: triggerFormSections,
    });
  });

  it('offers nothing to create while Eventing is not installed', () => {
    state.installed = false;
    render(<TriggersList />);
    expect(screen.queryByText('Knative Eventing is not installed')).not.toBeNull();
    expect(state.createButtons).toEqual([]);
  });
});

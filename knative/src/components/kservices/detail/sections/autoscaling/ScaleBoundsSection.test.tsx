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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import type { KService } from '../../../../../resources/knative';
import ScaleBoundsSection from './ScaleBoundsSection';

const mocks = vi.hoisted(() => ({
  patch: vi.fn(),
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  NameValueTable: ({ rows }: { rows: Array<{ value: ReactNode }> }) => (
    <div>
      {rows.map((row, index) => (
        <div key={index}>{row.value}</div>
      ))}
    </div>
  ),
}));

vi.mock('../../../../common/notifications/useNotify', () => ({
  useNotify: () => ({ notifySuccess: mocks.notifySuccess, notifyError: mocks.notifyError }),
}));

vi.mock('../../hooks/useKServiceEditMode', () => ({
  useKServiceEditMode: () => ({ isEditMode: true, setIsEditMode: vi.fn() }),
}));

vi.mock('../../permissions/KServicePermissionsProvider', () => ({
  useKServicePermissions: () => ({ canPatchKService: true, isLoading: false }),
}));

vi.mock('../../../../../resources/knative', async () => {
  const helpers = await vi.importActual<
    typeof import('../../../../../resources/knative/autoscalingPatch')
  >('../../../../../resources/knative/autoscalingPatch');

  return {
    KService: { buildAutoscalingPatch: helpers.buildAutoscalingPatch },
    annNumOrClear: helpers.annNumOrClear,
    annStrOrClear: helpers.annStrOrClear,
  };
});

/**
 * Builds a Knative Service whose revision template has the given annotations.
 *
 * @param annotations - The template annotations.
 * @returns The Knative Service, with a mocked `patch`.
 */
function makeKservice(annotations: Record<string, string>): KService {
  const kservice = {
    spec: {
      template: {
        metadata: { annotations },
        spec: {
          containers: [
            { image: 'gcr.io/knative-samples/helloworld-go', ports: [{ containerPort: 8080 }] },
          ],
        },
      },
    },
    patch: mocks.patch,
  } satisfies Pick<KService, 'spec' | 'patch'>;

  return kservice as unknown as KService;
}

/**
 * Renders the section for a Knative Service with the given template annotations.
 *
 * @param annotations - The template annotations.
 * @returns The Save button.
 */
function renderSection(annotations: Record<string, string>) {
  render(
    <ScaleBoundsSection cluster="cluster-a" kservice={makeKservice(annotations)} defaults={null} />
  );
  return screen.getByRole('button', {
    name: 'Save autoscaling (scale bounds)',
  }) as HTMLButtonElement;
}

/**
 * Reads the annotations from the one patch the section sent.
 *
 * @returns The annotations in the patch.
 */
function savedAnnotations(): Record<string, string | null> {
  expect(mocks.patch).toHaveBeenCalledTimes(1);
  return mocks.patch.mock.calls[0][0].spec.template.metadata.annotations;
}

beforeEach(() => {
  mocks.patch.mockReset();
  mocks.patch.mockResolvedValue(undefined);
  mocks.notifySuccess.mockReset();
  mocks.notifyError.mockReset();
});

describe('ScaleBoundsSection clearing', () => {
  it('sends null for the bounds that are cleared and keeps the others', async () => {
    const saveButton = renderSection({
      'autoscaling.knative.dev/min-scale': '1',
      'autoscaling.knative.dev/max-scale': '5',
      'autoscaling.knative.dev/window': '60s',
    });

    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('60s'), { target: { value: '' } });

    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    const annotations = savedAnnotations();
    expect(annotations['autoscaling.knative.dev/min-scale']).toBeNull();
    expect(annotations['autoscaling.knative.dev/window']).toBeNull();
    expect(annotations['autoscaling.knative.dev/max-scale']).toBe('5');
  });

  it('omits the bounds that were never set', async () => {
    const saveButton = renderSection({ 'autoscaling.knative.dev/max-scale': '5' });

    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    const annotations = savedAnnotations();
    expect(annotations).not.toHaveProperty('autoscaling.knative.dev/min-scale');
    expect(annotations).not.toHaveProperty('autoscaling.knative.dev/initial-scale');
    expect(annotations).not.toHaveProperty('autoscaling.knative.dev/activation-scale');
    expect(annotations).not.toHaveProperty('autoscaling.knative.dev/scale-down-delay');
    expect(annotations).not.toHaveProperty('autoscaling.knative.dev/window');
  });
});

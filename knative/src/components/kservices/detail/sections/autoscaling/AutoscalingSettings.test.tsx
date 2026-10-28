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
import AutoscalingSettings from './AutoscalingSettings';

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
    specNumOrClear: helpers.specNumOrClear,
  };
});

/**
 * Builds a Knative Service whose revision template has the given annotations.
 *
 * @param annotations - The template annotations.
 * @param containerConcurrency - The template's hard limit, if it has one.
 * @returns The Knative Service, with a mocked `patch`.
 */
function makeKservice(
  annotations: Record<string, string>,
  containerConcurrency?: number
): KService {
  const kservice = {
    spec: {
      template: {
        metadata: { annotations },
        spec: {
          containerConcurrency,
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
 * @param containerConcurrency - The template's hard limit, if it has one.
 * @returns The target input and the Save button.
 */
function renderSection(annotations: Record<string, string>, containerConcurrency?: number) {
  render(
    <AutoscalingSettings
      cluster="cluster-a"
      kservice={makeKservice(annotations, containerConcurrency)}
      defaults={null}
    />
  );
  const targetInput = screen.getAllByRole('spinbutton')[0] as HTMLInputElement;
  const saveButton = screen.getByRole('button', { name: 'Save autoscaling' }) as HTMLButtonElement;
  return { targetInput, saveButton };
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

describe('AutoscalingSettings metric clearing', () => {
  it('sends a null metric annotation when an existing metric is unset', async () => {
    const { saveButton } = renderSection({
      'autoscaling.knative.dev/metric': 'rps',
      'autoscaling.knative.dev/target': '100',
    });

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /Unset/ }));

    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    const annotations = savedAnnotations();
    expect(annotations['autoscaling.knative.dev/metric']).toBeNull();
    expect(annotations['autoscaling.knative.dev/target']).toBe('100');
  });

  it('omits the metric annotation when it was never set and stays unset', async () => {
    const { saveButton } = renderSection({ 'autoscaling.knative.dev/target': '100' });

    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    expect(savedAnnotations()).not.toHaveProperty('autoscaling.knative.dev/metric');
  });
});

describe('AutoscalingSettings target clearing', () => {
  it('sends a null target annotation when an existing target is cleared', async () => {
    const { targetInput, saveButton } = renderSection({
      'autoscaling.knative.dev/metric': 'concurrency',
      'autoscaling.knative.dev/target': '80',
    });

    expect(targetInput.value).toBe('80');

    fireEvent.change(targetInput, { target: { value: '' } });

    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    const annotations = savedAnnotations();
    expect(annotations['autoscaling.knative.dev/target']).toBeNull();
    expect(annotations['autoscaling.knative.dev/metric']).toBe('concurrency');
  });

  it('keeps the target field editable and clearable when no metric annotation is set', async () => {
    const { targetInput, saveButton } = renderSection({
      'autoscaling.knative.dev/target': '80',
    });

    expect(targetInput.disabled).toBe(false);

    fireEvent.change(targetInput, { target: { value: '' } });

    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    const annotations = savedAnnotations();
    expect(annotations['autoscaling.knative.dev/target']).toBeNull();
    expect(annotations).not.toHaveProperty('autoscaling.knative.dev/metric');
  });

  it('omits the target annotation when it was never set and stays blank', async () => {
    const { saveButton } = renderSection({ 'autoscaling.knative.dev/metric': 'concurrency' });

    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    expect(savedAnnotations()).not.toHaveProperty('autoscaling.knative.dev/target');
  });

  it('still rejects malformed non-empty target values', async () => {
    const { targetInput, saveButton } = renderSection({
      'autoscaling.knative.dev/metric': 'concurrency',
      'autoscaling.knative.dev/target': '80',
    });

    fireEvent.change(targetInput, { target: { value: '-5' } });

    await waitFor(() => expect(saveButton.disabled).toBe(true));
    expect(screen.getByText('Fix invalid inputs')).toBeTruthy();
  });

  it('rejects a zero target instead of treating it as a clear', async () => {
    const { targetInput, saveButton } = renderSection({
      'autoscaling.knative.dev/metric': 'concurrency',
      'autoscaling.knative.dev/target': '80',
    });

    fireEvent.change(targetInput, { target: { value: '0' } });

    await waitFor(() => expect(saveButton.disabled).toBe(true));
  });
});

describe('AutoscalingSettings utilization and hard limit clearing', () => {
  it('sends a null target utilization annotation when an existing one is cleared', async () => {
    const { saveButton } = renderSection({
      'autoscaling.knative.dev/target-utilization-percentage': '70',
    });

    fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '' } });

    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    expect(savedAnnotations()['autoscaling.knative.dev/target-utilization-percentage']).toBeNull();
  });

  it('sends a null hard limit when an existing one is cleared', async () => {
    const { saveButton } = renderSection({}, 2);

    fireEvent.change(screen.getAllByRole('spinbutton')[2], { target: { value: '' } });

    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    expect(mocks.patch.mock.calls[0][0].spec.template.spec.containerConcurrency).toBeNull();
  });
});

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
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

// The real resources/knative module imports headlamp lib paths that only
// resolve inside a plugin build, so it is stood in for by its pure helper
// module. Routing through the actual helpers keeps buildAutoscalingPatch and
// the clear-or-omit logic on the production path instead of stubbing them.
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

function makeKservice(annotations: Record<string, string>) {
  return {
    spec: { template: { metadata: { annotations }, spec: {} } },
    patch: mocks.patch,
  };
}

function renderSection(annotations: Record<string, string>) {
  render(
    <AutoscalingSettings
      cluster="cluster-a"
      kservice={makeKservice(annotations) as never}
      defaults={null}
    />
  );
  // Rendered spinbutton order: target, target utilization, hard limit.
  const targetInput = screen.getAllByRole('spinbutton')[0] as HTMLInputElement;
  const saveButton = screen.getByRole('button', { name: 'Save autoscaling' }) as HTMLButtonElement;
  return { targetInput, saveButton };
}

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
    // Unrelated overrides are untouched by the clearing save.
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
    // No metric annotation existed beforehand, so none should be introduced.
    expect(annotations).not.toHaveProperty('autoscaling.knative.dev/metric');
  });

  it('omits the target annotation when it was never set and stays blank', async () => {
    const { saveButton } = renderSection({ 'autoscaling.knative.dev/metric': 'concurrency' });

    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());

    // Never-set means omission (undefined), which merge patch leaves alone,
    // as opposed to an explicit null that removes a previously set value.
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

    // A number input cannot hold non-numeric text (the DOM sanitizes it to a
    // blank value, which legitimately means "clear"), so use a representable
    // but invalid value to exercise the non-empty rejection path.
    fireEvent.change(targetInput, { target: { value: '0' } });

    await waitFor(() => expect(saveButton.disabled).toBe(true));
  });
});

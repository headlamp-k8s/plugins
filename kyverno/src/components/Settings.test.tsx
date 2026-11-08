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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Settings } from './Settings';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

describe('Settings', () => {
  it('renders the Policy Engine Health toggle', () => {
    render(<Settings data={{}} onDataChange={() => {}} />);
    expect(screen.getByText('Policy Engine Health')).toBeTruthy();
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('switch is OFF by default when data is empty', () => {
    render(<Settings data={{}} onDataChange={() => {}} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('switch is OFF when policyEngineHealthEnabled is false', () => {
    render(<Settings data={{ policyEngineHealthEnabled: false }} onDataChange={() => {}} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('switch is ON when policyEngineHealthEnabled is true', () => {
    render(<Settings data={{ policyEngineHealthEnabled: true }} onDataChange={() => {}} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('calls onDataChange with true when toggled ON', async () => {
    const user = userEvent.setup();
    const onDataChange = vi.fn();
    render(<Settings data={{ policyEngineHealthEnabled: false }} onDataChange={onDataChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onDataChange).toHaveBeenCalledWith({ policyEngineHealthEnabled: true });
  });

  it('calls onDataChange with false when toggled OFF', async () => {
    const user = userEvent.setup();
    const onDataChange = vi.fn();
    render(<Settings data={{ policyEngineHealthEnabled: true }} onDataChange={onDataChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onDataChange).toHaveBeenCalledWith({ policyEngineHealthEnabled: false });
  });

  it('does not throw when data is undefined', () => {
    expect(() => render(<Settings data={undefined} onDataChange={() => {}} />)).not.toThrow();
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('coerces non-boolean truthy values to false (strict === true guard)', () => {
    // A corrupted store might persist a string instead of a boolean.
    // The === true guard should treat any non-boolean as disabled.
    render(
      <Settings
        data={{ policyEngineHealthEnabled: 'true' as unknown as boolean }}
        onDataChange={() => {}}
      />
    );
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });
});

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

import type { EditorProps } from '@monaco-editor/react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { parse } from 'yaml';
import { TriggerFilter } from './TriggerFilter';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, options }: EditorProps) => (
    <textarea
      aria-label={options?.ariaLabel}
      value={value}
      readOnly={options?.readOnly && options?.domReadOnly}
    />
  ),
}));

describe('TriggerFilter', () => {
  it('updates the read-only YAML as the Trigger changes and shows All events when cleared', () => {
    const { rerender } = render(<TriggerFilter spec={undefined} />);
    expect(screen.getByText('All events')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();

    const filters = [{ all: [{ exact: { type: 'order.created' } }, { not: {} }] }];
    rerender(<TriggerFilter spec={{ filters }} />);

    const editor = screen.getByRole('textbox', {
      name: 'Trigger filter YAML',
    }) as HTMLTextAreaElement;
    expect(editor.readOnly).toBe(true);
    expect(parse(editor.value)).toEqual({ filters });
    expect(screen.queryByText('All events')).toBeNull();

    const filter = { attributes: { subject: '' } };
    rerender(<TriggerFilter spec={{ filter }} />);
    expect(parse(editor.value)).toEqual({ filter });

    rerender(<TriggerFilter spec={{ filters: [] }} />);
    expect(screen.getByText('All events')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});

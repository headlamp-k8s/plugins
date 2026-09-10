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

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExportSessionDialog from './ExportSessionDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span aria-hidden="true" data-icon={icon} />,
}));

afterEach(cleanup);

describe('ExportSessionDialog', () => {
  const sampleMessages = [
    { role: 'user', content: 'Explain deployment status' },
    { role: 'assistant', content: 'The deployment has 3 ready replicas.' },
  ];

  it('renders dialog title, message preview, and action buttons', () => {
    const onClose = vi.fn();
    render(
      <ExportSessionDialog
        open
        onClose={onClose}
        messages={sampleMessages}
        cluster="test-cluster"
      />
    );

    expect(screen.getByRole('heading', { name: 'Export Troubleshooting Session' })).toBeTruthy();
    expect(screen.getByText(/Review and copy or download/)).toBeTruthy();

    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', {
      name: 'Exported session report in Markdown',
    });
    expect(textarea.value).toContain('Explain deployment status');
    expect(textarea.value).toContain('The deployment has 3 ready replicas.');
    expect(textarea.value).toContain('test-cluster');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('copies session markdown to clipboard on button click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportSessionDialog
        open
        onClose={vi.fn()}
        messages={sampleMessages}
        cluster="test-cluster"
      />
    );

    const copyButton = screen.getByRole('button', { name: 'Copy to Clipboard' });
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledOnce();
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeTruthy();
  });

  it('triggers download on button click', () => {
    const createObjectURLMock = vi.fn(() => 'blob:http://localhost/dummy');
    const revokeObjectURLMock = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    render(
      <ExportSessionDialog
        open
        onClose={vi.fn()}
        messages={sampleMessages}
        cluster="test-cluster"
      />
    );

    const downloadButton = screen.getByRole('button', { name: 'Download as Markdown' });
    fireEvent.click(downloadButton);

    expect(createObjectURLMock).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledOnce();
  });
});

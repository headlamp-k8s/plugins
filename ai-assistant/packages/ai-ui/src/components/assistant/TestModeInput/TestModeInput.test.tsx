import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import TestModeInput from './TestModeInput';
import { activeTestModeArgs } from './TestModeInput.stories';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));
afterEach(cleanup);

function openDialog(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Add Test Response', hidden: true }));
}

it('renders nothing while inactive and accessible controls while active', async () => {
  const { container, rerender } = render(
    <TestModeInput {...activeTestModeArgs} isTestMode={false} />
  );
  expect(container.childElementCount).toBe(0);
  rerender(
    <main>
      <TestModeInput {...activeTestModeArgs} />
    </main>
  );
  expect(screen.getByText('Test Mode Active - Add custom responses')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Add Test Response' })).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

it('emits representative assistant, error, user, and object quick samples', () => {
  const onAddTestResponse = vi.fn();
  render(<TestModeInput {...activeTestModeArgs} onAddTestResponse={onAddTestResponse} />);
  for (const name of [
    'Simple Markdown Text',
    'Error Response',
    'User Question',
    'Tool Confirmation - Kubernetes API',
  ]) {
    fireEvent.click(screen.getByRole('button', { name }));
  }
  expect(onAddTestResponse.mock.calls[0][1]).toBe('assistant');
  expect(onAddTestResponse.mock.calls[1]).toEqual([expect.any(String), 'assistant', true]);
  expect(onAddTestResponse.mock.calls[2]).toEqual([expect.any(String), 'user', false]);
  expect(onAddTestResponse.mock.calls[3][0]).toEqual(
    expect.objectContaining({ isDisplayOnly: true })
  );
});

it('submits custom assistant errors and resets after completion', () => {
  const onAddTestResponse = vi.fn();
  render(<TestModeInput {...activeTestModeArgs} onAddTestResponse={onAddTestResponse} />);
  openDialog();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Simulate Error Response' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Response Content' }), {
    target: { value: 'custom response' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add Response' }));
  expect(onAddTestResponse).toHaveBeenCalledWith('custom response', 'assistant', true);
  openDialog();
  expect(screen.getByRole('textbox', { name: 'Response Content' })).toHaveProperty('value', '');
  expect(screen.getByRole('checkbox', { name: 'Simulate Error Response' })).toHaveProperty(
    'checked',
    false
  );
});

it('switches to user responses and hides the error toggle', () => {
  const onAddTestResponse = vi.fn();
  render(<TestModeInput {...activeTestModeArgs} onAddTestResponse={onAddTestResponse} />);
  openDialog();
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Response Type' }));
  fireEvent.click(screen.getByRole('option', { name: 'User Message' }));
  expect(screen.queryByRole('checkbox', { name: 'Simulate Error Response' })).toBeNull();
  fireEvent.change(screen.getByRole('textbox', { name: 'Response Content' }), {
    target: { value: 'question' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add Response' }));
  expect(onAddTestResponse).toHaveBeenCalledWith('question', 'user', false);
});

it('parses object tool-confirmation JSON but preserves arrays and malformed JSON as strings', () => {
  const onAddTestResponse = vi.fn();
  render(<TestModeInput {...activeTestModeArgs} onAddTestResponse={onAddTestResponse} />);
  for (const value of [
    '{"toolConfirmation":{"tools":[]}}',
    '{"description":"toolConfirmation documentation"}',
    '[{"toolConfirmation":true}]',
    '{toolConfirmation: invalid}',
  ]) {
    openDialog();
    fireEvent.change(screen.getByRole('textbox', { name: 'Response Content' }), {
      target: { value },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Response' }));
  }
  expect(onAddTestResponse.mock.calls[0][0]).toEqual({ toolConfirmation: { tools: [] } });
  expect(onAddTestResponse.mock.calls[1][0]).toBe(
    '{"description":"toolConfirmation documentation"}'
  );
  expect(onAddTestResponse.mock.calls[2][0]).toBe('[{"toolConfirmation":true}]');
  expect(onAddTestResponse.mock.calls[3][0]).toBe('{toolConfirmation: invalid}');
});

it('disables blank submission and resets state after cancel/reopen', () => {
  render(<TestModeInput {...activeTestModeArgs} />);
  openDialog();
  expect(screen.getByRole('button', { name: 'Add Response' })).toHaveProperty('disabled', true);
  fireEvent.change(screen.getByRole('textbox', { name: 'Response Content' }), {
    target: { value: 'draft' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  openDialog();
  expect(screen.getByRole('textbox', { name: 'Response Content' })).toHaveProperty('value', '');
});

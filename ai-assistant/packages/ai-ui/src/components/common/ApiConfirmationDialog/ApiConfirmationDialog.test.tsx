import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import ApiConfirmationDialog from './ApiConfirmationDialog';
import { postRequestArgs } from './ApiConfirmationDialog.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : key,
  }),
}));

afterEach(cleanup);

it('returns nothing for incomplete or closed requests', () => {
  const { container, rerender } = render(<ApiConfirmationDialog {...postRequestArgs} url="" />);
  expect(container.childElementCount).toBe(0);
  rerender(<ApiConfirmationDialog {...postRequestArgs} method="" />);
  expect(container.childElementCount).toBe(0);
  rerender(<ApiConfirmationDialog {...postRequestArgs} open={false} />);
  expect(container.childElementCount).toBe(0);
});

it('auto-confirms each distinct GET request once with URL resource metadata', async () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const { rerender } = render(
    <ApiConfirmationDialog
      {...postRequestArgs}
      method="GET"
      body={undefined}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
  await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
  expect(onConfirm).toHaveBeenCalledWith(undefined, undefined);
  rerender(
    <ApiConfirmationDialog
      {...postRequestArgs}
      method="GET"
      body={undefined}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
  expect(onConfirm).toHaveBeenCalledOnce();
  rerender(
    <ApiConfirmationDialog
      {...postRequestArgs}
      method="GET"
      url="/api/v1/nodes/node-1"
      body={undefined}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
  await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(2));
});

it('confirms DELETE with resource metadata in the second callback argument and passes axe', async () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <ApiConfirmationDialog
      {...postRequestArgs}
      method="DELETE"
      url="/api/v1/namespaces/default/pods/example-pod"
      body={undefined}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
  expect(screen.getByRole('dialog', { name: 'Delete pods' })).toBeTruthy();
  expect(screen.getByText(/namespace "default"/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Yes, Delete pods' }));
  expect(onConfirm).toHaveBeenCalledWith(
    undefined,
    JSON.stringify({ kind: 'pods', name: 'example-pod', namespace: 'default' })
  );
  expect(onClose).toHaveBeenCalledOnce();
  await expect(runAxe()).resolves.toEqual([]);
});

it('uses body metadata and shows external errors in delete confirmation', () => {
  render(<ApiConfirmationDialog {...postRequestArgs} method="DELETE" error="Request failed" />);
  expect(screen.getByRole('dialog', { name: 'Delete Pod' })).toBeTruthy();
  expect(screen.getByText('Request failed')).toBeTruthy();
  expect(screen.getByText('example-pod')).toBeTruthy();
});

it('confirms PUT and PATCH with normalized body and resource info', () => {
  const onConfirm = vi.fn();
  const { rerender } = render(
    <ApiConfirmationDialog {...postRequestArgs} method="PUT" onConfirm={onConfirm} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Yes, Apply Patch' }));
  expect(onConfirm).toHaveBeenCalledWith(
    expect.stringContaining('kind: Pod'),
    JSON.stringify({ kind: 'Pod', name: 'example-pod', namespace: 'default' })
  );
  rerender(<ApiConfirmationDialog {...postRequestArgs} method="PATCH" onConfirm={onConfirm} />);
  expect(screen.getByRole('dialog', { name: 'Apply Patch to Pod: example-pod' })).toBeTruthy();
});

it('saves edited POST body as a string without adding JSON quotes', () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(<ApiConfirmationDialog {...postRequestArgs} onConfirm={onConfirm} onClose={onClose} />);
  const editor = screen.getByRole('textbox', { name: 'Content to edit' });
  fireEvent.change(editor, { target: { value: 'kind: Pod\nmetadata:\n  name: edited' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(onConfirm).toHaveBeenCalledWith(
    'kind: Pod\nmetadata:\n  name: edited',
    JSON.stringify({ kind: 'Pod', name: 'example-pod', namespace: 'default' })
  );
  expect(onClose).toHaveBeenCalledOnce();
});

it('cancels the editor once while idle', () => {
  const onClose = vi.fn();
  render(<ApiConfirmationDialog {...postRequestArgs} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onClose).toHaveBeenCalledOnce();
});

it('cleans block-scalar prefixes and preserves malformed bodies for editing', () => {
  const { rerender } = render(
    <ApiConfirmationDialog
      {...postRequestArgs}
      body={'|-\nkind: Pod\nmetadata:\n  name: prefixed'}
    />
  );
  expect(screen.getByRole('textbox', { name: 'Content to edit' })).toHaveProperty(
    'value',
    expect.stringContaining('name: prefixed')
  );
  rerender(<ApiConfirmationDialog {...postRequestArgs} body="metadata: [" />);
  expect(screen.getByRole('textbox', { name: 'Content to edit' })).toHaveProperty(
    'value',
    'metadata: ['
  );
});

it('locks default dialog actions while loading', () => {
  const onClose = vi.fn();
  const { rerender } = render(
    <ApiConfirmationDialog {...postRequestArgs} isLoading onClose={onClose} />
  );
  expect(screen.getByRole('button', { name: 'Applying...' })).toHaveProperty('disabled', true);
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty('disabled', true);
  rerender(
    <ApiConfirmationDialog
      {...postRequestArgs}
      method="DELETE"
      url="/api/v1/namespaces/default/pods/example-pod"
      body={undefined}
      isLoading
      onClose={onClose}
    />
  );
  expect(screen.getByRole('button', { name: 'Yes, Delete pods' })).toHaveProperty('disabled', true);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(onClose).not.toHaveBeenCalled();
});

it('supports typed custom confirmation and editor slots', () => {
  const confirmSlot = vi.fn();
  const editorSlot = vi.fn();
  const ConfirmSlot = (
    props: React.ComponentProps<NonNullable<typeof postRequestArgs.ConfirmDialogSlot>>
  ) => {
    confirmSlot(props.title);
    return <button onClick={props.onConfirm}>{props.confirmLabel}</button>;
  };
  const EditorSlot = (
    props: React.ComponentProps<NonNullable<typeof postRequestArgs.EditorDialogSlot>>
  ) => {
    editorSlot(props.title);
    return <button onClick={() => props.onSave('edited')}>{props.saveLabel}</button>;
  };
  const { rerender } = render(
    <ApiConfirmationDialog {...postRequestArgs} method="DELETE" ConfirmDialogSlot={ConfirmSlot} />
  );
  expect(confirmSlot).toHaveBeenCalledWith('Delete Pod');
  rerender(<ApiConfirmationDialog {...postRequestArgs} EditorDialogSlot={EditorSlot} />);
  expect(editorSlot).toHaveBeenCalledWith('Create Pod: example-pod');
});

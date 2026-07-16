import { DialogTitle } from '@mui/material';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import {
  DefaultActionButton,
  DefaultConfirmDialog,
  DefaultContentRenderer,
  DefaultDialog,
  DefaultEditorDialog,
  DefaultSectionWrapper,
} from './DefaultSlots';
import {
  actionButtonArgs,
  confirmDialogArgs,
  contentRendererArgs,
  editorDialogArgs,
  sectionWrapperArgs,
} from './DefaultSlots.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));

afterEach(cleanup);

it('renders an accessible default action button and forwards clicks', async () => {
  const onClick = vi.fn();
  const { container } = render(
    <main>
      <DefaultActionButton {...actionButtonArgs} onClick={onClick} />
    </main>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
  expect(onClick).toHaveBeenCalledOnce();
  expect(container.querySelector('[data-icon="mdi:cog"]')?.getAttribute('aria-hidden')).toBe(
    'true'
  );
  await expect(runAxe()).resolves.toEqual([]);
});

it('renders string and node confirmation descriptions and invokes both actions', async () => {
  const handleClose = vi.fn();
  const onConfirm = vi.fn();
  const { rerender } = render(
    <DefaultConfirmDialog {...confirmDialogArgs} handleClose={handleClose} onConfirm={onConfirm} />
  );

  expect(screen.getByText('This operation cannot be undone.')).toBeTruthy();
  const confirmDialog = screen.getByRole('dialog', { name: 'Delete resource?' });
  expect(confirmDialog.getAttribute('aria-describedby')).toBe(
    screen.getByText('This operation cannot be undone.').id
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(handleClose).toHaveBeenCalledOnce();
  expect(onConfirm).toHaveBeenCalledOnce();
  await expect(runAxe()).resolves.toEqual([]);

  rerender(
    <DefaultConfirmDialog
      {...confirmDialogArgs}
      description={<strong>Structured warning</strong>}
      confirmLabel="Delete"
    />
  );
  expect(screen.getByText('Structured warning')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
});

it('labels, synchronizes, edits, saves, and cancels editor content', async () => {
  const onClose = vi.fn();
  const setOpen = vi.fn();
  const onSave = vi.fn();
  const { rerender } = render(
    <DefaultEditorDialog
      {...editorDialogArgs}
      title={undefined}
      onClose={onClose}
      setOpen={setOpen}
      onSave={onSave}
    />
  );
  const editor = screen.getByRole('textbox', { name: 'Content to edit' });

  expect(screen.getByRole('heading', { name: 'Edit content' })).toBeTruthy();
  expect(screen.getByRole('dialog', { name: 'Edit content' })).toBeTruthy();
  fireEvent.change(editor, { target: { value: 'updated content' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSave).toHaveBeenCalledWith('updated content');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(setOpen).toHaveBeenCalledWith(false);
  expect(onClose).toHaveBeenCalledOnce();
  await expect(runAxe()).resolves.toEqual([]);

  rerender(<DefaultEditorDialog {...editorDialogArgs} item="replacement" saveLabel="Apply" />);
  expect(screen.getByRole('textbox', { name: 'Content to edit' })).toHaveProperty(
    'value',
    'replacement'
  );
  expect(screen.getByRole('button', { name: 'Apply' })).toBeTruthy();
});

it('renders plain content and a semantic section without axe violations', async () => {
  const { container } = render(
    <main>
      <DefaultSectionWrapper {...sectionWrapperArgs}>
        <DefaultContentRenderer {...contentRendererArgs} />
      </DefaultSectionWrapper>
    </main>
  );

  expect(screen.getByRole('heading', { name: 'Provider settings', level: 2 })).toBeTruthy();
  expect(screen.getByText(/First line/).tagName).toBe('DIV');
  expect(container.textContent).toContain('First line\nSecond line');
  await expect(runAxe()).resolves.toEqual([]);
});

it('exports a functional MUI dialog fallback', async () => {
  render(
    <DefaultDialog open>
      <DialogTitle>Standalone dialog</DialogTitle>
      <p>Dialog content</p>
    </DefaultDialog>
  );
  expect(screen.getByRole('dialog', { name: 'Standalone dialog' })).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

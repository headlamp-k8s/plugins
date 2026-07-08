import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import SkillSourceEditorDialog from './SkillSourceEditorDialog';
import {
  BrowserGitOnly,
  closedSkillSourceArgs,
  editSkillSourceArgs,
  existingSkillSource,
  newSkillSourceArgs,
} from './SkillSourceEditorDialog.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : key,
  }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));

afterEach(cleanup);

function setSource(value: string): void {
  fireEvent.change(screen.getByRole('textbox', { name: /Directory Path|Repository URL/ }), {
    target: { value },
  });
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: /Add|Save/ }));
}

it('renders accessible local-source defaults with translated helper text and passes axe', async () => {
  render(
    <main>
      <SkillSourceEditorDialog {...newSkillSourceArgs} />
    </main>
  );

  expect(screen.getByRole('dialog', { name: 'Add Skill Source' })).toBeTruthy();
  expect(screen.getByRole('radiogroup', { name: 'Source Type' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Filesystem' })).toHaveProperty('checked', true);
  expect(screen.getByText('Absolute path to a directory containing skill files')).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Enabled' })).toHaveProperty('checked', true);
  await expect(runAxe()).resolves.toEqual([]);
});

it('renders the browser Storybook fixture as GitHub-only', () => {
  render(<SkillSourceEditorDialog {...BrowserGitOnly.args} />);
  expect(screen.queryByRole('radio', { name: 'Filesystem' })).toBeNull();
  expect(screen.getByRole('radio', { name: 'GitHub Repository' })).toHaveProperty('checked', true);
  expect(screen.getByRole('textbox', { name: 'Repository URL' })).toBeTruthy();
});

it('requires a local path and clears validation while editing', () => {
  render(<SkillSourceEditorDialog {...newSkillSourceArgs} />);
  save();
  expect(screen.getByText('Path is required')).toBeTruthy();
  setSource('/skills');
  expect(screen.queryByText('Path is required')).toBeNull();
});

it.each([
  ['http://github.com/example/repo', 'Must be an HTTPS GitHub repository URL'],
  ['https://evil.github.com/example/repo', 'Must be an HTTPS GitHub repository URL'],
  ['https://gitlab.com/example/repo', 'Must be an HTTPS GitHub repository URL'],
  ['not a URL', 'Must be an HTTPS GitHub repository URL'],
] as const)('rejects unsupported Git URLs', (value, message) => {
  render(<SkillSourceEditorDialog {...newSkillSourceArgs} />);
  fireEvent.click(screen.getByRole('radio', { name: 'GitHub Repository' }));
  setSource(value);
  save();
  expect(screen.getByText(message)).toBeTruthy();
});

it('normalizes Git URLs and rejects duplicates after trimming trailing slashes', () => {
  render(<SkillSourceEditorDialog {...newSkillSourceArgs} />);
  fireEvent.click(screen.getByRole('radio', { name: 'GitHub Repository' }));
  setSource(' https://github.com/example/platform-skills/ ');
  save();
  expect(screen.getByText('This source already exists')).toBeTruthy();
});

it('normalizes local trailing slashes for duplicate checks while preserving roots', () => {
  const onSave = vi.fn();
  const { rerender } = render(
    <SkillSourceEditorDialog
      {...newSkillSourceArgs}
      existingSources={[{ type: 'local', url: '/absolute/skills', enabled: true }]}
      onSave={onSave}
    />
  );
  setSource('/absolute/skills/');
  save();
  expect(screen.getByText('This source already exists')).toBeTruthy();

  rerender(
    <SkillSourceEditorDialog {...newSkillSourceArgs} existingSources={[]} onSave={onSave} />
  );
  setSource('/');
  save();
  expect(onSave).toHaveBeenCalledWith({ type: 'local', url: '/', enabled: true });
});

it('validates SHA-256 integrity hashes', () => {
  render(<SkillSourceEditorDialog {...newSkillSourceArgs} />);
  fireEvent.click(screen.getByRole('radio', { name: 'GitHub Repository' }));
  setSource('https://github.com/example/skills');
  fireEvent.change(screen.getByRole('textbox', { name: 'SHA-256 Integrity Hash' }), {
    target: { value: 'not-a-hash' },
  });
  save();
  const shaField = screen.getByRole('textbox', { name: 'SHA-256 Integrity Hash' });
  const descriptionId = shaField.getAttribute('aria-describedby');
  expect(descriptionId).toBeTruthy();
  expect(document.getElementById(descriptionId!)?.textContent).toContain(
    'SHA-256 integrity hash must contain 64 hexadecimal characters'
  );
  expect(screen.getByRole('textbox', { name: 'Repository URL' }).getAttribute('aria-invalid')).toBe(
    'false'
  );
});

it('saves a normalized GitHub source with optional fields and enabled state', () => {
  const onSave = vi.fn();
  render(<SkillSourceEditorDialog {...newSkillSourceArgs} onSave={onSave} />);
  fireEvent.click(screen.getByRole('radio', { name: 'GitHub Repository' }));
  setSource(' https://github.com/example/skills/ ');
  fireEvent.change(screen.getByRole('textbox', { name: 'Ref (branch, tag, or SHA)' }), {
    target: { value: ' release ' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Subdirectory' }), {
    target: { value: ' skills/ ' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'SHA-256 Integrity Hash' }), {
    target: { value: 'A'.repeat(64) },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enabled' }));
  save();

  expect(onSave).toHaveBeenCalledWith({
    type: 'git',
    url: 'https://github.com/example/skills',
    ref: 'release',
    path: 'skills',
    sha256: 'a'.repeat(64),
    enabled: false,
  });
});

it('saves only local-source fields', () => {
  const onSave = vi.fn();
  render(<SkillSourceEditorDialog {...newSkillSourceArgs} onSave={onSave} />);
  setSource(' /absolute/skills ');
  save();
  expect(onSave).toHaveBeenCalledWith({ type: 'local', url: '/absolute/skills', enabled: true });
});

it('rejects relative local paths', () => {
  render(<SkillSourceEditorDialog {...newSkillSourceArgs} />);
  setSource('relative/skills');
  save();
  expect(screen.getByText('Path must be absolute')).toBeTruthy();
});

it('clears Git-only fields when switching to local and back', () => {
  render(<SkillSourceEditorDialog {...editSkillSourceArgs} />);
  fireEvent.click(screen.getByRole('radio', { name: 'Filesystem' }));
  fireEvent.click(screen.getByRole('radio', { name: 'GitHub Repository' }));

  expect(screen.getByRole('textbox', { name: 'Ref (branch, tag, or SHA)' })).toHaveProperty(
    'value',
    ''
  );
  expect(screen.getByRole('textbox', { name: 'Subdirectory' })).toHaveProperty('value', '');
  expect(screen.getByRole('textbox', { name: 'SHA-256 Integrity Hash' })).toHaveProperty(
    'value',
    ''
  );
});

it('loads existing values and permits retaining the original URL', () => {
  const onSave = vi.fn();
  render(<SkillSourceEditorDialog {...editSkillSourceArgs} onSave={onSave} />);

  expect(screen.getByRole('heading', { name: 'Edit Skill Source' })).toBeTruthy();
  expect(screen.getByRole('textbox', { name: 'Repository URL' })).toHaveProperty(
    'value',
    existingSkillSource.url
  );
  save();
  expect(onSave).toHaveBeenCalledWith({ ...existingSkillSource, path: 'skills' });
});

it('rejects changing an edited source to another existing URL', () => {
  render(<SkillSourceEditorDialog {...editSkillSourceArgs} />);
  setSource('https://github.com/example/platform-skills');
  fireEvent.change(screen.getByRole('textbox', { name: 'Subdirectory' }), {
    target: { value: '' },
  });
  save();
  expect(screen.getByText('This source already exists')).toBeTruthy();
});

it('allows the same repository URL when the subdirectory identity differs', () => {
  const onSave = vi.fn();
  render(
    <SkillSourceEditorDialog
      {...newSkillSourceArgs}
      existingSources={[
        { type: 'git', url: 'https://github.com/example/repo', path: 'first', enabled: true },
      ]}
      onSave={onSave}
    />
  );
  fireEvent.click(screen.getByRole('radio', { name: 'GitHub Repository' }));
  setSource('https://github.com/example/repo');
  fireEvent.change(screen.getByRole('textbox', { name: 'Subdirectory' }), {
    target: { value: '/second/' },
  });
  save();
  expect(onSave).toHaveBeenCalledWith({
    type: 'git',
    url: 'https://github.com/example/repo',
    path: 'second',
    enabled: true,
  });
});

it('resets stale add state each time the dialog reopens', () => {
  const { rerender } = render(<SkillSourceEditorDialog {...newSkillSourceArgs} />);
  fireEvent.click(screen.getByRole('radio', { name: 'GitHub Repository' }));
  setSource('https://github.com/example/new');
  rerender(<SkillSourceEditorDialog {...closedSkillSourceArgs} />);
  rerender(<SkillSourceEditorDialog {...newSkillSourceArgs} />);

  expect(screen.getByRole('radio', { name: 'Filesystem' })).toHaveProperty('checked', true);
  expect(screen.getByRole('textbox', { name: 'Directory Path' })).toHaveProperty('value', '');
});

it('forwards a custom dialog slot and cancels', () => {
  const onClose = vi.fn();
  const slot = vi.fn();
  function DialogSlot({
    children,
    open,
  }: PropsWithChildren<{ open?: boolean }>): React.ReactElement {
    slot(open);
    return <section>{children}</section>;
  }
  render(
    <SkillSourceEditorDialog {...newSkillSourceArgs} onClose={onClose} DialogSlot={DialogSlot} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(slot).toHaveBeenCalledWith(true);
});

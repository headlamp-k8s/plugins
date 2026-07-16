import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import {
  formatBytes,
  groupSkills,
  parseSource,
  resolveRelativeUrl,
  shortDescription,
  type SkillLoadProgress,
  SkillsViewerDialog,
  type SkillsViewerDialogProps,
} from './SkillsViewerDialog';
import { azureSkills, localSkills } from './SkillsViewerDialog.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      key.replace(/{{(\w+)}}/g, (_, name: string) => String(values?.[name] ?? '')),
  }),
}));
vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));

afterEach(cleanup);

function renderDialog(overrides: Partial<SkillsViewerDialogProps> = {}): SkillsViewerDialogProps {
  const props: SkillsViewerDialogProps = {
    open: true,
    onClose: vi.fn(),
    loadSkills: vi.fn().mockResolvedValue(azureSkills),
    ...overrides,
  };
  render(<SkillsViewerDialog {...props} />);
  return props;
}

it('uses production helpers for parsing, grouping, byte formatting, and descriptions', () => {
  expect(formatBytes(1023)).toBe('1023 B');
  expect(formatBytes(1536)).toBe('1.5 KB');
  expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  expect(parseSource(azureSkills[0].source)).toEqual({
    group: 'microsoft/azure-skills',
    path: 'azure-kubernetes/SKILL.md',
  });
  expect(parseSource('/project/skills/local/SKILL.md')).toEqual({
    group: 'local',
    path: 'SKILL.md',
  });
  expect(parseSource('SKILL.md')).toEqual({ group: 'Local', path: 'SKILL.md' });
  expect(groupSkills([...localSkills, ...azureSkills])[0].label).toBe('microsoft/azure-skills');
  expect(groupSkills([])).toEqual([]);
  expect(shortDescription('First sentence. Second sentence.')).toBe('First sentence');
  expect(shortDescription('x'.repeat(130))).toHaveLength(120);
});

it('resolves safe GitHub links and rejects unsafe markdown schemes', () => {
  const source = azureSkills[0].source;
  expect(resolveRelativeUrl('references/steps.md', source)).toContain(
    '/blob/02a614f6ee1f052826f834d65c61e430ad152c8e/azure-kubernetes/references/steps.md'
  );
  expect(resolveRelativeUrl('/docs/reference.md', source)).toContain(
    '/blob/02a614f6ee1f052826f834d65c61e430ad152c8e/docs/reference.md'
  );
  expect(resolveRelativeUrl('https://example.com', source)).toBe('https://example.com');
  expect(resolveRelativeUrl('//example.com/path', source)).toBe('https://example.com/path');
  expect(resolveRelativeUrl('#section', source)).toBe('#section');
  expect(resolveRelativeUrl('mailto:team@example.com', source)).toBe('mailto:team@example.com');
  expect(resolveRelativeUrl('javascript:alert(1)', source)).toBe('#');
  expect(resolveRelativeUrl('relative.md', '/local/SKILL.md')).toBe('relative.md');
});

it('renders downloading and extracting progress before resolving', async () => {
  let resolveLoad: (skills: typeof azureSkills) => void = () => {};
  let reportProgress: ((progress: SkillLoadProgress) => void) | undefined;
  const loadSkills = vi.fn(
    progress =>
      new Promise<typeof azureSkills>(resolve => {
        resolveLoad = resolve;
        reportProgress = progress;
        progress?.({
          phase: 'downloading',
          bytesDownloaded: 512,
          totalBytes: 1024,
          filesFound: 1,
          totalFiles: 2,
        });
      })
  );
  renderDialog({ loadSkills });
  expect(screen.getByRole('status')).toBeTruthy();
  await waitFor(() => expect(screen.getByText('1 / 2')).toBeTruthy());
  expect(
    screen
      .getByRole('progressbar', { name: 'Skill loading progress' })
      .getAttribute('aria-valuenow')
  ).toBe('50');
  reportProgress?.({
    phase: 'extracting',
    bytesDownloaded: 1024,
    totalBytes: 1024,
    filesFound: 2,
    totalFiles: 2,
  });
  expect(await screen.findByText('Extracting...')).toBeTruthy();
  resolveLoad(azureSkills);
  expect(await screen.findAllByText('3 skills · 15.3 KB')).toHaveLength(2);
});

it('renders Storybook metadata and safe markdown links, collapses, and passes axe', async () => {
  const skill = {
    ...azureSkills[0],
    author: 'azure-team',
    version: '3.1.0',
    tags: ['aks'],
    content: '# Guide\n\n[Steps](references/steps.md)\n\n[Unsafe](javascript:alert(1))',
  };
  renderDialog({ loadSkills: vi.fn().mockResolvedValue([skill]), title: 'Azure Skills' });
  expect(await screen.findAllByText('1 skill · 9.4 KB')).toHaveLength(2);
  expect(screen.getByRole('heading', { name: /^Azure Skills/ })).toBeTruthy();
  const summary = screen.getByRole('button', { name: /azure-kubernetes/i });
  fireEvent.click(summary);
  expect(await screen.findByText('azure-team')).toBeTruthy();
  expect(screen.getByText('3.1.0')).toBeTruthy();
  expect(screen.getByText('aks')).toBeTruthy();
  expect(screen.getByRole('link', { name: /Steps/ })).toHaveProperty(
    'href',
    expect.stringContaining('/blob/')
  );
  const unsafeLink = screen.getByRole('link', { name: 'Unsafe' });
  expect(unsafeLink).toHaveProperty('href', expect.stringMatching(/#$/));
  expect(unsafeLink.getAttribute('target')).toBeNull();
  await expect(runAxe()).resolves.toEqual([]);
  fireEvent.click(summary);
  expect(summary.getAttribute('aria-expanded')).toBe('false');
});

it('reloads skills and reports completion', async () => {
  const loadSkills = vi.fn().mockResolvedValue([azureSkills[0]]);
  const onLoadComplete = vi.fn();
  renderDialog({ loadSkills, onLoadComplete });
  await screen.findAllByText('1 skill · 9.4 KB');
  fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
  await waitFor(() => expect(loadSkills).toHaveBeenCalledTimes(2));
  expect(onLoadComplete).toHaveBeenLastCalledWith({ count: 1 });
});

it('does not reload when parent callback identities change while open', async () => {
  const firstLoad = vi.fn().mockResolvedValue([azureSkills[0]]);
  const secondLoad = vi.fn().mockResolvedValue([]);
  const { rerender } = render(
    <SkillsViewerDialog open onClose={vi.fn()} loadSkills={firstLoad} onLoadComplete={vi.fn()} />
  );
  await screen.findAllByText('1 skill · 9.4 KB');
  rerender(
    <SkillsViewerDialog open onClose={vi.fn()} loadSkills={secondLoad} onLoadComplete={vi.fn()} />
  );
  await Promise.resolve();
  expect(firstLoad).toHaveBeenCalledTimes(1);
  expect(secondLoad).not.toHaveBeenCalled();
});

it('renders empty and error states and closes on request', async () => {
  const onClose = vi.fn();
  const { rerender } = render(
    <SkillsViewerDialog open onClose={onClose} loadSkills={vi.fn().mockResolvedValue([])} />
  );
  expect(
    await screen.findByText('No skills loaded. Configure skill sources in the settings above.')
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  rerender(
    <SkillsViewerDialog
      open={false}
      onClose={onClose}
      loadSkills={vi.fn().mockRejectedValue('repository unavailable')}
    />
  );
  rerender(
    <SkillsViewerDialog
      open
      onClose={onClose}
      loadSkills={vi.fn().mockRejectedValue('repository unavailable')}
    />
  );
  expect(await screen.findByText('Failed to load skills: repository unavailable')).toBeTruthy();
});

it('ignores stale load and progress updates after close', async () => {
  let resolveLoad: (skills: typeof azureSkills) => void = () => {};
  let reportProgress: ((progress: SkillLoadProgress) => void) | undefined;
  const loadSkills: SkillsViewerDialogProps['loadSkills'] = callback => {
    reportProgress = callback;
    return new Promise(resolve => {
      resolveLoad = resolve;
    });
  };
  const onLoadComplete = vi.fn();
  const { rerender } = render(
    <SkillsViewerDialog
      open
      onClose={vi.fn()}
      loadSkills={loadSkills}
      onLoadComplete={onLoadComplete}
    />
  );
  rerender(
    <SkillsViewerDialog
      open={false}
      onClose={vi.fn()}
      loadSkills={loadSkills}
      onLoadComplete={onLoadComplete}
    />
  );
  reportProgress?.({
    phase: 'done',
    bytesDownloaded: 10,
    totalBytes: 10,
    filesFound: 1,
    totalFiles: 1,
  });
  resolveLoad(azureSkills);
  await Promise.resolve();
  expect(onLoadComplete).not.toHaveBeenCalled();
});

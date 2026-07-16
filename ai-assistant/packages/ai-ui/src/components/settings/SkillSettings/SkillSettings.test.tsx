import { getSkillSourceIdentity } from '@headlamp-k8s/ai-common/skills/config';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import {
  getSkillsConfig,
  SkillSettings,
  type SkillSettingsProps,
  type SkillSourceEntry,
} from './SkillSettings';
import { configuredSkills, createMemoryConfigStore } from './SkillSettings.stories';

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
vi.mock('../SkillSourceEditorDialog/SkillSourceEditorDialog', () => ({
  default: ({
    open,
    onClose,
    onSave,
    source,
    allowLocalSources,
  }: {
    open: boolean;
    onClose: () => void;
    onSave: (source: SkillSourceEntry) => void;
    source?: SkillSourceEntry;
    allowLocalSources: boolean;
  }) =>
    open ? (
      <div role="dialog" aria-label="Source editor">
        <span>{allowLocalSources ? 'Local enabled' : 'Git only'}</span>
        <span>{source?.url || 'new source'}</span>
        <button
          onClick={() =>
            onSave(
              source?.url
                ? { ...source, url: `${source.url}-edited` }
                : { type: 'git', url: 'https://github.com/new/skills', enabled: true }
            )
          }
        >
          Save source
        </button>
        {source?.url && (
          <button
            onClick={() =>
              onSave({
                ...source,
                url: 'https://github.com/new/skills',
                path: undefined,
              })
            }
          >
            Save duplicate source
          </button>
        )}
        <button onClick={onClose}>Cancel editor</button>
      </div>
    ) : null,
}));
vi.mock('../SkillsViewerDialog/SkillsViewerDialog', () => ({
  SkillsViewerDialog: ({
    open,
    title,
    loadSkills,
    onClose,
  }: {
    open: boolean;
    title?: string;
    loadSkills: () => Promise<unknown[]>;
    onClose: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Skills viewer">
        <span>{title || 'All skills'}</span>
        <button onClick={() => void loadSkills()}>Load viewer skills</button>
        <button onClick={onClose}>Close viewer</button>
      </div>
    ) : null,
}));

afterEach(cleanup);

function renderSettings(overrides: Partial<SkillSettingsProps> = {}): SkillSettingsProps {
  const props: SkillSettingsProps = {
    configStore: createMemoryConfigStore(),
    ...overrides,
  };
  render(
    <main>
      <SkillSettings {...props} />
    </main>
  );
  return props;
}

it('parses only valid persisted config and applies safe defaults', () => {
  expect(getSkillsConfig(null).sources).toEqual([]);
  expect(
    getSkillsConfig({
      skills: {
        sources: [
          { type: 'git', url: 'https://github.com/good/repo', enabled: true },
          { type: 'local', url: 'relative/legacy', enabled: true },
          null,
        ],
        disabledSkills: ['valid', 42],
        maxSkillSizeBytes: Number.NaN,
        maxTotalSkillSizeBytes: -1,
      },
    })
  ).toEqual({
    sources: [{ type: 'git', url: 'https://github.com/good/repo', enabled: true }],
    disabledSkills: [],
    maxSkillSizeBytes: 50 * 1024,
    maxTotalSkillSizeBytes: 200 * 1024,
  });
});

it('renders browser defaults with labeled controls and no axe violations', async () => {
  const checkPathExists = vi.fn().mockResolvedValue(true);
  renderSettings({ checkPathExists });
  expect(screen.getByText('Suggested Skill Repositories')).toBeTruthy();
  expect(screen.getAllByText(/GitHub repositories to load skills from/).length).toBeGreaterThan(0);
  expect(screen.queryByText('Detected Skill Directories')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Add Repository' }));
  expect(screen.getByText('Git only')).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Enable Kubeshark' })).toBeTruthy();
  expect(screen.getByText('0 sources configured, 0 enabled.')).toBeTruthy();
  expect(checkPathExists).not.toHaveBeenCalled();
  await expect(runAxe()).resolves.toEqual([]);
});

it('keeps same-repository sources with different paths distinct', () => {
  const url = 'https://github.com/example/shared';
  const store = createMemoryConfigStore({
    skills: {
      ...configuredSkills,
      sources: [
        { type: 'git', url, path: 'first', enabled: true },
        { type: 'git', url, path: 'second', enabled: false },
      ],
    },
  });
  renderSettings({ configStore: store });
  expect(screen.getAllByText(url)).toHaveLength(2);
  expect(screen.getAllByText(/first|second/)).toHaveLength(2);
  fireEvent.click(screen.getByRole('checkbox', { name: `Enable ${url} (second)` }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(getSkillsConfig(store.data()).sources).toEqual([
    { type: 'git', url, path: 'first', enabled: true },
    { type: 'git', url, path: 'second', enabled: true },
  ]);
});

it('immediately persists suggested repos and scopes the viewer load', async () => {
  const store = createMemoryConfigStore({ retained: true });
  const loadSkills = vi.fn().mockResolvedValue([]);
  const onConfigChange = vi.fn();
  renderSettings({ configStore: store, loadSkills, onConfigChange });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable Kubeshark' }));
  expect(onConfigChange).toHaveBeenCalledWith(
    expect.objectContaining({
      sources: [expect.objectContaining({ url: 'https://github.com/kubeshark/kubeshark' })],
    })
  );
  expect(store.data().retained).toBe(true);
  expect(screen.getByRole('dialog', { name: 'Skills viewer' })).toBeTruthy();
  expect(screen.getAllByText('Kubeshark')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Load viewer skills' }));
  await waitFor(() =>
    expect(loadSkills).toHaveBeenCalledWith(
      undefined,
      getSkillSourceIdentity({
        type: 'git',
        url: 'https://github.com/kubeshark/kubeshark',
        path: 'skills',
      })
    )
  );
  fireEvent.click(screen.getByRole('button', { name: 'Close viewer' }));
  fireEvent.click(screen.getByRole('button', { name: 'View Loaded Skills' }));
  expect(screen.getByText('All skills')).toBeTruthy();
});

it('disables an existing suggested repo immediately without opening the viewer', () => {
  const store = createMemoryConfigStore({
    skills: {
      ...configuredSkills,
      sources: [
        {
          type: 'git',
          url: 'https://github.com/kubeshark/kubeshark',
          path: 'skills',
          enabled: true,
        },
      ],
    },
  });
  const loadSkills = vi.fn().mockResolvedValue([]);
  renderSettings({ configStore: store, loadSkills });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable Kubeshark' }));
  expect(getSkillsConfig(store.data()).sources[0].enabled).toBe(false);
  expect(screen.queryByRole('dialog', { name: 'Skills viewer' })).toBeNull();
});

it('toggles custom sources, discards, saves, edits, adds, and deletes', async () => {
  const store = createMemoryConfigStore({ skills: configuredSkills });
  const onConfigChange = vi.fn();
  renderSettings({ configStore: store, onConfigChange });
  const sourceUrl = 'https://github.com/example/skills-repo';
  const sourceLabel = `${sourceUrl} (k8s)`;
  fireEvent.click(screen.getByRole('checkbox', { name: `Enable ${sourceLabel}` }));
  expect(screen.getByText('(Unsaved changes)')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
  expect(screen.queryByText('(Unsaved changes)')).toBeNull();

  fireEvent.click(screen.getByRole('checkbox', { name: `Enable ${sourceLabel}` }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(onConfigChange).toHaveBeenCalled();
  expect(
    getSkillsConfig(store.data()).sources.find(source => source.url === sourceUrl)?.enabled
  ).toBe(false);

  fireEvent.click(screen.getByRole('button', { name: `Edit ${sourceLabel}` }));
  fireEvent.click(screen.getByRole('button', { name: 'Save source' }));
  expect(screen.getByText(`${sourceUrl}-edited`)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

  fireEvent.click(screen.getByRole('button', { name: 'Add Repository' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save source' }));
  expect(screen.getByText('https://github.com/new/skills')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: `Edit ${sourceUrl}-edited (k8s)` }));
  fireEvent.click(screen.getByRole('button', { name: 'Save duplicate source' }));
  expect(screen.getAllByText('https://github.com/new/skills')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel editor' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add Repository' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save source' }));
  expect(screen.getAllByText('https://github.com/new/skills')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Delete https://github.com/new/skills' }));
  expect(screen.queryByText('https://github.com/new/skills')).toBeNull();
});

it('detects and toggles filesystem sources only when explicitly enabled', async () => {
  const store = createMemoryConfigStore();
  const checkPathExists = vi.fn(async path => path.includes('.github'));
  renderSettings({
    configStore: store,
    isRunningAsApp: true,
    filesystemSkillsEnabled: true,
    projectRoot: '/project',
    checkPathExists,
  });
  expect(await screen.findByText('Detected Skill Directories')).toBeTruthy();
  await waitFor(() => expect(checkPathExists).toHaveBeenCalledTimes(4));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable GitHub Copilot Skills' }));
  expect(checkPathExists).toHaveBeenCalledTimes(4);
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(getSkillsConfig(store.data()).sources).toContainEqual({
    type: 'local',
    url: '/project/.github/skills',
    enabled: true,
  });
});

it('preserves unsaved custom changes when a suggested repo is persisted', () => {
  const store = createMemoryConfigStore({ skills: configuredSkills });
  renderSettings({ configStore: store });
  const sourceUrl = 'https://github.com/example/skills-repo';
  fireEvent.click(screen.getByRole('checkbox', { name: `Enable ${sourceUrl} (k8s)` }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable Kubeshark' }));
  expect(screen.getByText('(Unsaved changes)')).toBeTruthy();
  const persisted = getSkillsConfig(store.data());
  expect(persisted.sources.find(source => source.url === sourceUrl)?.enabled).toBe(true);
  expect(
    persisted.sources.find(source => source.url === 'https://github.com/kubeshark/kubeshark')
      ?.enabled
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(
    getSkillsConfig(store.data()).sources.find(source => source.url === sourceUrl)?.enabled
  ).toBe(false);
});

it('ignores stale path detection after project changes', async () => {
  let resolveOld: (value: boolean) => void = () => {};
  const oldResult = new Promise<boolean>(resolve => {
    resolveOld = resolve;
  });
  const checkPathExists = vi.fn(path =>
    path.startsWith('/old') ? oldResult : Promise.resolve(false)
  );
  const props = {
    configStore: createMemoryConfigStore(),
    isRunningAsApp: true,
    filesystemSkillsEnabled: true,
    checkPathExists,
  };
  const { rerender } = render(<SkillSettings {...props} projectRoot="/old" />);
  rerender(<SkillSettings {...props} projectRoot="/new" />);
  await waitFor(() => expect(checkPathExists).toHaveBeenCalledWith('/new/.github/skills'));
  resolveOld(true);
  await waitFor(() => expect(screen.getAllByText('Not found')).toHaveLength(4));
});

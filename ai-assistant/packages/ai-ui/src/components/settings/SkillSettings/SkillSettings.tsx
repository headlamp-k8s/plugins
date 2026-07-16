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

/**
 * Settings UI for configuring AI skill sources.
 *
 * Supports filesystem paths and GitHub repository sources, with automatic
 * detection of well-known skill directories (`.github/skills`,
 * `.github/instructions`, `.claude/skills`, `skills/`). Each source can be
 * toggled on/off and edited. Detection status is shown for well-known paths.
 *
 * Framework-agnostic: uses slot props for Dialog and SectionWrapper so it
 * works with headlamp-plugin components or plain MUI fallbacks.
 */

import {
  getSkillsConfig,
  getSkillSourceIdentity,
  type SkillsConfig,
} from '@headlamp-k8s/ai-common/skills/config';
import type { SkillSource as SkillSourceEntry } from '@headlamp-k8s/ai-common/skills/SkillLoader';
import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultDialog, DefaultSectionWrapper } from '../../defaults/DefaultSlots/DefaultSlots';
import type { ConfigStore } from '../MCPSettings/MCPSettings';
import SkillSourceEditorDialog from '../SkillSourceEditorDialog/SkillSourceEditorDialog';
import {
  type SkillDisplayInfo,
  type SkillLoadProgress,
  SkillsViewerDialog,
} from '../SkillsViewerDialog/SkillsViewerDialog';

/** Well-known directories that may contain skills in a project. */
export const WELL_KNOWN_SKILL_DIRS = [
  {
    /** Relative path within a project directory. */
    path: '.github/skills',
    /** Human-readable label shown in the UI. */
    label: 'GitHub Copilot Skills',
    /** Tool associated with this directory. */
    tool: 'GitHub Copilot',
  },
  {
    path: '.github/instructions',
    label: 'GitHub Copilot Instructions',
    tool: 'GitHub Copilot',
  },
  {
    path: '.claude/skills',
    label: 'Claude Code Skills',
    tool: 'Claude',
  },
  {
    path: 'skills',
    label: 'Generic Skills',
    tool: 'Generic',
  },
] as const;

/** Well-known GitHub repositories that contain skill files. */
export const WELL_KNOWN_SKILL_REPOS: readonly WellKnownRepoEntry[] = [
  {
    url: 'https://github.com/kubeshark/kubeshark',
    label: 'Kubeshark',
    description: 'Network traffic analysis for Kubernetes',
    path: 'skills',
    ref: '1926067bd928c2acfc875542d6ce4e418e7e95d8', // v72.3.83
  },
  {
    url: 'https://github.com/helmfile/helmfile',
    label: 'Helmfile',
    description: 'Declarative Helm chart deployment',
    path: 'skills',
    ref: '33eadc993e0ee77de91914afd0ab00042c498232', // v1.5.2
  },
  {
    url: 'https://github.com/openshift/lightspeed-service',
    label: 'OpenShift Lightspeed',
    description: 'Kubernetes/OpenShift troubleshooting skills',
    path: 'skills',
    ref: 'f600c71426d3fdcbcfd294045fa5f7555cfb9fa1', // main (no releases)
  },
  {
    url: 'https://github.com/microsoft/azure-skills',
    label: 'Azure Skills',
    description: 'Azure service guidance (AKS, networking, etc.)',
    path: 'skills',
    ref: '02a614f6ee1f052826f834d65c61e430ad152c8e', // main (no releases)
  },
  {
    url: 'https://github.com/fluxcd/agent-skills',
    label: 'Flux Agent Skills',
    description: 'GitOps knowledge, manifest generation, cluster debugging',
    path: 'skills',
    ref: 'df7cf2c5dbb64ded73913fea775f6a9fc4f7c209', // v0.0.3
  },
  {
    url: 'https://github.com/MicrosoftDocs/Agent-Skills',
    label: 'Azure Cloud Development',
    description: 'Azure cloud development skills from Microsoft Docs',
    path: 'skills',
    ref: 'aab6d7889eadd5e90ff685c486a8ca1ee24c0f5f', // main (no releases)
  },
  {
    url: 'https://github.com/kubernetes/website',
    label: 'Kubernetes Docs',
    description: 'Official Kubernetes documentation (subset)',
    path: 'content/en/docs',
    ref: '02ab95c97025ac048aa7979313b6800925dbbbd3', // snapshot-initial-v1.36
  },
] as const;

/** A well-known GitHub repository that contains skill files. */
export interface WellKnownRepoEntry {
  /** HTTPS URL of the GitHub repository. */
  url: string;
  /** Human-readable label for the repository. */
  label: string;
  /** Short description of what skills the repo provides. */
  description: string;
  /** Subdirectory within the repo containing skills. */
  path?: string;
  /** Git ref (branch/tag/SHA) to use. */
  ref?: string;
}

export type { SkillsConfig } from '@headlamp-k8s/ai-common/skills/config';
export type { SkillSource as SkillSourceEntry } from '@headlamp-k8s/ai-common/skills/SkillLoader';

/** Detection status of a well-known skill directory. */
export interface WellKnownPathStatus {
  /** Relative path within the project. */
  path: string;
  /** Human-readable label. */
  label: string;
  /** Associated tool name. */
  tool: string;
  /** Whether the path was found on the filesystem. */
  detected: boolean;
  /** Whether the user has enabled this path as a source. */
  enabled: boolean;
}

/** Props for the SkillSettings component. */
export interface SkillSettingsProps {
  /** Plugin config store for reading/writing settings. */
  configStore: ConfigStore;
  /**
   * Async function that checks whether a filesystem path exists.
   * Receives an absolute path when `projectRoot` is set, otherwise a relative path.
   * When not provided, all well-known paths show as "unknown" status.
   */
  checkPathExists?: (path: string) => Promise<boolean>;
  /**
   * Base project directory used to resolve well-known skill paths.
   * Well-known paths are resolved relative to this directory.
   */
  projectRoot?: string;
  /**
   * Whether the app is running in desktop/Electron mode.
   * When false (browser mode), file-based skill settings (detected directories
   * and custom filesystem sources) are hidden since local paths are not accessible.
   */
  isRunningAsApp?: boolean;
  /** Enables filesystem source controls when desktop path APIs are available. */
  filesystemSkillsEnabled?: boolean;
  /** Optional wrapper component for layout (e.g. SectionBox). */
  SectionWrapper?: React.ComponentType<{ title: string; children: React.ReactNode }>;
  /** Component used to render dialog shells. Falls back to MUI Dialog. */
  DialogSlot?: React.ElementType;
  /** Callback when skills configuration changes. */
  onConfigChange?: (config: SkillsConfig) => void;
  /**
   * Async function that loads all skills and returns them for display.
   * When provided, a "View Loaded Skills" button is shown.
   */
  loadSkills?: (
    onProgress?: (progress: SkillLoadProgress) => void,
    sourceIdentity?: string
  ) => Promise<SkillDisplayInfo[]>;
  /** Callback fired when skill loading completes (for notifications). */
  onSkillsLoadComplete?: (result: { count: number; error?: string }) => void;
}

/** @returns Whether an untrusted value is a non-null object mapping. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export { getSkillsConfig } from '@headlamp-k8s/ai-common/skills/config';

/**
 * Adds or updates one well-known Git repository with an explicit enabled state.
 *
 * @param sources - Current persisted or pending source list.
 * @param repo - Well-known repository to update.
 * @param enabled - Desired enabled state.
 * @returns A new source list preserving unrelated entries.
 */
function setRepoEnabled(
  sources: SkillSourceEntry[],
  repo: WellKnownRepoEntry,
  enabled: boolean
): SkillSourceEntry[] {
  const repoIdentity = getSkillSourceIdentity({ type: 'git', url: repo.url, path: repo.path });
  const existing = sources.some(source => getSkillSourceIdentity(source) === repoIdentity);
  if (existing) {
    return sources.map(source =>
      getSkillSourceIdentity(source) === repoIdentity ? { ...source, enabled } : source
    );
  }
  return [
    ...sources,
    {
      type: 'git',
      url: repo.url,
      ref: repo.ref || 'main',
      path: repo.path,
      enabled,
    },
  ];
}

/**
 * Settings UI for configuring AI skill sources.
 *
 * Shows well-known skill paths with auto-detection, custom filesystem
 * sources, and GitHub repository sources. Each source can be toggled,
 * edited, or removed.
 */
export function SkillSettings({
  configStore,
  checkPathExists,
  projectRoot,
  isRunningAsApp = false,
  filesystemSkillsEnabled = false,
  SectionWrapper = DefaultSectionWrapper,
  DialogSlot = DefaultDialog,
  onConfigChange,
  loadSkills,
  onSkillsLoadComplete,
}: SkillSettingsProps) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SkillsConfig>(() => {
    const data = configStore.get();
    return getSkillsConfig(data);
  });
  const [pendingConfig, setPendingConfig] = useState<SkillsConfig | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wellKnownStatuses, setWellKnownStatuses] = useState<WellKnownPathStatus[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<SkillSourceEntry | undefined>(undefined);
  const [viewerOpen, setViewerOpen] = useState(false);
  /** When non-null, the viewer is scoped to a single repo download. */
  const [activeRepoIdentity, setActiveRepoIdentity] = useState<string | null>(null);
  const detectionRequestId = React.useRef(0);

  const displayConfig = pendingConfig || config;

  const persistConfig = useCallback(
    (newConfig: SkillsConfig) => {
      const storedData = configStore.get();
      const currentData = isRecord(storedData) ? storedData : {};
      configStore.update({
        ...currentData,
        skills: {
          sources: newConfig.sources,
          disabledSkills: newConfig.disabledSkills,
          maxSkillSizeBytes: newConfig.maxSkillSizeBytes,
          maxTotalSkillSizeBytes: newConfig.maxTotalSkillSizeBytes,
        },
      });
      const saved = getSkillsConfig(configStore.get());
      onConfigChange?.(saved);
      return saved;
    },
    [configStore, onConfigChange]
  );

  // Load config from store on mount
  useEffect(() => {
    const data = configStore.get();
    const loaded = getSkillsConfig(data);
    setConfig(loaded);
    setPendingConfig(loaded);
  }, [configStore]);

  const detectWellKnownPaths = useCallback(
    async (requestId: number) => {
      const statuses: WellKnownPathStatus[] = await Promise.all(
        WELL_KNOWN_SKILL_DIRS.map(async dir => {
          const fullPath = projectRoot ? `${projectRoot}/${dir.path}` : dir.path;
          let detected = false;
          if (checkPathExists) {
            try {
              detected = await checkPathExists(fullPath);
            } catch {
              detected = false;
            }
          }
          return {
            path: dir.path,
            label: dir.label,
            tool: dir.tool,
            detected,
            enabled: false,
          };
        })
      );
      if (detectionRequestId.current === requestId) {
        setWellKnownStatuses(statuses);
      }
    },
    [checkPathExists, projectRoot]
  );

  // Detect well-known paths
  useEffect(() => {
    const requestId = ++detectionRequestId.current;
    if (!isRunningAsApp || !filesystemSkillsEnabled || !projectRoot) {
      setWellKnownStatuses([]);
      return () => {
        if (detectionRequestId.current === requestId) detectionRequestId.current += 1;
      };
    }
    void detectWellKnownPaths(requestId);
    return () => {
      if (detectionRequestId.current === requestId) {
        detectionRequestId.current += 1;
      }
    };
  }, [detectWellKnownPaths, filesystemSkillsEnabled, isRunningAsApp]);

  const updatePendingConfig = useCallback(
    (newConfig: SkillsConfig) => {
      setPendingConfig(newConfig);
      setHasUnsavedChanges(true);
    },
    [setPendingConfig, setHasUnsavedChanges]
  );

  const handleSaveChanges = useCallback(() => {
    if (!pendingConfig) return;
    const storedData = configStore.get();
    const currentData = isRecord(storedData) ? storedData : {};
    configStore.update({
      ...currentData,
      skills: {
        sources: pendingConfig.sources,
        disabledSkills: pendingConfig.disabledSkills,
        maxSkillSizeBytes: pendingConfig.maxSkillSizeBytes,
        maxTotalSkillSizeBytes: pendingConfig.maxTotalSkillSizeBytes,
      },
    });
    const updated = configStore.get();
    const savedConfig = getSkillsConfig(updated);
    setConfig(savedConfig);
    setPendingConfig(savedConfig);
    setHasUnsavedChanges(false);
    onConfigChange?.(savedConfig);
  }, [pendingConfig, configStore, onConfigChange]);

  const handleDiscardChanges = useCallback(() => {
    setPendingConfig(config);
    setHasUnsavedChanges(false);
  }, [config]);

  const handleToggleWellKnownPath = useCallback(
    (dirPath: string) => {
      const fullPath = projectRoot ? `${projectRoot}/${dirPath}` : dirPath;
      const existingIndex = displayConfig.sources.findIndex(
        s => s.type === 'local' && (s.url === fullPath || s.url === dirPath)
      );

      let newSources: SkillSourceEntry[];
      if (existingIndex >= 0) {
        // Toggle existing source
        newSources = displayConfig.sources.map((s, i) =>
          i === existingIndex ? { ...s, enabled: !s.enabled } : s
        );
      } else {
        // Add new source (enabled by default)
        newSources = [
          ...displayConfig.sources,
          { type: 'local' as const, url: fullPath, enabled: true },
        ];
      }
      updatePendingConfig({ ...displayConfig, sources: newSources });
    },
    [displayConfig, projectRoot, updatePendingConfig]
  );

  const handleToggleWellKnownRepo = useCallback(
    (repo: WellKnownRepoEntry) => {
      const repoIdentity = getSkillSourceIdentity({ type: 'git', url: repo.url, path: repo.path });
      const enabling = !displayConfig.sources.some(
        source => getSkillSourceIdentity(source) === repoIdentity && source.enabled
      );
      const saved = persistConfig({
        ...config,
        sources: setRepoEnabled(config.sources, repo, enabling),
      });
      setConfig(saved);
      if (hasUnsavedChanges && pendingConfig) {
        setPendingConfig({
          ...pendingConfig,
          sources: setRepoEnabled(pendingConfig.sources, repo, enabling),
        });
      } else {
        setPendingConfig(saved);
        setHasUnsavedChanges(false);
      }

      // Open viewer to show download progress when enabling
      if (enabling && loadSkills) {
        setActiveRepoIdentity(
          getSkillSourceIdentity({ type: 'git', url: repo.url, path: repo.path })
        );
        setViewerOpen(true);
      }
    },
    [config, displayConfig.sources, hasUnsavedChanges, loadSkills, pendingConfig, persistConfig]
  );

  const handleToggleSource = useCallback(
    (index: number) => {
      const newSources = displayConfig.sources.map((s, i) =>
        i === index ? { ...s, enabled: !s.enabled } : s
      );
      updatePendingConfig({ ...displayConfig, sources: newSources });
    },
    [displayConfig, updatePendingConfig]
  );

  const handleDeleteSource = useCallback(
    (index: number) => {
      const newSources = displayConfig.sources.filter((_, i) => i !== index);
      updatePendingConfig({ ...displayConfig, sources: newSources });
    },
    [displayConfig, updatePendingConfig]
  );

  const handleOpenEditor = useCallback(
    (source?: SkillSourceEntry) => {
      setEditingSource(source);
      setEditorOpen(true);
    },
    [setEditingSource, setEditorOpen]
  );

  const handleCloseEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingSource(undefined);
  }, [setEditorOpen, setEditingSource]);

  const handleSaveSource = useCallback(
    (source: SkillSourceEntry) => {
      let newSources: SkillSourceEntry[];
      if (editingSource?.url) {
        const editingIdentity = getSkillSourceIdentity(editingSource);
        const sourceIdentity = getSkillSourceIdentity(source);
        const duplicate = displayConfig.sources.some(
          existing =>
            getSkillSourceIdentity(existing) !== editingIdentity &&
            getSkillSourceIdentity(existing) === sourceIdentity
        );
        if (duplicate) return;
        // Find only the source being edited by its complete canonical identity.
        newSources = displayConfig.sources.map(s =>
          getSkillSourceIdentity(s) === editingIdentity ? source : s
        );
      } else {
        const sourceIdentity = getSkillSourceIdentity(source);
        const exists = displayConfig.sources.some(
          s => getSkillSourceIdentity(s) === sourceIdentity
        );
        if (exists) {
          return; // Don't add duplicates
        }
        newSources = [...displayConfig.sources, source];
      }
      updatePendingConfig({ ...displayConfig, sources: newSources });
      handleCloseEditor();
    },
    [editingSource, displayConfig, updatePendingConfig, handleCloseEditor]
  );

  // Separate sources by type for display
  const localSources = displayConfig.sources
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter(s => s.type === 'local');
  const gitSources = displayConfig.sources
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter(s => s.type === 'git');

  // Identify which local sources are well-known
  const wellKnownPaths = new Set<string>(
    WELL_KNOWN_SKILL_DIRS.map(d => (projectRoot ? `${projectRoot}/${d.path}` : d.path))
  );
  const wellKnownRelativePaths = new Set<string>(WELL_KNOWN_SKILL_DIRS.map(d => d.path));
  const customLocalSources = localSources.filter(
    s => !wellKnownPaths.has(s.url) && !wellKnownRelativePaths.has(s.url)
  );

  // Identify which git sources are well-known repos
  const wellKnownRepoIdentities = new Set(
    WELL_KNOWN_SKILL_REPOS.map(repo =>
      getSkillSourceIdentity({ type: 'git', url: repo.url, path: repo.path })
    )
  );
  const customGitSources = gitSources.filter(
    source => !wellKnownRepoIdentities.has(getSkillSourceIdentity(source))
  );
  const displayedWellKnownStatuses = wellKnownStatuses.map(status => {
    const fullPath = projectRoot ? `${projectRoot}/${status.path}` : status.path;
    return {
      ...status,
      enabled: displayConfig.sources.some(
        source =>
          source.type === 'local' &&
          (source.url === fullPath || source.url === status.path) &&
          source.enabled
      ),
    };
  });

  return (
    <SectionWrapper title={t('Skills')}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {t(
            filesystemSkillsEnabled && projectRoot
              ? 'Skills are markdown files that provide domain-specific knowledge to the AI assistant. Configure filesystem paths and GitHub repositories to load skills from.'
              : 'Skills are markdown files that provide domain-specific knowledge to the AI assistant. Configure GitHub repositories to load skills from.'
          )}
        </Typography>
      </Box>

      {/* Well-Known Paths Section — only shown in app mode (local paths not accessible in browser) */}
      {isRunningAsApp && filesystemSkillsEnabled && projectRoot && (
        <Box sx={{ mb: 3 }}>
          <Typography component="h3" variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            {t('Detected Skill Directories')}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {t(
              'Well-known skill directories from Claude, GitHub Copilot, and other tools. Detected directories can be enabled to load skills from.'
            )}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('Directory')}</TableCell>
                  <TableCell>{t('Tool')}</TableCell>
                  <TableCell align="center">{t('Status')}</TableCell>
                  <TableCell align="center">{t('Enabled')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedWellKnownStatuses.map(status => (
                  <TableRow key={status.path}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {t(status.label)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {status.path}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={t(status.tool)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      {checkPathExists ? (
                        status.detected ? (
                          <Tooltip title={t('Directory found')}>
                            <Chip
                              icon={<Icon aria-hidden icon="mdi:check-circle" />}
                              label={t('Detected')}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title={t('Directory not found')}>
                            <Chip
                              icon={<Icon aria-hidden icon="mdi:close-circle" />}
                              label={t('Not found')}
                              size="small"
                              color="default"
                              variant="outlined"
                            />
                          </Tooltip>
                        )
                      ) : (
                        <Tooltip title={t('Path detection unavailable')}>
                          <Chip
                            icon={<Icon aria-hidden icon="mdi:help-circle" />}
                            label={t('Unknown')}
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={status.enabled}
                        onChange={() => handleToggleWellKnownPath(status.path)}
                        size="small"
                        inputProps={{
                          'aria-label': t('Enable {{label}}', { label: status.label }),
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Suggested GitHub Repositories */}
      <Box sx={{ mb: 3 }}>
        <Typography component="h3" variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          {t('Suggested Skill Repositories')}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {t(
            'Well-known open-source repositories containing Kubernetes skill files. Enable a repository to load its skills through the GitHub API.'
          )}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('Repository')}</TableCell>
                <TableCell>{t('Description')}</TableCell>
                <TableCell align="center">{t('Enabled')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {WELL_KNOWN_SKILL_REPOS.map(repo => {
                const isEnabled = displayConfig.sources.some(
                  source =>
                    getSkillSourceIdentity(source) ===
                      getSkillSourceIdentity({ type: 'git', url: repo.url, path: repo.path }) &&
                    source.enabled
                );
                return (
                  <TableRow key={repo.url}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {t(repo.label)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {repo.url}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {t(repo.description)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={isEnabled}
                        onChange={() => handleToggleWellKnownRepo(repo)}
                        size="small"
                        inputProps={{
                          'aria-label': t('Enable {{label}}', { label: repo.label }),
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Custom Filesystem Sources — only shown in app mode */}
      {isRunningAsApp && filesystemSkillsEnabled && projectRoot && (
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('Filesystem Sources')}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleOpenEditor({ type: 'local', url: '', enabled: true })}
              startIcon={<Icon icon="mdi:folder-plus" />}
            >
              {t('Add Path')}
            </Button>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {t('Custom filesystem directories to scan for skill files.')}
          </Typography>
          {customLocalSources.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Path')}</TableCell>
                    <TableCell align="center">{t('Enabled')}</TableCell>
                    <TableCell align="right">{t('Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customLocalSources.map(source => (
                    <TableRow key={getSkillSourceIdentity(source)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {source.url}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={source.enabled}
                          onChange={() => handleToggleSource(source.originalIndex)}
                          size="small"
                          inputProps={{
                            'aria-label': t('Enable {{source}}', { source: source.url }),
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('Edit')}>
                          <IconButton
                            aria-label={t('Edit {{source}}', { source: source.url })}
                            size="small"
                            onClick={() => handleOpenEditor(source)}
                          >
                            <Icon icon="mdi:pencil" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('Delete')}>
                          <IconButton
                            aria-label={t('Delete {{source}}', { source: source.url })}
                            size="small"
                            onClick={() => handleDeleteSource(source.originalIndex)}
                            color="error"
                          >
                            <Icon icon="mdi:delete" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {t('No custom filesystem sources configured.')}
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* GitHub Repository Sources */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t('Custom GitHub Repository Sources')}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleOpenEditor({ type: 'git', url: '', enabled: true })}
            startIcon={<Icon icon="mdi:github" />}
          >
            {t('Add Repository')}
          </Button>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {t('Additional GitHub repositories to load skills from through the GitHub API.')}
        </Typography>
        {customGitSources.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('Repository')}</TableCell>
                  <TableCell>{t('Ref')}</TableCell>
                  <TableCell>{t('Path')}</TableCell>
                  <TableCell align="center">{t('Enabled')}</TableCell>
                  <TableCell align="right">{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customGitSources.map(source => (
                  <TableRow key={getSkillSourceIdentity(source)}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                      >
                        {source.url}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {source.ref || 'main'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {source.path || '/'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={source.enabled}
                        onChange={() => handleToggleSource(source.originalIndex)}
                        size="small"
                        inputProps={{
                          'aria-label': t('Enable {{source}}', {
                            source: source.path ? `${source.url} (${source.path})` : source.url,
                          }),
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('Edit')}>
                        <IconButton
                          aria-label={t('Edit {{source}}', {
                            source: source.path ? `${source.url} (${source.path})` : source.url,
                          })}
                          size="small"
                          onClick={() => handleOpenEditor(source)}
                        >
                          <Icon icon="mdi:pencil" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('Delete')}>
                        <IconButton
                          aria-label={t('Delete {{source}}', {
                            source: source.path ? `${source.url} (${source.path})` : source.url,
                          })}
                          size="small"
                          onClick={() => handleDeleteSource(source.originalIndex)}
                          color="error"
                        >
                          <Icon icon="mdi:delete" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              {t('No custom GitHub repository sources configured.')}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Summary / Unsaved Changes */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="textSecondary">
            {displayConfig.sources.length === 1
              ? t('1 source configured, {{enabledCount}} enabled.', {
                  enabledCount: displayConfig.sources.filter(source => source.enabled).length,
                })
              : t('{{count}} sources configured, {{enabledCount}} enabled.', {
                  count: displayConfig.sources.length,
                  enabledCount: displayConfig.sources.filter(source => source.enabled).length,
                })}
            {hasUnsavedChanges && (
              <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                {t('(Unsaved changes)')}
              </Typography>
            )}
          </Typography>
          {loadSkills && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setViewerOpen(true)}
              startIcon={<Icon icon="mdi:book-open-variant" />}
            >
              {t('View Loaded Skills')}
            </Button>
          )}
        </Box>
        {hasUnsavedChanges && (
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              variant="outlined"
              onClick={handleDiscardChanges}
              startIcon={<Icon icon="mdi:cancel" />}
              size="small"
            >
              {t('Discard')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveChanges}
              startIcon={<Icon icon="mdi:content-save" />}
              color="primary"
              size="small"
            >
              {t('Save Changes')}
            </Button>
          </Box>
        )}
      </Box>

      {/* Source Editor Dialog */}
      <SkillSourceEditorDialog
        open={editorOpen}
        onClose={handleCloseEditor}
        source={editingSource}
        onSave={handleSaveSource}
        existingSources={displayConfig.sources}
        allowLocalSources={isRunningAsApp && filesystemSkillsEnabled && Boolean(projectRoot)}
        DialogSlot={DialogSlot}
      />

      {/* Skills Viewer Dialog — general "view all" or per-repo download view */}
      {loadSkills && (
        <SkillsViewerDialog
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setActiveRepoIdentity(null);
          }}
          loadSkills={onProgress => {
            // Pass source identity so the host loads only this exact URL/path pair.
            // the progress bar from resetting between multiple enabled sources
            if (activeRepoIdentity) {
              return loadSkills(onProgress, activeRepoIdentity);
            }
            return loadSkills(onProgress);
          }}
          title={
            activeRepoIdentity
              ? WELL_KNOWN_SKILL_REPOS.find(
                  repo =>
                    getSkillSourceIdentity({ type: 'git', url: repo.url, path: repo.path }) ===
                    activeRepoIdentity
                )?.label ?? activeRepoIdentity
              : undefined
          }
          DialogSlot={DialogSlot}
          onLoadComplete={onSkillsLoadComplete}
        />
      )}
    </SectionWrapper>
  );
}

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

/**
 * Set to false to hide filesystem-based skill settings (detected directories
 * and custom local-path sources). Flip to true once checkPathExists / projectRoot
 * are wired up in Settings.tsx so path detection actually works.
 */
const FILESYSTEM_SKILLS_ENABLED = false;

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

/** Configuration for a single skill source. */
export interface SkillSourceEntry {
  /** Type of source: local filesystem or Git repository. */
  type: 'local' | 'git';
  /** Filesystem path or Git URL. */
  url: string;
  /** Git ref (branch, tag, or SHA). Only for git sources. */
  ref?: string;
  /** Optional subdirectory within the source. */
  path?: string;
  /** Whether this source is active. */
  enabled: boolean;
  /** SHA-256 integrity hash for remote sources. */
  sha256?: string;
}

/** Persisted skills configuration. */
export interface SkillsConfig {
  /** Configured skill sources. */
  sources: SkillSourceEntry[];
  /** Names of individually disabled skills. */
  disabledSkills: string[];
  /** Maximum content size per skill in bytes. */
  maxSkillSizeBytes: number;
  /** Maximum total skill content in bytes. */
  maxTotalSkillSizeBytes: number;
}

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
   * Receives an absolute path and returns true if it exists.
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
    sourceUrl?: string
  ) => Promise<SkillDisplayInfo[]>;
  /** Callback fired when skill loading completes (for notifications). */
  onSkillsLoadComplete?: (result: { count: number; error?: string }) => void;
}

/** Default skills configuration. */
const DEFAULT_SKILLS_CONFIG: SkillsConfig = {
  sources: [],
  disabledSkills: [],
  maxSkillSizeBytes: 50 * 1024,
  maxTotalSkillSizeBytes: 200 * 1024,
};

/**
 * Reads skills configuration from raw plugin data.
 *
 * @param data - Raw plugin data store object.
 * @returns Stored skills config or defaults.
 */
function getSkillsConfig(data: any): SkillsConfig {
  if (!data?.skills) {
    return { ...DEFAULT_SKILLS_CONFIG };
  }
  const stored = data.skills;
  return {
    sources: Array.isArray(stored.sources) ? stored.sources : [],
    disabledSkills: Array.isArray(stored.disabledSkills) ? stored.disabledSkills : [],
    maxSkillSizeBytes:
      typeof stored.maxSkillSizeBytes === 'number'
        ? stored.maxSkillSizeBytes
        : DEFAULT_SKILLS_CONFIG.maxSkillSizeBytes,
    maxTotalSkillSizeBytes:
      typeof stored.maxTotalSkillSizeBytes === 'number'
        ? stored.maxTotalSkillSizeBytes
        : DEFAULT_SKILLS_CONFIG.maxTotalSkillSizeBytes,
  };
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
  const [activeRepoUrl, setActiveRepoUrl] = useState<string | null>(null);

  const displayConfig = pendingConfig || config;

  /** Immediately persist a config without going through the pending/unsaved state. */
  const saveConfigNow = useCallback(
    (newConfig: SkillsConfig) => {
      const currentData = configStore.get() || {};
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
      setConfig(saved);
      setPendingConfig(saved);
      setHasUnsavedChanges(false);
      onConfigChange?.(saved);
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

  // Detect well-known paths
  useEffect(() => {
    detectWellKnownPaths();
  }, [checkPathExists, projectRoot, displayConfig.sources]);

  const detectWellKnownPaths = useCallback(async () => {
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
        const isEnabled = displayConfig.sources.some(
          s => s.type === 'local' && (s.url === fullPath || s.url === dir.path) && s.enabled
        );
        return {
          path: dir.path,
          label: dir.label,
          tool: dir.tool,
          detected,
          enabled: isEnabled,
        };
      })
    );
    setWellKnownStatuses(statuses);
  }, [checkPathExists, projectRoot, displayConfig.sources]);

  const updatePendingConfig = useCallback(
    (newConfig: SkillsConfig) => {
      setPendingConfig(newConfig);
      setHasUnsavedChanges(true);
    },
    [setPendingConfig, setHasUnsavedChanges]
  );

  const handleSaveChanges = useCallback(() => {
    if (!pendingConfig) return;
    const currentData = configStore.get() || {};
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
      const existingIndex = displayConfig.sources.findIndex(
        s => s.type === 'git' && s.url === repo.url
      );

      let newSources: SkillSourceEntry[];
      let enabling = false;
      if (existingIndex >= 0) {
        const wasEnabled = displayConfig.sources[existingIndex].enabled;
        enabling = !wasEnabled;
        newSources = displayConfig.sources.map((s, i) =>
          i === existingIndex ? { ...s, enabled: !s.enabled } : s
        );
      } else {
        // Adding for the first time → always enabling
        enabling = true;
        newSources = [
          ...displayConfig.sources,
          {
            type: 'git' as const,
            url: repo.url,
            ref: repo.ref || 'main',
            path: repo.path,
            enabled: true,
          },
        ];
      }

      const newConfig = { ...displayConfig, sources: newSources };
      // Save immediately — no pending state for well-known repos
      saveConfigNow(newConfig);

      // Open viewer to show download progress when enabling
      if (enabling && loadSkills) {
        setActiveRepoUrl(repo.url);
        setViewerOpen(true);
      }
    },
    [displayConfig, saveConfigNow, loadSkills]
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
      if (editingSource) {
        // Find the source being edited by matching all identifying fields
        newSources = displayConfig.sources.map(s =>
          s.type === editingSource.type && s.url === editingSource.url ? source : s
        );
      } else {
        // Check for duplicates
        const exists = displayConfig.sources.some(
          s => s.type === source.type && s.url === source.url
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
  const wellKnownRepoUrls = new Set(WELL_KNOWN_SKILL_REPOS.map(r => r.url));
  const customGitSources = gitSources.filter(s => !wellKnownRepoUrls.has(s.url));

  return (
    <SectionWrapper title={t('Skills')}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Skills are markdown files that provide domain-specific knowledge to the AI assistant.
          Configure filesystem paths and GitHub repositories to load skills from.
        </Typography>
      </Box>

      {/* Well-Known Paths Section — only shown in app mode (local paths not accessible in browser) */}
      {isRunningAsApp && FILESYSTEM_SKILLS_ENABLED && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            {t('Detected Skill Directories')}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Well-known skill directories from Claude, GitHub Copilot, and other tools. Detected
            directories can be enabled to load skills from.
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
                {wellKnownStatuses.map(status => (
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
                              icon={<Icon icon="mdi:check-circle" />}
                              label={t('Detected')}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title={t('Directory not found')}>
                            <Chip
                              icon={<Icon icon="mdi:close-circle" />}
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
                            icon={<Icon icon="mdi:help-circle" />}
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
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          {t('Suggested Skill Repositories')}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Well-known open-source repositories containing Kubernetes skill files. Enable a repository
          to download its skills via GitHub zip archive.
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
                  s => s.type === 'git' && s.url === repo.url && s.enabled
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
      {isRunningAsApp && FILESYSTEM_SKILLS_ENABLED && (
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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
                    <TableRow key={source.originalIndex}>
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
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('Edit')}>
                          <IconButton size="small" onClick={() => handleOpenEditor(source)}>
                            <Icon icon="mdi:pencil" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('Delete')}>
                          <IconButton
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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
          {t('Additional GitHub repositories to download skills from via zip archive.')}
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
                  <TableRow key={source.originalIndex}>
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
                        {source.ref || t('main')}
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
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('Edit')}>
                        <IconButton size="small" onClick={() => handleOpenEditor(source)}>
                          <Icon icon="mdi:pencil" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('Delete')}>
                        <IconButton
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
              No custom GitHub repository sources configured.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Summary / Unsaved Changes */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="textSecondary">
            {displayConfig.sources.length} source(s) configured,{' '}
            {displayConfig.sources.filter(s => s.enabled).length} enabled.
            {hasUnsavedChanges && (
              <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                (Unsaved changes)
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
              Discard
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveChanges}
              startIcon={<Icon icon="mdi:content-save" />}
              color="primary"
              size="small"
            >
              Save Changes
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
        existingUrls={displayConfig.sources.map(s => s.url)}
        DialogSlot={DialogSlot}
      />

      {/* Skills Viewer Dialog — general "view all" or per-repo download view */}
      {loadSkills && (
        <SkillsViewerDialog
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setActiveRepoUrl(null);
          }}
          loadSkills={onProgress => {
            // Pass sourceUrl so Settings.tsx only loads that one repo — prevents
            // the progress bar from resetting between multiple enabled sources
            if (activeRepoUrl) {
              return loadSkills(onProgress, activeRepoUrl);
            }
            return loadSkills(onProgress);
          }}
          title={
            activeRepoUrl
              ? WELL_KNOWN_SKILL_REPOS.find(r => r.url === activeRepoUrl)?.label ?? activeRepoUrl
              : undefined
          }
          DialogSlot={DialogSlot}
          onLoadComplete={onSkillsLoadComplete}
        />
      )}
    </SectionWrapper>
  );
}

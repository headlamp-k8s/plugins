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
 * Dialog for viewing loaded AI skills (from filesystem and GitHub sources).
 *
 * Skills are grouped by source repository and rendered with proper markdown.
 */

import { Icon } from '@iconify/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DefaultDialog } from '../../defaults/DefaultSlots/DefaultSlots';

/** Minimal shape of a parsed skill for display. */
export interface SkillDisplayInfo {
  name: string;
  description: string;
  source: string;
  content: string;
  contentSizeBytes: number;
  version?: string;
  author?: string;
  tags?: string[];
}

/** Progress info from skill loading (mirrors SkillLoadProgress in SkillLoader.ts). */
export interface SkillLoadProgress {
  phase: 'downloading' | 'extracting' | 'done';
  bytesDownloaded: number;
  totalBytes: number;
  filesFound: number;
  /** Total files to fetch (Trees-API path; 0 if unknown). */
  totalFiles: number;
}

export interface SkillsViewerDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Async function that loads skills and returns them for display.
   * Receives an optional onProgress callback for real-time download/extract progress.
   */
  loadSkills: (onProgress?: (progress: SkillLoadProgress) => void) => Promise<SkillDisplayInfo[]>;
  /** Component used to render dialog shells. */
  DialogSlot?: React.ElementType;
  /** Callback fired when loading completes (with count or error). */
  onLoadComplete?: (result: { count: number; error?: string }) => void;
  /** Optional title override (e.g. the repo name being downloaded). */
  title?: string;
}

/** Formats a byte count for compact display. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Parse a skill source string into a group label and short path.
 * e.g. "https://github.com/microsoft/azure-skills@abc123/some-skill/SKILL.md"
 *   -> { group: "microsoft/azure-skills", path: "some-skill/SKILL.md" }
 * Falls back to the raw source if it can't be parsed.
 */
export function parseSource(source: string): { group: string; path: string } {
  const ghMatch = source.match(/^https?:\/\/github\.com\/([^/@]+\/[^/@]+)(?:@[^/]+)?\/(.+)$/);
  if (ghMatch) {
    return { group: ghMatch[1], path: ghMatch[2] };
  }
  const lastSlash = source.lastIndexOf('/');
  if (lastSlash > 0) {
    const dir = source.substring(0, lastSlash);
    const dirName = dir.substring(dir.lastIndexOf('/') + 1);
    return { group: dirName || source, path: source.substring(lastSlash + 1) };
  }
  return { group: 'Local', path: source };
}

interface SkillGroup {
  label: string;
  skills: SkillDisplayInfo[];
  totalSize: number;
}

/** Groups skills by source and sorts groups and skills by name. */
export function groupSkills(skills: SkillDisplayInfo[]): SkillGroup[] {
  const map = new Map<string, SkillDisplayInfo[]>();
  for (const skill of skills) {
    const { group } = parseSource(skill.source);
    const groupedSkills = map.get(group) ?? [];
    groupedSkills.push(skill);
    map.set(group, groupedSkills);
  }
  const groups: SkillGroup[] = [];
  for (const [label, groupedSkills] of map) {
    groups.push({
      label,
      skills: groupedSkills.sort((a, b) => a.name.localeCompare(b.name)),
      totalSize: groupedSkills.reduce((sum, skill) => sum + skill.contentSizeBytes, 0),
    });
  }
  return groups.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Resolves a relative URL from skill markdown to a GitHub blob URL.
 * Absolute safe URLs are preserved and unsafe schemes are replaced with an anchor.
 */
export function resolveRelativeUrl(href: string, skillSource: string): string {
  if (/^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) {
    return href;
  }
  if (href.startsWith('//')) return `https:${href}`;
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) return '#';

  const ghMatch = skillSource.match(/^https?:\/\/github\.com\/([^/@]+\/[^/@]+)@([^/]+)\/(.+)$/);
  if (!ghMatch) return href;

  const [, ownerRepo, ref, filePath] = ghMatch;
  if (href.startsWith('/')) {
    const repositoryPath = href.slice(1);
    return `https://github.com/${ownerRepo}/blob/${ref}/${repositoryPath}`;
  }
  const lastSlash = filePath.lastIndexOf('/');
  const dir = lastSlash >= 0 ? filePath.substring(0, lastSlash) : '';
  const resolved = dir ? `${dir}/${href}` : href;
  return `https://github.com/${ownerRepo}/blob/${ref}/${resolved}`;
}

/** Returns the first sentence of a description, truncated to a maximum length. */
export function shortDescription(desc: string, max = 120): string {
  const firstSentence = desc.split(/\.\s/)[0];
  const text = firstSentence.length <= max ? firstSentence : desc;
  if (text.length <= max) return text;
  return `${text.substring(0, max - 1)}…`;
}

/** Displays loaded skills grouped by source, with progress and rendered markdown. */
export function SkillsViewerDialog({
  open,
  onClose,
  loadSkills,
  DialogSlot = DefaultDialog,
  onLoadComplete,
  title,
}: SkillsViewerDialogProps) {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<SkillDisplayInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [progress, setProgress] = useState<SkillLoadProgress | null>(null);
  const pendingProgress = React.useRef<SkillLoadProgress | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const loadRequestId = React.useRef(0);
  const loadSkillsRef = React.useRef(loadSkills);
  const onLoadCompleteRef = React.useRef(onLoadComplete);
  const titleId = React.useId();
  loadSkillsRef.current = loadSkills;
  onLoadCompleteRef.current = onLoadComplete;

  const onProgressThrottled = React.useCallback((nextProgress: SkillLoadProgress) => {
    pendingProgress.current = nextProgress;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingProgress.current) {
          setProgress(pendingProgress.current);
        }
        rafRef.current = null;
      });
    }
  }, []);

  const doLoad = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setLoading(true);
    setError(null);
    setProgress({
      phase: 'downloading',
      bytesDownloaded: 0,
      totalBytes: 0,
      filesFound: 0,
      totalFiles: 0,
    });
    try {
      const loaded = await loadSkillsRef.current(onProgressThrottled);
      if (loadRequestId.current !== requestId) return;
      setProgress(null);
      setSkills(loaded);
      onLoadCompleteRef.current?.({ count: loaded.length });
    } catch (loadError) {
      if (loadRequestId.current !== requestId) return;
      const message = loadError instanceof Error ? loadError.message : String(loadError);
      setError(message);
      setProgress(null);
      onLoadCompleteRef.current?.({ count: 0, error: message });
    } finally {
      if (loadRequestId.current === requestId) {
        setLoading(false);
      }
    }
  }, [onProgressThrottled]);

  useEffect(() => {
    if (open) {
      void doLoad();
    }
    return () => {
      loadRequestId.current += 1;
      pendingProgress.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [open, doLoad]);

  const handleAccordionChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const totalSize = skills.reduce((sum, skill) => sum + skill.contentSizeBytes, 0);
  const groups = useMemo(() => groupSkills(skills), [skills]);
  const progressTotalFiles = progress?.totalFiles ?? 0;
  const progressTotalBytes = progress?.totalBytes ?? 0;
  const progressValue =
    progressTotalFiles > 0
      ? ((progress?.filesFound ?? 0) / progressTotalFiles) * 100
      : progressTotalBytes > 0
      ? ((progress?.bytesDownloaded ?? 0) / progressTotalBytes) * 100
      : 0;

  const countLabel = (count: number, size: number): string =>
    count === 1
      ? t('1 skill · {{size}}', { size: formatBytes(size) })
      : t('{{count}} skills · {{size}}', { count, size: formatBytes(size) });

  return (
    <DialogSlot open={open} onClose={onClose} aria-labelledby={titleId} maxWidth="md" fullWidth>
      <DialogTitle id={titleId}>
        <Box display="flex" alignItems="center" gap={1}>
          <Icon aria-hidden icon="mdi:book-open-variant" width={24} />
          {title ?? t('Loaded Skills')}
          {!loading && skills.length > 0 && (
            <Chip label={countLabel(skills.length, totalSize)} size="small" variant="outlined" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 200 }}>
        {loading && (
          <Box role="status" aria-live="polite" py={3}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="textSecondary">
                {progress?.phase === 'extracting'
                  ? t('Extracting...')
                  : progressTotalFiles > 0
                  ? t('Downloading files...')
                  : t('Connecting...')}
              </Typography>
              {progressTotalFiles > 0 && (
                <Typography variant="body2" color="textSecondary">
                  {`${progress?.filesFound ?? 0} / ${progressTotalFiles}`}
                </Typography>
              )}
              {progressTotalBytes > 0 && (
                <Typography variant="body2" color="textSecondary">
                  {`${formatBytes(progress?.bytesDownloaded ?? 0)} / ${formatBytes(
                    progressTotalBytes
                  )}`}
                </Typography>
              )}
            </Box>
            <LinearProgress
              aria-label={t('Skill loading progress')}
              variant="determinate"
              value={progressValue}
            />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('Failed to load skills: {{message}}', { message: error })}
          </Alert>
        )}

        {!loading && !error && skills.length === 0 && (
          <Box textAlign="center" py={4}>
            <Icon aria-hidden icon="mdi:book-off-outline" width={48} color="#9e9e9e" />
            <Typography color="textSecondary" sx={{ mt: 1 }}>
              {t('No skills loaded. Configure skill sources in the settings above.')}
            </Typography>
          </Box>
        )}

        {!loading &&
          groups.map(group => (
            <Box key={group.label} sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1} mt={1}>
                <Icon aria-hidden icon="mdi:github" width={18} />
                <Typography component="h3" variant="subtitle1" fontWeight={600}>
                  {group.label}
                </Typography>
                <Chip
                  label={countLabel(group.skills.length, group.totalSize)}
                  size="small"
                  variant="outlined"
                  color="default"
                />
              </Box>

              {group.skills.map(skill => {
                const panelId = `${titleId}-${group.label}-${skill.name}`;
                const { path: sourcePath } = parseSource(skill.source);
                return (
                  <Accordion
                    key={`${skill.source}-${skill.name}`}
                    expanded={expanded === panelId}
                    onChange={handleAccordionChange(panelId)}
                    variant="outlined"
                    TransitionProps={{ timeout: 0 }}
                    sx={{ '&:before': { display: 'none' }, mb: 0.5 }}
                  >
                    <AccordionSummary
                      id={`${panelId}-summary`}
                      aria-controls={`${panelId}-details`}
                      expandIcon={<Icon aria-hidden icon="mdi:chevron-down" />}
                    >
                      <Box display="flex" flexDirection="column" gap={0.5} flex={1} mr={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography component="h4" variant="subtitle2" fontWeight={600}>
                            {skill.name}
                          </Typography>
                          <Chip
                            label={formatBytes(skill.contentSizeBytes)}
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" noWrap>
                          {shortDescription(skill.description)}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails id={`${panelId}-details`}>
                      <Box>
                        <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
                          <Chip
                            icon={<Icon aria-hidden icon="mdi:file-document-outline" width={16} />}
                            label={sourcePath}
                            size="small"
                            variant="outlined"
                            title={skill.source}
                          />
                          {skill.author && (
                            <Chip
                              icon={<Icon aria-hidden icon="mdi:account" width={16} />}
                              label={skill.author}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {skill.version && (
                            <Chip
                              icon={<Icon aria-hidden icon="mdi:tag-outline" width={16} />}
                              label={skill.version}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {skill.tags && skill.tags.length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={0.5} mb={1.5}>
                            {skill.tags.map(tag => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                        <Box
                          sx={{
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            p: 2,
                            maxHeight: 400,
                            overflow: 'auto',
                            fontSize: '0.85rem',
                            '& h1': { fontSize: '1.2rem', mt: 0 },
                            '& h2': { fontSize: '1.05rem' },
                            '& h3': { fontSize: '0.95rem' },
                            '& table': {
                              borderCollapse: 'collapse',
                              width: '100%',
                              fontSize: '0.8rem',
                            },
                            '& th, & td': {
                              border: '1px solid',
                              borderColor: 'divider',
                              px: 1,
                              py: 0.5,
                              textAlign: 'left',
                            },
                            '& th': { fontWeight: 600, bgcolor: 'action.selected' },
                            '& code': {
                              bgcolor: 'action.selected',
                              px: 0.5,
                              borderRadius: 0.5,
                              fontSize: '0.8rem',
                            },
                            '& pre': {
                              bgcolor: 'action.selected',
                              p: 1,
                              borderRadius: 1,
                              overflow: 'auto',
                            },
                            '& pre code': { bgcolor: 'transparent', p: 0 },
                            '& blockquote': {
                              borderLeft: '3px solid',
                              borderColor: 'warning.main',
                              pl: 1.5,
                              ml: 0,
                              color: 'text.secondary',
                            },
                            '& a': { color: 'primary.main' },
                            '& img': { maxWidth: '100%' },
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, children }) => {
                                const resolved = href
                                  ? resolveRelativeUrl(href, skill.source)
                                  : '#';
                                const isExternal = /^https?:\/\//.test(resolved);
                                return (
                                  <a
                                    href={resolved}
                                    target={isExternal ? '_blank' : undefined}
                                    rel={isExternal ? 'noopener noreferrer' : undefined}
                                    title={resolved}
                                  >
                                    {children}
                                    {resolved !== href && (
                                      <Icon
                                        aria-hidden
                                        icon="mdi:open-in-new"
                                        width={12}
                                        style={{ marginLeft: 2, verticalAlign: 'middle' }}
                                      />
                                    )}
                                  </a>
                                );
                              },
                            }}
                          >
                            {skill.content}
                          </ReactMarkdown>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          ))}
      </DialogContent>
      <DialogActions>
        {!loading && skills.length > 0 && (
          <Button onClick={doLoad} startIcon={<Icon aria-hidden icon="mdi:refresh" />} size="small">
            {t('Reload')}
          </Button>
        )}
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </DialogSlot>
  );
}

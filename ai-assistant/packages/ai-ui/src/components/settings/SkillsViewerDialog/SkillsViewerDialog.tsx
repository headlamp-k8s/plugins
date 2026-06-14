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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Parse a skill source string into a group label and short path.
 * e.g. "https://github.com/microsoft/azure-skills@abc123/some-skill/SKILL.md"
 *   → { group: "microsoft/azure-skills", path: "some-skill/SKILL.md" }
 * Falls back to the raw source if it can't be parsed.
 */
function parseSource(source: string): { group: string; path: string } {
  // GitHub URL pattern: https://github.com/{owner}/{repo}@{ref}/{path}
  const ghMatch = source.match(/^https?:\/\/github\.com\/([^/@]+\/[^/@]+)(?:@[^/]+)?\/(.+)$/);
  if (ghMatch) {
    return { group: ghMatch[1], path: ghMatch[2] };
  }
  // Filesystem or other — use the last directory as group
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

function groupSkills(skills: SkillDisplayInfo[]): SkillGroup[] {
  const map = new Map<string, SkillDisplayInfo[]>();
  for (const skill of skills) {
    const { group } = parseSource(skill.source);
    if (!map.has(group)) {
      map.set(group, []);
    }
    map.get(group)!.push(skill);
  }
  const groups: SkillGroup[] = [];
  for (const [label, groupSkills] of map) {
    groups.push({
      label,
      skills: groupSkills.sort((a, b) => a.name.localeCompare(b.name)),
      totalSize: groupSkills.reduce((sum, s) => sum + s.contentSizeBytes, 0),
    });
  }
  return groups.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Resolve a relative URL found in skill markdown content to a full GitHub blob URL.
 * Returns the original href for absolute URLs or non-GitHub sources.
 *
 * Source format: https://github.com/{owner}/{repo}@{ref}/{skill-path}/SKILL.md
 * Relative link: references/steps/step-1-verify.md
 * Result: https://github.com/{owner}/{repo}/blob/{ref}/{skill-path}/references/steps/step-1-verify.md
 */
function resolveRelativeUrl(href: string, skillSource: string): string {
  // Already absolute
  if (/^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) {
    return href;
  }

  // Parse GitHub source: https://github.com/{owner}/{repo}@{ref}/{path-to-SKILL.md}
  const ghMatch = skillSource.match(/^https?:\/\/github\.com\/([^/@]+\/[^/@]+)@([^/]+)\/(.+)$/);
  if (!ghMatch) return href;

  const [, ownerRepo, ref, filePath] = ghMatch;
  // Get the directory containing SKILL.md
  const lastSlash = filePath.lastIndexOf('/');
  const dir = lastSlash >= 0 ? filePath.substring(0, lastSlash) : '';
  // Resolve relative path
  const resolved = dir ? `${dir}/${href}` : href;
  return `https://github.com/${ownerRepo}/blob/${ref}/${resolved}`;
}

/** First sentence of the description, truncated. */
function shortDescription(desc: string, max = 120): string {
  // Take first sentence or first N chars
  const firstSentence = desc.split(/\.\s/)[0];
  const text = firstSentence.length <= max ? firstSentence : desc;
  if (text.length <= max) return text;
  return text.substring(0, max - 1) + '…';
}

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
  // Throttle progress updates to one per animation frame to avoid flooding React
  const pendingProgress = React.useRef<SkillLoadProgress | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const onProgressThrottled = React.useCallback((p: SkillLoadProgress) => {
    pendingProgress.current = p;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setProgress(pendingProgress.current);
        rafRef.current = null;
      });
    }
  }, []);

  const doLoad = useCallback(async () => {
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
      const loaded = await loadSkills(onProgressThrottled);
      setProgress(null);
      setSkills(loaded);
      onLoadComplete?.({ count: loaded.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setProgress(null);
      onLoadComplete?.({ count: 0, error: msg });
    } finally {
      setLoading(false);
    }
  }, [loadSkills, onLoadComplete]);

  useEffect(() => {
    if (open) {
      doLoad();
    }
  }, [open]);

  const handleAccordionChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const totalSize = skills.reduce((sum, s) => sum + s.contentSizeBytes, 0);
  const groups = useMemo(() => groupSkills(skills), [skills]);

  return (
    <DialogSlot open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Icon icon="mdi:book-open-variant" width={24} />
          {title ?? t('Loaded Skills')}
          {!loading && skills.length > 0 && (
            <Chip
              label={`${skills.length} skill${skills.length !== 1 ? 's' : ''} · ${formatBytes(
                totalSize
              )}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 200 }}>
        {loading && (
          <Box py={3}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="textSecondary">
                {progress?.phase === 'extracting'
                  ? t('Extracting...')
                  : (progress?.totalFiles ?? 0) > 0
                  ? t('Downloading files...')
                  : t('Connecting...')}
              </Typography>
              {(progress?.totalFiles ?? 0) > 0 && (
                <Typography variant="body2" color="textSecondary">
                  {`${progress!.filesFound} / ${progress!.totalFiles}`}
                </Typography>
              )}
              {(progress?.totalBytes ?? 0) > 0 && (
                <Typography variant="body2" color="textSecondary">
                  {`${formatBytes(progress!.bytesDownloaded)} / ${formatBytes(
                    progress!.totalBytes
                  )}`}
                </Typography>
              )}
            </Box>
            {/* Always determinate — never switch variant to avoid animation flash */}
            <LinearProgress
              variant="determinate"
              value={
                (progress?.totalFiles ?? 0) > 0
                  ? (progress!.filesFound / progress!.totalFiles) * 100
                  : (progress?.totalBytes ?? 0) > 0
                  ? (progress!.bytesDownloaded / progress!.totalBytes) * 100
                  : 0
              }
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
            <Icon icon="mdi:book-off-outline" width={48} color="#9e9e9e" />
            <Typography color="textSecondary" sx={{ mt: 1 }}>
              {t('No skills loaded. Configure skill sources in the settings above.')}
            </Typography>
          </Box>
        )}

        {!loading &&
          groups.map(group => (
            <Box key={group.label} sx={{ mb: 2 }}>
              {/* Group header */}
              <Box display="flex" alignItems="center" gap={1} mb={1} mt={1}>
                <Icon icon="mdi:github" width={18} />
                <Typography variant="subtitle1" fontWeight={600}>
                  {group.label}
                </Typography>
                <Chip
                  label={`${group.skills.length} skill${
                    group.skills.length !== 1 ? 's' : ''
                  } · ${formatBytes(group.totalSize)}`}
                  size="small"
                  variant="outlined"
                  color="default"
                />
              </Box>

              {group.skills.map((skill, index) => {
                const panelId = `${group.label}-${index}`;
                const { path: sourcePath } = parseSource(skill.source);
                return (
                  <Accordion
                    key={panelId}
                    expanded={expanded === panelId}
                    onChange={handleAccordionChange(panelId)}
                    variant="outlined"
                    sx={{ '&:before': { display: 'none' }, mb: 0.5 }}
                  >
                    <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
                      <Box display="flex" flexDirection="column" gap={0.5} flex={1} mr={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight={600}>
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
                    <AccordionDetails>
                      <Box>
                        {/* Source path */}
                        <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
                          <Chip
                            icon={<Icon icon="mdi:file-document-outline" width={16} />}
                            label={sourcePath}
                            size="small"
                            variant="outlined"
                            title={skill.source}
                          />
                          {skill.author && (
                            <Chip
                              icon={<Icon icon="mdi:account" width={16} />}
                              label={skill.author}
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
                        {/* Rendered markdown content */}
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
                              a: ({ href, children, ...props }) => {
                                const resolved = href
                                  ? resolveRelativeUrl(href, skill.source)
                                  : '#';
                                return (
                                  <a
                                    href={resolved}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={resolved}
                                    {...props}
                                  >
                                    {children}
                                    {resolved !== href && (
                                      <Icon
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
          <Button onClick={doLoad} startIcon={<Icon icon="mdi:refresh" />} size="small">
            {t('Reload')}
          </Button>
        )}
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </DialogSlot>
  );
}

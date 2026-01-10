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

import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import React from 'react';
import type { KRevisionResource, KService, Traffic } from '../../../../../resources/knative';
import { getAge } from '../../../../../utils/time';
import { useNotify } from '../../../../common/notifications/useNotify';
import { useKServicePermissions } from '../../permissions/KServicePermissionsProvider';

type Props = {
  cluster: string;
  kservice: KService;
  revisions: KRevisionResource[];
};

export default function TrafficSplittingSection({ cluster, kservice, revisions }: Props) {
  const [savingTraffic, setSavingTraffic] = React.useState(false);
  const { canPatchKService, isLoading } = useKServicePermissions();
  const isReadOnly = canPatchKService !== true || isLoading;
  const [revPercents, setRevPercents] = React.useState<Record<string, number>>({});
  const [revTags, setRevTags] = React.useState<Record<string, string[]>>({});
  const [latestPercent, setLatestPercent] = React.useState<number>(0);
  const [latestTags, setLatestTags] = React.useState<string[]>([]);
  const { notifySuccess, notifyError } = useNotify();
  const revTagInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const latestTagInputRef = React.useRef<HTMLInputElement | null>(null);
  const [pendingTagInputs, setPendingTagInputs] = React.useState<Record<string, string>>({});

  const highlightedRowSx = {
    backgroundColor: (theme: any) => alpha(theme.palette.primary.main, 0.06),
    '&:hover': {
      backgroundColor: (theme: any) => alpha(theme.palette.primary.main, 0.1),
    },
  } as const;

  const initializeFromKService = React.useCallback(() => {
    if (!kservice || !revisions) return;
    const trafficEntries = kservice.spec?.traffic || kservice.status?.traffic || [];
    const byRev = new Map<string, { percent: number; tags: Set<string> }>();
    let latestPercentTotal = 0;
    const latestTagsSet = new Set<string>();
    (trafficEntries || []).forEach(traffic => {
      if (traffic.latestRevision) {
        latestPercentTotal += Number(traffic.percent || 0);
        if (traffic.tag) {
          latestTagsSet.add(traffic.tag);
        }
        return;
      }
      const target = traffic.revisionName;
      if (!target) return;
      const info = byRev.get(target) || { percent: 0, tags: new Set<string>() };
      info.percent += Number(traffic.percent || 0);
      if (traffic.tag) {
        info.tags.add(traffic.tag);
      }
      byRev.set(target, info);
    });
    const nextPercents: Record<string, number> = {};
    const nextTags: Record<string, string[]> = {};
    for (const r of revisions) {
      const revName = r.metadata.name;
      const info = byRev.get(revName);
      nextPercents[revName] = info?.percent ?? 0;
      nextTags[revName] = info ? Array.from(info.tags) : [];
    }
    setRevPercents(nextPercents);
    setRevTags(nextTags);
    setLatestPercent(latestPercentTotal);
    setLatestTags(Array.from(latestTagsSet));
  }, [kservice, revisions]);

  React.useEffect(() => {
    initializeFromKService();
  }, [initializeFromKService]);

  const totalTraffic = React.useMemo(() => {
    const revisionTotal = Object.values(revPercents).reduce((acc, v) => acc + (Number(v) || 0), 0);
    return revisionTotal + (Number(latestPercent) || 0);
  }, [revPercents, latestPercent]);

  const allTags = React.useMemo(() => {
    const tags: string[] = [];
    Object.values(revTags).forEach(list => {
      list.forEach(tag => {
        const trimmed = tag.trim();
        if (trimmed) tags.push(trimmed);
      });
    });
    latestTags.forEach(tag => {
      const trimmed = tag.trim();
      if (trimmed) tags.push(trimmed);
    });
    return tags;
  }, [revTags, latestTags]);

  const hasDuplicateTags = React.useMemo(() => {
    const seen = new Set<string>();
    for (const tag of allTags) {
      if (seen.has(tag)) return true;
      seen.add(tag);
    }
    return false;
  }, [allTags]);

  const latestReadyRevisionName = kservice?.status?.latestReadyRevisionName;
  const latestReadyRevision = React.useMemo(() => {
    if (!latestReadyRevisionName || !revisions) return undefined;
    return revisions.find(r => r.metadata.name === latestReadyRevisionName);
  }, [revisions, latestReadyRevisionName]);

  const trafficValidationError = React.useMemo(() => {
    if (!revisions?.length) return 'No revisions available';
    for (const key of Object.keys(revPercents)) {
      const val = Number(revPercents[key]);
      if (Number.isNaN(val) || val < 0 || val > 100) {
        return 'Traffic percentages must be between 0 and 100';
      }
    }
    const latestVal = Number(latestPercent);
    if (Number.isNaN(latestVal) || latestVal < 0 || latestVal > 100) {
      return 'Latest revision percent must be between 0 and 100';
    }
    if (totalTraffic !== 100) {
      return 'Total traffic must equal 100%';
    }
    if (hasDuplicateTags) {
      return 'Tags must be unique';
    }
    return null;
  }, [revPercents, totalTraffic, latestPercent, hasDuplicateTags, revisions]);

  const pendingTagError = React.useMemo(
    () =>
      Object.values(pendingTagInputs).some(v => Boolean(v?.trim()))
        ? 'There are unconfirmed tags. Please press Enter to confirm.'
        : null,
    [pendingTagInputs]
  );
  const combinedValidationError = trafficValidationError || pendingTagError;
  const isTrafficValid = !combinedValidationError;

  function resetSection() {
    initializeFromKService();
    setPendingTagInputs({});

    // Clear any in-progress tag inputs in the underlying text fields.
    Object.keys(revTagInputRefs.current).forEach(name => {
      const ref = revTagInputRefs.current[name];
      if (ref) {
        ref.value = '';
      }
    });
    if (latestTagInputRef.current) {
      latestTagInputRef.current.value = '';
    }
  }

  async function onSaveTraffic() {
    if (!kservice || !revisions) return;
    if (!cluster) {
      notifyError('No cluster available');
      return;
    }

    setSavingTraffic(true);
    try {
      // 1) Build a merged result that includes in-progress (unconfirmed) tag input
      const mergedRevTags: Record<string, string[]> = {};
      const revisionNames = Array.from(
        new Set([
          ...Object.keys(revPercents),
          ...Object.keys(revTags),
          ...Object.keys(revTagInputRefs.current),
        ])
      );
      revisionNames.forEach(revisionName => {
        const base = revTags[revisionName] || [];
        const pending = (revTagInputRefs.current[revisionName]?.value || '').trim();
        const unique = Array.from(
          new Set([...base, ...(pending ? [pending] : [])].map(v => v.trim()).filter(Boolean))
        );
        mergedRevTags[revisionName] = unique;
      });
      const pendingLatest = (latestTagInputRef.current?.value || '').trim();
      const mergedLatestTags = Array.from(
        new Set(
          [...latestTags, ...(pendingLatest ? [pendingLatest] : [])]
            .map(v => v.trim())
            .filter(Boolean)
        )
      );

      // 2) Validation (also check duplicates after merging)
      const revisionTotal = Object.values(revPercents).reduce(
        (acc, v) => acc + (Number(v) || 0),
        0
      );
      const total = revisionTotal + (Number(latestPercent) || 0);
      let validationError: string | null = null;
      // 0-100 range check
      for (const key of Object.keys(revPercents)) {
        const val = Number(revPercents[key]);
        if (Number.isNaN(val) || val < 0 || val > 100) {
          validationError = 'Traffic percentages must be between 0 and 100';
          break;
        }
      }
      if (!validationError) {
        const lp = Number(latestPercent);
        if (Number.isNaN(lp) || lp < 0 || lp > 100) {
          validationError = 'Latest revision percent must be between 0 and 100';
        }
      }
      if (!validationError && total !== 100) {
        validationError = 'Total traffic must equal 100%';
      }
      if (!validationError) {
        const seen = new Set<string>();
        const all: string[] = [];
        Object.values(mergedRevTags).forEach(list => list.forEach(t => all.push(t)));
        mergedLatestTags.forEach(t => all.push(t));
        for (const t of all) {
          if (seen.has(t)) {
            validationError = 'Tags must be unique';
            break;
          }
          seen.add(t);
        }
      }
      if (validationError) {
        // Also reflect the in-progress input values into UI state
        setRevTags(prev => {
          const next: Record<string, string[]> = { ...prev };
          revisionNames.forEach(name => {
            next[name] = mergedRevTags[name] || [];
          });
          return next;
        });
        setLatestTags(mergedLatestTags);
        notifyError(validationError);
        return;
      }

      // 3) Build Traffic payload for submission (using merged tags)
      const traffic: Traffic[] = [];
      revisionNames.forEach(revisionName => {
        const numericPercent = Number(revPercents[revisionName] ?? 0) || 0;
        const tags = mergedRevTags[revisionName] || [];
        if (numericPercent > 0) {
          traffic.push({
            revisionName,
            percent: numericPercent,
          });
        }
        tags.forEach(tag => {
          traffic.push({
            revisionName,
            percent: 0,
            tag,
          });
        });
      });
      const latestPercentValue = Number(latestPercent) || 0;
      if (latestPercentValue > 0) {
        traffic.push({
          latestRevision: true,
          percent: latestPercentValue,
        });
      }
      mergedLatestTags.forEach(tag => {
        traffic.push({
          latestRevision: true,
          percent: 0,
          tag,
        });
      });

      await kservice.patch({
        spec: {
          traffic: traffic,
        },
      });

      // 4) On success, sync UI state to merged values and clear inputs
      setRevTags(prev => {
        const next: Record<string, string[]> = { ...prev };
        revisionNames.forEach(name => {
          next[name] = mergedRevTags[name] || [];
        });
        return next;
      });
      setLatestTags(mergedLatestTags);
      revisionNames.forEach(name => {
        const ref = revTagInputRefs.current[name];
        if (ref) ref.value = '';
      });
      if (latestTagInputRef.current) latestTagInputRef.current.value = '';

      notifySuccess('Traffic updated');
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      const detail = error?.message?.trim();
      notifyError(detail ? `Failed to update traffic: ${detail}` : 'Failed to update traffic');
    } finally {
      setSavingTraffic(false);
    }
  }

  return (
    <SectionBox title="Traffic Splitting">
      <Stack spacing={2}>
        <TableContainer sx={{ maxHeight: 480 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Ready</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Traffic</TableCell>
                <TableCell>Tags</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const sorted = [...revisions].sort((a, b) => {
                  const at = new Date(a.metadata.creationTimestamp || 0).getTime();
                  const bt = new Date(b.metadata.creationTimestamp || 0).getTime();
                  // Newest first
                  return bt - at;
                });
                const latestReadyCondition = latestReadyRevision?.status?.conditions?.find(
                  c => c.type === 'Ready'
                );
                const rows = sorted.map(r => {
                  const readyCond = r.status?.conditions?.find(c => c.type === 'Ready');
                  const ready = readyCond?.status === 'True';
                  const isLatest = latestReadyRevisionName === r.metadata.name;
                  const percentValue = Number(revPercents[r.metadata.name] ?? 0);
                  const hasTraffic = Number.isFinite(percentValue) && percentValue !== 0;
                  const tags = revTags[r.metadata.name] || [];
                  const hasTags = tags.some(t => Boolean(t?.trim()));
                  const isHighlighted = hasTraffic || hasTags;
                  return (
                    <TableRow
                      key={r.metadata.name}
                      hover
                      sx={isHighlighted ? highlightedRowSx : undefined}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography variant="body2">{r.metadata.name}</Typography>
                          {isLatest && (
                            <Chip
                              label="Latest Ready"
                              color="info"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {ready ? (
                          <Chip label="Ready" color="success" size="small" />
                        ) : (
                          <Chip
                            label={readyCond?.status || 'Unknown'}
                            color="warning"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>{getAge(r.metadata.creationTimestamp)}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 1, inputMode: 'numeric' }}
                          onFocus={e => {
                            try {
                              (e.target as HTMLInputElement).select();
                            } catch {
                              // noop
                            }
                          }}
                          value={revPercents[r.metadata.name] ?? 0}
                          onChange={e =>
                            setRevPercents(prev => ({
                              ...prev,
                              [r.metadata.name]: Number(e.target.value),
                            }))
                          }
                          sx={{ width: 100 }}
                          disabled={isReadOnly}
                        />
                      </TableCell>
                      <TableCell>
                        <Autocomplete<string, true, false, true>
                          multiple
                          freeSolo
                          size="small"
                          value={revTags[r.metadata.name] || []}
                          options={[]}
                          filterSelectedOptions
                          disabled={isReadOnly}
                          onChange={(_, newValue) => {
                            const unique = Array.from(
                              new Set(newValue.map(v => v.trim()).filter(Boolean))
                            );
                            setRevTags(prev => ({
                              ...prev,
                              [r.metadata.name]: unique,
                            }));
                            // Clear pending input helper after tag is confirmed
                            setPendingTagInputs(prev => ({
                              ...prev,
                              [r.metadata.name]: '',
                            }));
                          }}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                {...getTagProps({ index })}
                                key={`${option}-${index}`}
                                label={option}
                                size="small"
                              />
                            ))
                          }
                          renderInput={params => (
                            <TextField
                              {...params}
                              placeholder="Add tag"
                              inputRef={el => {
                                revTagInputRefs.current[r.metadata.name] = el;
                              }}
                              error={Boolean(pendingTagInputs[r.metadata.name]?.trim())}
                              helperText={
                                pendingTagInputs[r.metadata.name]?.trim()
                                  ? 'Press Enter to confirm the tag'
                                  : undefined
                              }
                              onChange={e => {
                                // Preserve Autocomplete's internal onChange as well
                                params.inputProps.onChange?.(
                                  e as React.ChangeEvent<HTMLInputElement>
                                );
                                setPendingTagInputs(prev => ({
                                  ...prev,
                                  [r.metadata.name]: e.target.value,
                                }));
                              }}
                            />
                          )}
                          sx={{ minWidth: 220 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                });
                rows.unshift(
                  <TableRow
                    key="latest-revision"
                    hover={Boolean(latestReadyRevisionName)}
                    sx={
                      (Number.isFinite(Number(latestPercent)) && Number(latestPercent) !== 0) ||
                      latestTags.some(t => Boolean(t?.trim()))
                        ? highlightedRowSx
                        : undefined
                    }
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="body2">Latest Ready Revision</Typography>
                        {latestReadyRevisionName ? (
                          <Chip
                            label={latestReadyRevisionName}
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                        ) : (
                          <Chip
                            label="Unavailable"
                            color="warning"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {latestReadyRevision ? (
                        latestReadyCondition?.status === 'True' ? (
                          <Chip label="Ready" color="success" size="small" />
                        ) : (
                          <Chip
                            label={latestReadyCondition?.status || 'Unknown'}
                            color="warning"
                            size="small"
                          />
                        )
                      ) : (
                        <Chip label="Unknown" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {latestReadyRevision
                        ? getAge(latestReadyRevision.metadata.creationTimestamp)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, max: 100, step: 1, inputMode: 'numeric' }}
                        onFocus={e => {
                          try {
                            (e.target as HTMLInputElement).select();
                          } catch {
                            // noop
                          }
                        }}
                        value={latestPercent}
                        onChange={e => {
                          const numeric = Number(e.target.value);
                          setLatestPercent(Number.isNaN(numeric) ? 0 : numeric);
                        }}
                        sx={{ width: 100 }}
                        disabled={isReadOnly}
                      />
                    </TableCell>
                    <TableCell>
                      <Autocomplete<string, true, false, true>
                        multiple
                        freeSolo
                        size="small"
                        value={latestTags}
                        options={[]}
                        filterSelectedOptions
                        disabled={isReadOnly}
                        onChange={(_, newValue) => {
                          const unique = Array.from(
                            new Set(newValue.map(v => v.trim()).filter(Boolean))
                          );
                          setLatestTags(unique);
                          // Clear the helper for unconfirmed input after tag confirmation
                          setPendingTagInputs(prev => ({
                            ...prev,
                            latest: '',
                          }));
                        }}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={`${option}-${index}`}
                              label={option}
                              size="small"
                            />
                          ))
                        }
                        renderInput={params => (
                          <TextField
                            {...params}
                            placeholder="Add tag"
                            inputRef={latestTagInputRef}
                            error={Boolean(pendingTagInputs.latest?.trim())}
                            helperText={
                              pendingTagInputs.latest?.trim()
                                ? 'Press Enter to confirm the tag'
                                : undefined
                            }
                            onChange={e => {
                              params.inputProps.onChange?.(
                                e as React.ChangeEvent<HTMLInputElement>
                              );
                              setPendingTagInputs(prev => ({
                                ...prev,
                                latest: e.target.value,
                              }));
                            }}
                          />
                        )}
                        sx={{ minWidth: 220 }}
                      />
                    </TableCell>
                  </TableRow>
                );
                return rows;
              })()}
            </TableBody>
          </Table>
        </TableContainer>
        <Box
          mt={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Box display="flex" flexDirection="column">
            <Typography variant="body2" color={isTrafficValid ? 'text.secondary' : 'error'}>
              Total: {totalTraffic}% (must equal 100%)
            </Typography>
            {!isTrafficValid && combinedValidationError && (
              <Typography variant="caption" color="error">
                {combinedValidationError}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            {!isReadOnly && (
              <Button variant="text" onClick={resetSection} aria-label="Reset traffic">
                Reset
              </Button>
            )}
            {!isReadOnly && (
              <Button
                variant="contained"
                onClick={onSaveTraffic}
                disabled={!isTrafficValid || savingTraffic}
                aria-label="Save traffic"
              >
                {savingTraffic ? 'Saving…' : 'Save'}
              </Button>
            )}
          </Box>
        </Box>
      </Stack>
    </SectionBox>
  );
}

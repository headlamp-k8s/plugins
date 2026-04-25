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

import { Icon } from '@iconify/react';
import {
  ActionButton,
  LightTooltip,
  LogViewer,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Pod from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Switch,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { Terminal as XTerm } from '@xterm/xterm';
import { useSnackbar } from 'notistack';
import React from 'react';
import { KService } from '../../../../resources/knative';
import { Activity, useActivity } from '../../../common/activity/Activity';
import { useKServicePermissions } from '../permissions/KServicePermissionsProvider';

type KServiceLogsHeaderButtonProps = {
  kservice: KService;
};

function uniqSorted(values: string[]): string[] {
  const set = new Set(values.filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

const ALL_CONTAINERS_SENTINEL = '__all__';

type Rgb = [number, number, number];

const XTERM_BASE16: ReadonlyArray<Rgb> = [
  [0, 0, 0],
  [128, 0, 0],
  [0, 128, 0],
  [128, 128, 0],
  [0, 0, 128],
  [128, 0, 128],
  [0, 128, 128],
  [192, 192, 192],
  [128, 128, 128],
  [255, 0, 0],
  [0, 255, 0],
  [255, 255, 0],
  [0, 0, 255],
  [255, 0, 255],
  [0, 255, 255],
  [255, 255, 255],
];

function xterm256ColorToRgb(code: number): Rgb | null {
  if (code < 0) return null;
  if (code < 16) return XTERM_BASE16[code] ?? null;

  if (code >= 232) {
    const c = 8 + (code - 232) * 10;
    return [c, c, c];
  }

  // 16..231: 6x6x6 color cube
  const n = code - 16;
  const r = Math.floor(n / 36);
  const g = Math.floor((n % 36) / 6);
  const b = n % 6;
  const toRgb = (v: number) => (v === 0 ? 0 : 55 + v * 40);
  return [toRgb(r), toRgb(g), toRgb(b)];
}

function rgbToCss(rgb: Rgb): string {
  const [r, g, b] = rgb;
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb;
  // Relative luminance (approx), 0..255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgbChroma(rgb: Rgb): number {
  const [r, g, b] = rgb;
  return Math.max(r, g, b) - Math.min(r, g, b);
}

// A large, deterministic palette for pod prefixes.
// We start with the original curated colors, then add many "readable enough" xterm 256 codes.
const POD_PREFIX_COLOR_PALETTE_256: number[] = (() => {
  const preferred = [
    33, // blue
    39, // blue-ish
    45, // cyan
    69, // light blue
    75, // light cyan
    81, // cyan/green
    112, // green
    118, // light green
    141, // purple
    147, // light purple
    203, // pink/red
    209, // orange
    214, // yellow/orange
  ];

  const out: number[] = [];
  const seen = new Set<number>();
  const add = (code: number) => {
    if (code < 0 || code > 255) return;
    if (seen.has(code)) return;
    seen.add(code);
    out.push(code);
  };

  preferred.forEach(add);

  // Pull from the color cube; skip very dark/light and low-chroma (gray-ish) colors
  // so prefixes remain legible on both light and dark themes.
  for (let code = 16; code <= 231; code++) {
    const rgb = xterm256ColorToRgb(code);
    if (!rgb) continue;

    const lum = rgbLuminance(rgb);
    const chroma = rgbChroma(rgb);

    if (lum < 70 || lum > 200) continue;
    if (chroma < 60) continue;
    add(code);
  }

  // As a safety net, keep at least the original palette.
  return out.length >= preferred.length ? out : preferred;
})();

function hashStringToInt(value: string): number {
  // djb2-ish, deterministic and fast enough for UI
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return hash >>> 0;
}

function getPodPrefixColorCode(podName: string): number {
  const idx = hashStringToInt(podName) % POD_PREFIX_COLOR_PALETTE_256.length;
  return POD_PREFIX_COLOR_PALETTE_256[idx];
}

function xterm256ColorToCss(code: number): string {
  const rgb = xterm256ColorToRgb(code);
  if (!rgb) return 'inherit';
  return rgbToCss(rgb);
}

function formatPrefixedLogPlain(podName: string, container: string, fragment: string) {
  const prefix = `[${podName}/${container}] `;
  const normalized = fragment.endsWith('\n') ? fragment : fragment + '\n';
  const parts = normalized.split('\n');
  const withPrefix = parts
    .map((line, idx) => {
      const isTrailingEmpty = idx === parts.length - 1 && line === '';
      if (isTrailingEmpty) return '';
      return prefix + line;
    })
    .join('\n');
  return withPrefix;
}

function formatPrefixedLogAnsi(podName: string, container: string, fragment: string) {
  const code = getPodPrefixColorCode(podName);
  const colorStart = `\u001b[38;5;${code}m`;
  const reset = '\u001b[0m';
  const prefix = `${colorStart}[${podName}/${container}]${reset} `;
  const normalized = fragment.endsWith('\n') ? fragment : fragment + '\n';
  const parts = normalized.split('\n');
  const withPrefix = parts
    .map((line, idx) => {
      const isTrailingEmpty = idx === parts.length - 1 && line === '';
      if (isTrailingEmpty) return '';
      return prefix + line;
    })
    .join('\n');
  return withPrefix;
}

function podHasContainer(pod: Pod, container: string): boolean {
  return (pod.spec?.containers ?? []).some(it => it.name === container);
}

function anySelectedContainerRestarted(pods: Pod[], containers: string[]): boolean {
  for (const pod of pods) {
    const statuses = pod.status?.containerStatuses ?? [];
    for (const c of containers) {
      const st = statuses.find(it => it.name === c);
      if (st && st.restartCount > 0) return true;
    }
  }
  return false;
}

function KServiceLogsActivityContent({ kservice }: { kservice: KService }) {
  const namespace = kservice.metadata.namespace;
  const serviceName = kservice.metadata.name;
  const cluster = kservice.cluster;

  const [activity] = useActivity();
  const { enqueueSnackbar } = useSnackbar();

  const {
    items: kservicePods,
    error: podsError,
    isLoading: podsLoading,
  } = Pod.useList({
    namespace,
    cluster,
    labelSelector: serviceName ? `serving.knative.dev/service=${serviceName}` : undefined,
  });

  const [selectedPodName, setSelectedPodName] = React.useState<'all' | string>('all');
  const [selectedContainers, setSelectedContainers] = React.useState<string[]>([]);
  const [showTimestamps, setShowTimestamps] = React.useState(false);
  const [follow, setFollow] = React.useState(true);
  const [tailLines, setTailLines] = React.useState(100);
  const [showPrevious, setShowPrevious] = React.useState(false);
  const [disableWrap, setDisableWrap] = React.useState(true);
  const [showReconnectButton, setShowReconnectButton] = React.useState(false);
  const [reconnectNonce, setReconnectNonce] = React.useState(0);
  const [downloadLogs, setDownloadLogs] = React.useState<string[]>([]);

  const xtermRef = React.useRef<XTerm | null>(null);
  const preRef = React.useRef<HTMLPreElement | null>(null);

  const streamStateRef = React.useRef<Map<string, { lastLen: number }>>(new Map());
  const streamCleanupByKeyRef = React.useRef<Map<string, () => void>>(new Map());
  const lastStreamConfigKeyRef = React.useRef<string>('');

  const notifiedRef = React.useRef<{ noPods: boolean; podsError: boolean }>({
    noPods: false,
    podsError: false,
  });

  const disableWrapRef = React.useRef(disableWrap);
  React.useEffect(() => {
    disableWrapRef.current = disableWrap;
  }, [disableWrap]);

  const followRef = React.useRef(follow);
  React.useEffect(() => {
    followRef.current = follow;
  }, [follow]);

  const pendingDownloadRef = React.useRef<string[]>([]);
  const flushScheduledRef = React.useRef(false);

  const allPods = (kservicePods ?? []) as Pod[];
  const selectedPods =
    selectedPodName === 'all' ? allPods : allPods.filter(p => p.getName() === selectedPodName);
  const availablePodNames = allPods.map(p => p.getName());
  const availablePodNamesKey = uniqSorted(availablePodNames).join('|');
  const availableContainerNames = uniqSorted(
    (selectedPods.length > 0 ? selectedPods : allPods).flatMap(p =>
      (p.spec?.containers ?? []).map(c => c.name)
    )
  );
  const availableContainerNamesKey = availableContainerNames.join('|');

  // Keep selection sane when pods/containers change (e.g. scaling, revision rollout).
  React.useEffect(() => {
    if (
      selectedPodName !== 'all' &&
      selectedPodName &&
      !availablePodNames.includes(selectedPodName)
    ) {
      setSelectedPodName('all');
    }
  }, [availablePodNames.join('|'), selectedPodName]);

  React.useEffect(() => {
    if (selectedContainers.length === 0 && availableContainerNames.length > 0) {
      // Default to "all containers" for a stern-like experience.
      setSelectedContainers(availableContainerNames);
      return;
    }

    const next = selectedContainers.filter(c => availableContainerNames.includes(c));
    if (next.length !== selectedContainers.length) {
      setSelectedContainers(next);
    }
  }, [availableContainerNames.join('|'), selectedContainers.join('|')]);

  const canShowPrevious = anySelectedContainerRestarted(selectedPods, selectedContainers);

  React.useEffect(() => {
    if (!canShowPrevious && showPrevious) {
      setShowPrevious(false);
    }
  }, [canShowPrevious, showPrevious]);

  function clearTerminalAndState() {
    xtermRef.current?.clear();
    setDownloadLogs([]);
    pendingDownloadRef.current = [];
    flushScheduledRef.current = false;
    streamStateRef.current.clear();
  }

  function stopStream(key: string) {
    const cleanup = streamCleanupByKeyRef.current.get(key);
    if (cleanup) {
      try {
        cleanup();
      } catch {
        // noop
      }
    }
    streamCleanupByKeyRef.current.delete(key);
    streamStateRef.current.delete(key);
  }

  function stopAllStreams() {
    for (const [key] of streamCleanupByKeyRef.current) {
      stopStream(key);
    }
    streamCleanupByKeyRef.current.clear();
    streamStateRef.current.clear();
  }

  // Ensure streams are cleaned up when the activity is closed/unmounted.
  React.useEffect(() => {
    return () => {
      stopAllStreams();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom while following (no-wrap <pre> view).
  React.useEffect(() => {
    if (!disableWrap) return;
    if (!follow) return;
    const el = preRef.current;
    if (!el) return;
    // Use rAF so layout reflects newly appended logs.
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [disableWrap, follow, downloadLogs.length]);

  function scheduleDownloadAppend(fragments: string[]) {
    if (fragments.length === 0) return;
    pendingDownloadRef.current.push(...fragments);
    if (flushScheduledRef.current) return;
    flushScheduledRef.current = true;
    requestAnimationFrame(() => {
      flushScheduledRef.current = false;
      const pending = pendingDownloadRef.current;
      pendingDownloadRef.current = [];
      if (pending.length === 0) return;
      const MAX = 5000;
      setDownloadLogs(prev => {
        const next = prev.concat(pending);
        return next.length > MAX ? next.slice(next.length - MAX) : next;
      });
    });
  }

  function downloadPlainLogs() {
    // Cuts off the last 5 digits of the timestamp to remove the milliseconds
    const time = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
    const downloadName = `${serviceName}_${
      selectedPodName === 'all' ? 'all_pods' : selectedPodName
    }`;

    const element = document.createElement('a');
    const file = new Blob([downloadLogs.join('')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${downloadName}_${time}.txt`;
    // Required for FireFox
    document.body.appendChild(element);
    element.click();
  }

  React.useEffect(() => {
    if (!serviceName) return;

    if (podsError) {
      if (!notifiedRef.current.podsError) {
        const message =
          (podsError as { message?: string })?.message ?? 'Failed to fetch pods: Unknown error';
        enqueueSnackbar(message, { variant: 'error', autoHideDuration: 5000 });
        notifiedRef.current.podsError = true;
      }
      return;
    }
    notifiedRef.current.podsError = false;

    if (podsLoading || kservicePods === null) {
      return;
    }

    if (allPods.length === 0) {
      if (!notifiedRef.current.noPods) {
        enqueueSnackbar(
          'No running pods were found for this KService. It may currently be scaled to zero.',
          { variant: 'info', autoHideDuration: 5000 }
        );
        notifiedRef.current.noPods = true;
      }
      stopAllStreams();
      return;
    }
    notifiedRef.current.noPods = false;

    if (!follow) {
      stopAllStreams();
      return;
    }

    const containersToUse =
      selectedContainers.length > 0 ? selectedContainers : availableContainerNames;
    const podsToUse = selectedPods.length > 0 ? selectedPods : allPods;

    // Restart all streams only when "stream config" changes.
    // Pod set changes (scale up/down) are handled incrementally so logs don't fully refresh.
    const streamConfigKey = [
      activity.id,
      serviceName,
      namespace,
      cluster,
      selectedPodName,
      selectedContainers.join('|'),
      showTimestamps ? 'ts1' : 'ts0',
      follow ? 'f1' : 'f0',
      String(tailLines),
      showPrevious ? 'p1' : 'p0',
      String(reconnectNonce),
    ].join('::');

    const configChanged = lastStreamConfigKeyRef.current !== streamConfigKey;
    if (configChanged) {
      stopAllStreams();
      clearTerminalAndState();
      setShowReconnectButton(false);
      lastStreamConfigKeyRef.current = streamConfigKey;
    }

    const desired = new Map<string, { pod: Pod; podName: string; container: string }>();
    for (const pod of podsToUse) {
      const podName = pod.getName();
      for (const container of containersToUse) {
        if (!podHasContainer(pod, container)) continue;
        const key = `${podName}/${container}`;
        desired.set(key, { pod, podName, container });
      }
    }

    // Stop streams that are no longer needed (pod disappeared, selection changed, etc.)
    for (const key of Array.from(streamCleanupByKeyRef.current.keys())) {
      if (!desired.has(key)) {
        stopStream(key);
      }
    }

    // Start streams for newly appeared pods/containers.
    for (const [key, { pod, podName, container }] of desired) {
      if (streamCleanupByKeyRef.current.has(key)) continue;

      streamStateRef.current.set(key, { lastLen: 0 });
      const cleanup = pod.getLogs(
        container,
        (result: { logs: string[]; hasJsonLogs: boolean }) => {
          const state = streamStateRef.current.get(key) ?? { lastLen: 0 };
          const nextLen = result.logs.length;
          let startIdx = state.lastLen;

          // The Pod log stream resets its internal buffer on reconnect.
          // If the length shrinks, treat it as a reset.
          if (nextLen < startIdx) {
            startIdx = 0;
            state.lastLen = 0;
          }

          if (nextLen <= startIdx) {
            streamStateRef.current.set(key, state);
            return;
          }

          const newFragments = result.logs.slice(startIdx);
          const formattedPlain = newFragments.map(f =>
            formatPrefixedLogPlain(podName, container, f)
          );
          const formattedAnsi = newFragments.map(f => formatPrefixedLogAnsi(podName, container, f));
          const terminalChunk = formattedAnsi.join('').replace(/\n/g, '\r\n');

          if (!disableWrapRef.current) {
            xtermRef.current?.write(terminalChunk);
            if (followRef.current) {
              xtermRef.current?.scrollToBottom();
            }
          }
          scheduleDownloadAppend(formattedPlain);

          state.lastLen = nextLen;
          streamStateRef.current.set(key, state);
        },
        {
          tailLines: tailLines,
          showPrevious: showPrevious,
          showTimestamps: showTimestamps,
          follow: follow,
          onReconnectStop: () => setShowReconnectButton(true),
        }
      );

      streamCleanupByKeyRef.current.set(key, cleanup);
    }
  }, [
    activity.id,
    serviceName,
    namespace,
    cluster,
    podsLoading,
    podsError,
    availablePodNamesKey,
    availableContainerNamesKey,
    selectedPodName,
    selectedContainers.join('|'),
    showTimestamps,
    follow,
    tailLines,
    showPrevious,
    reconnectNonce,
    enqueueSnackbar,
  ]);

  const sternControls = (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', width: '100%' }}>
      <FormControl sx={{ minWidth: 220 }}>
        <InputLabel>Select Pod</InputLabel>
        <Select
          value={selectedPodName}
          onChange={(event: SelectChangeEvent<'all' | string>) => {
            clearTerminalAndState();
            setSelectedPodName(event.target.value as 'all' | string);
          }}
          label="Select Pod"
        >
          <MenuItem value="all">All Pods</MenuItem>
          {availablePodNames.map(podName => (
            <MenuItem key={podName} value={podName}>
              {podName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 260 }}>
        <InputLabel>Container</InputLabel>
        <Select<string[]>
          multiple
          value={selectedContainers}
          onChange={(event: SelectChangeEvent<string[]>) => {
            clearTerminalAndState();
            const raw = event.target.value;
            const next = Array.isArray(raw) ? raw : String(raw).split(',');
            if (next.includes(ALL_CONTAINERS_SENTINEL)) {
              setSelectedContainers(availableContainerNames);
              return;
            }
            setSelectedContainers(next);
          }}
          label="Container"
          renderValue={selected =>
            Array.isArray(selected) && selected.length ? selected.join(', ') : 'All Containers'
          }
        >
          <MenuItem value={ALL_CONTAINERS_SENTINEL}>
            <ListItemText primary="All Containers" />
          </MenuItem>
          {availableContainerNames.map(container => (
            <MenuItem key={container} value={container}>
              <Checkbox checked={selectedContainers.includes(container)} />
              <ListItemText primary={container} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Lines</InputLabel>
        <Select
          value={tailLines}
          onChange={(event: SelectChangeEvent<number>) => {
            clearTerminalAndState();
            setTailLines(Number(event.target.value));
          }}
          label="Lines"
        >
          {[100, 1000, 2500].map(i => (
            <MenuItem key={i} value={i}>
              {i}
            </MenuItem>
          ))}
          <MenuItem value={-1}>All</MenuItem>
        </Select>
      </FormControl>

      <LightTooltip
        title={
          canShowPrevious
            ? 'Show logs for previous instances of this container.'
            : 'You can only select this option for containers that have been restarted.'
        }
      >
        <FormControlLabel
          label="Show previous"
          disabled={!canShowPrevious}
          control={
            <Switch
              checked={showPrevious}
              onChange={() => {
                clearTerminalAndState();
                setShowPrevious(prev => !prev);
              }}
              size="small"
            />
          }
        />
      </LightTooltip>

      <FormControlLabel
        control={
          <Switch
            checked={showTimestamps}
            onChange={() => {
              clearTerminalAndState();
              setShowTimestamps(prev => !prev);
            }}
            size="small"
          />
        }
        label="Timestamps"
      />

      <FormControlLabel
        control={
          <Switch
            checked={follow}
            onChange={() => {
              clearTerminalAndState();
              setFollow(prev => !prev);
            }}
            size="small"
          />
        }
        label="Follow"
      />

      <LightTooltip
        title={
          disableWrap
            ? 'Show logs without wrapping (prefix colored per pod).'
            : 'Use terminal view (ANSI colors, but long lines wrap).'
        }
      >
        <FormControlLabel
          control={
            <Switch
              checked={!disableWrap}
              onChange={() => {
                const next = !disableWrap;
                setDisableWrap(next);
                // Switching to terminal view: restart streams so the xterm view is populated.
                if (!next) {
                  clearTerminalAndState();
                  setShowReconnectButton(false);
                  setReconnectNonce(n => n + 1);
                }
              }}
              size="small"
            />
          }
          label="Wrap"
        />
      </LightTooltip>
    </Box>
  );

  const topActions = [sternControls];

  const coloredNoWrapNodes = React.useMemo(() => {
    if (!disableWrap) return null;

    const text = downloadLogs.join('');
    if (!text) return null;

    const lines = text.split('\n');
    const re = /^\[([^/\]]+)\/([^\]]+)\]\s*/;

    return lines.map((line, idx) => {
      const isLast = idx === lines.length - 1;
      const suffix = isLast ? '' : '\n';

      if (!line) {
        return <React.Fragment key={idx}>{suffix}</React.Fragment>;
      }

      const m = line.match(re);
      if (!m) {
        return (
          <React.Fragment key={idx}>
            {line}
            {suffix}
          </React.Fragment>
        );
      }

      const podName = m[1];
      const prefixLen = m[0].length;
      const prefixText = line.slice(0, prefixLen);
      const restText = line.slice(prefixLen);
      const cssColor = xterm256ColorToCss(getPodPrefixColorCode(podName));

      return (
        <React.Fragment key={`${idx}-${podName}`}>
          <span style={{ color: cssColor }}>{prefixText}</span>
          {restText}
          {suffix}
        </React.Fragment>
      );
    });
  }, [disableWrap, downloadLogs]);

  if (!serviceName) {
    return null;
  }

  if (disableWrap) {
    return (
      <Box sx={{ height: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ padding: 2, paddingBottom: 1 }}>
          <Grid container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid item container spacing={1} sx={{ minWidth: 0 }}>
              <Grid item>{sternControls}</Grid>
            </Grid>
            <Grid item xs>
              <ActionButton
                icon="mdi:magnify"
                onClick={() => {
                  enqueueSnackbar('Use browser find (Cmd/Ctrl+F) in no-wrap view.', {
                    variant: 'info',
                    autoHideDuration: 3000,
                  });
                }}
                description="Find"
              />
            </Grid>
            <Grid item xs>
              <ActionButton icon="mdi:broom" onClick={clearTerminalAndState} description="Clear" />
            </Grid>
            <Grid item xs>
              <ActionButton
                icon="mdi:file-download-outline"
                onClick={downloadPlainLogs}
                description="Download"
              />
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            paddingTop: theme => theme.spacing(1),
            flex: 1,
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column-reverse',
            position: 'relative',
          }}
        >
          {showReconnectButton && (
            <Button
              onClick={() => {
                clearTerminalAndState();
                setShowReconnectButton(false);
                setReconnectNonce(n => n + 1);
              }}
              color="info"
              variant="contained"
            >
              Reconnect
            </Button>
          )}

          <Box
            component="pre"
            ref={preRef}
            sx={{
              flex: 1,
              margin: 0,
              padding: 1,
              overflow: 'auto',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              wordBreak: 'normal',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '0.82rem',
              lineHeight: 1.35,
              bgcolor: 'background.default',
              color: 'text.primary',
            }}
          >
            {coloredNoWrapNodes}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <LogViewer
      noDialog
      title={serviceName}
      downloadName={`${serviceName}_${selectedPodName === 'all' ? 'all_pods' : selectedPodName}`}
      open
      onClose={() => Activity.close(activity.id)}
      logs={downloadLogs}
      topActions={topActions}
      xtermRef={xtermRef}
      handleReconnect={() => {
        clearTerminalAndState();
        setShowReconnectButton(false);
        setReconnectNonce(n => n + 1);
      }}
      showReconnectButton={showReconnectButton}
    />
  );
}

export function KServiceLogsHeaderButton({ kservice }: KServiceLogsHeaderButtonProps) {
  const { canGetPodLogs } = useKServicePermissions();

  const onClick = () => {
    const name = kservice.metadata.name;
    if (!name) return;

    Activity.launch({
      id: `knative-kservice-logs-${kservice.metadata.uid ?? name}`,
      title: `Logs: ${name}`,
      icon: <Icon icon="mdi:file-document-box-outline" width="100%" height="100%" />,
      cluster: kservice.cluster,
      location: 'full',
      content: <KServiceLogsActivityContent kservice={kservice} />,
    });
  };

  if (canGetPodLogs !== true) {
    return null;
  }

  return (
    <ActionButton icon="mdi:file-document-box-outline" onClick={onClick} description="Show logs" />
  );
}

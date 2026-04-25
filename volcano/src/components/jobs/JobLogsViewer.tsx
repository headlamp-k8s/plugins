import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  AuthVisible,
  LogViewer,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Pod from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import React from 'react';
import { VolcanoJob } from '../../resources/job';
import {
  getContainerNames,
  getDefaultContainerName,
  getLogsHelperMessage,
  getSelectedPods,
  hasRestartedContainer,
  isTerminalPod,
  JOB_NAME_LABEL,
} from './jobLogs';
import { useJobLogsStream } from './useJobLogsStream';

/**
 * Props for the Job logs activity viewer.
 */
type JobLogsViewerProps = {
  /** Activity id used to close the full-screen logs viewer. */
  activityId: string;
  /** Volcano Job whose related pod logs are shown. */
  job: VolcanoJob;
};

/**
 * Props for the Job logs viewer control bar.
 */
type JobLogsControlsProps = {
  /** Pods discovered for the selected Volcano Job. */
  pods: Pod[] | null;
  /** Whether the related pod list is still loading. */
  podsLoading: boolean;
  /** Currently selected pod name or `all` for aggregated logs. */
  selectedPodName: 'all' | string;
  /** Updates the selected pod name. */
  setSelectedPodName: React.Dispatch<React.SetStateAction<'all' | string>>;
  /** Container names available for the current pod selection. */
  availableContainers: string[];
  /** Currently selected container name. */
  selectedContainer: string;
  /** Updates the selected container name. */
  setSelectedContainer: React.Dispatch<React.SetStateAction<string>>;
  /** Number of log lines requested from the cluster. */
  lines: number;
  /** Updates the requested log line count. */
  setLines: React.Dispatch<React.SetStateAction<number>>;
  /** Whether previous container logs should be shown. */
  showPrevious: boolean;
  /** Updates the previous-logs toggle state. */
  setShowPrevious: React.Dispatch<React.SetStateAction<boolean>>;
  /** Whether the selected container has previous logs available. */
  canShowPrevious: boolean;
  /** Whether timestamps should be shown in the log output. */
  showTimestamps: boolean;
  /** Updates the timestamp toggle state. */
  setShowTimestamps: React.Dispatch<React.SetStateAction<boolean>>;
  /** Whether the log stream should continue following new output. */
  follow: boolean;
  /** Updates the follow toggle state. */
  setFollow: React.Dispatch<React.SetStateAction<boolean>>;
  /** Helper message shown above the log terminal when no log content is available yet. */
  helperMessage: string | null;
};

/**
 * Renders the Job logs viewer controls and helper message strip.
 *
 * @param props Control bar properties for selecting pods, containers, and log options.
 * @returns Control bar shown above the logs terminal.
 */
function JobLogsControls({
  pods,
  podsLoading,
  selectedPodName,
  setSelectedPodName,
  availableContainers,
  selectedContainer,
  setSelectedContainer,
  lines,
  setLines,
  showPrevious,
  setShowPrevious,
  canShowPrevious,
  showTimestamps,
  setShowTimestamps,
  follow,
  setFollow,
  helperMessage,
}: JobLogsControlsProps) {
  return (
    <Box
      key="job-log-controls"
      sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}
    >
      <Box
        sx={{
          minHeight: theme => theme.spacing(3),
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          {helperMessage || ' '}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="job-logs-pod-label">Select Pod</InputLabel>
          <Select
            id="job-logs-pod-select"
            labelId="job-logs-pod-label"
            value={selectedPodName}
            label="Select Pod"
            onChange={event => setSelectedPodName(event.target.value as 'all' | string)}
            disabled={podsLoading || !pods?.length}
          >
            <MenuItem value="all">All Pods</MenuItem>
            {(pods || []).map(pod => (
              <MenuItem key={pod.getName()} value={pod.getName()}>
                {pod.getName()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="job-logs-container-label">Container</InputLabel>
          <Select
            id="job-logs-container-select"
            labelId="job-logs-container-label"
            value={selectedContainer}
            label="Container"
            onChange={event => setSelectedContainer(event.target.value)}
            disabled={!availableContainers.length}
          >
            {availableContainers.map(container => (
              <MenuItem key={container} value={container}>
                {container}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="job-logs-lines-label">Lines</InputLabel>
          <Select
            id="job-logs-lines-select"
            labelId="job-logs-lines-label"
            value={lines}
            label="Lines"
            onChange={event => setLines(Number(event.target.value))}
          >
            {[100, 1000, 2500].map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value={-1}>All</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          label="Show previous"
          control={
            <Switch checked={showPrevious} onChange={() => setShowPrevious(value => !value)} />
          }
          disabled={!canShowPrevious}
        />

        <FormControlLabel
          label="Timestamps"
          control={
            <Switch checked={showTimestamps} onChange={() => setShowTimestamps(value => !value)} />
          }
        />

        <FormControlLabel
          label="Follow"
          control={<Switch checked={follow} onChange={() => setFollow(value => !value)} />}
        />
      </Box>
    </Box>
  );
}

/**
 * Renders the full-screen logs viewer for a Volcano Job.
 *
 * @param props Viewer properties including the activity id and target Job.
 * @returns Job logs viewer with controls, helper strip, and terminal output.
 */
function JobLogsViewer({ activityId, job }: JobLogsViewerProps) {
  const namespace = job.metadata.namespace;
  const cluster = job.cluster;
  const jobName = job.metadata.name;
  const { enqueueSnackbar } = useSnackbar();

  const [selectedPodName, setSelectedPodName] = React.useState<'all' | string>('all');
  const [selectedContainer, setSelectedContainer] = React.useState('');
  const [lines, setLines] = React.useState(100);
  const [showTimestamps, setShowTimestamps] = React.useState(true);
  const [follow, setFollow] = React.useState(true);
  const [showPrevious, setShowPrevious] = React.useState(false);

  const {
    items: pods,
    error: podError,
    isLoading: podsLoading,
  } = Pod.useList({
    namespace,
    cluster,
    labelSelector: jobName ? `${JOB_NAME_LABEL}=${jobName}` : undefined,
  });

  const selectedPods = React.useMemo(
    () => getSelectedPods(pods || [], selectedPodName),
    [pods, selectedPodName]
  );

  const availableContainers = React.useMemo(() => getContainerNames(selectedPods), [selectedPods]);

  const canShowPrevious = React.useMemo(
    () => hasRestartedContainer(selectedPods, selectedContainer),
    [selectedContainer, selectedPods]
  );

  const isInitializingSelection = React.useMemo(
    () => !!pods?.length && !!selectedPods.length && !selectedContainer,
    [pods, selectedContainer, selectedPods]
  );

  const [shouldShowNoPodsMessage, setShouldShowNoPodsMessage] = React.useState(false);
  const [shouldShowNoLogsMessage, setShouldShowNoLogsMessage] = React.useState(false);

  const canRequestLogs = React.useMemo(
    () => !!pods?.length && !!selectedPods.length && !!selectedContainer,
    [pods, selectedContainer, selectedPods]
  );

  const allSelectedPodsAreTerminal = React.useMemo(
    () => selectedPods.length > 0 && selectedPods.every(isTerminalPod),
    [selectedPods]
  );

  React.useEffect(() => {
    if (podsLoading || pods?.length) {
      setShouldShowNoPodsMessage(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldShowNoPodsMessage(true);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [pods, podsLoading]);

  React.useEffect(() => {
    if (!pods?.length) {
      return;
    }

    if (selectedPodName !== 'all' && !pods.some(pod => pod.getName() === selectedPodName)) {
      setSelectedPodName('all');
      return;
    }

    const nextDefaultContainer =
      availableContainers.includes(selectedContainer) && selectedContainer
        ? selectedContainer
        : getDefaultContainerName(selectedPods);

    if (nextDefaultContainer !== selectedContainer) {
      setSelectedContainer(nextDefaultContainer);
    }
  }, [availableContainers, pods, selectedContainer, selectedPodName, selectedPods]);

  const { logs, showReconnectButton, xtermRef, handleReconnect } = useJobLogsStream({
    selectedPods,
    selectedPodName,
    selectedContainer,
    lines,
    showPrevious,
    showTimestamps,
    follow,
    allSelectedPodsAreTerminal,
  });

  React.useEffect(() => {
    if (!canRequestLogs || logs.length > 0) {
      setShouldShowNoLogsMessage(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldShowNoLogsMessage(true);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [canRequestLogs, logs]);

  React.useEffect(() => {
    if (!podError) {
      return;
    }

    const message = podError instanceof Error ? podError.message : String(podError);
    enqueueSnackbar(`Failed to load Job pods: ${message}`, { variant: 'error' });
  }, [enqueueSnackbar, podError]);

  const helperMessage = React.useMemo(
    () =>
      getLogsHelperMessage({
        logs,
        podError,
        pods,
        podsLoading,
        isInitializingSelection,
        shouldShowNoLogsMessage,
        shouldShowNoPodsMessage,
        selectedContainer,
        selectedPods,
      }),
    [
      logs,
      podError,
      pods,
      podsLoading,
      isInitializingSelection,
      shouldShowNoLogsMessage,
      shouldShowNoPodsMessage,
      selectedContainer,
      selectedPods,
    ]
  );

  const topActions = [
    <JobLogsControls
      key="job-log-controls"
      pods={pods}
      podsLoading={podsLoading}
      selectedPodName={selectedPodName}
      setSelectedPodName={setSelectedPodName}
      availableContainers={availableContainers}
      selectedContainer={selectedContainer}
      setSelectedContainer={setSelectedContainer}
      lines={lines}
      setLines={setLines}
      showPrevious={showPrevious}
      setShowPrevious={setShowPrevious}
      canShowPrevious={canShowPrevious}
      showTimestamps={showTimestamps}
      setShowTimestamps={setShowTimestamps}
      follow={follow}
      setFollow={setFollow}
      helperMessage={helperMessage}
    />,
  ];

  return (
    <LogViewer
      noDialog
      open
      title={jobName}
      downloadName={`${jobName}_${selectedPodName === 'all' ? 'all_pods' : selectedPodName}`}
      logs={logs}
      topActions={topActions}
      xtermRef={xtermRef}
      onClose={() => Activity.close(activityId)}
      handleReconnect={handleReconnect}
      showReconnectButton={showReconnectButton}
    />
  );
}

/**
 * Renders the Job logs action shown in the details header.
 *
 * @param props Action button properties.
 * @returns Header action for opening the Job logs viewer.
 */
export function JobLogsHeaderButton({ job }: { job: VolcanoJob }) {
  return (
    <AuthVisible item={Pod} authVerb="get" subresource="log" namespace={job.metadata.namespace}>
      <ActionButton
        icon="mdi:file-document-box-outline"
        description="Show Logs"
        onClick={() => {
          const activityId = `volcano-job-logs-${job.metadata.uid || job.metadata.name}`;
          Activity.launch({
            id: activityId,
            title: `Logs: ${job.metadata.name}`,
            icon: <Icon icon="mdi:file-document-box-outline" width="100%" height="100%" />,
            cluster: job.cluster,
            location: 'full',
            content: <JobLogsViewer activityId={activityId} job={job} />,
          });
        }}
      />
    </AuthVisible>
  );
}

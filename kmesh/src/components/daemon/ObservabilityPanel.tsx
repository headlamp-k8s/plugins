import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useKmeshLoggers } from '../../hooks/useDaemonRequest';
import { useKmeshDaemonPods } from '../../hooks/useKmeshDaemonPods';
import { DAEMON_ENDPOINTS, KMESH_NAMESPACE } from '../../utils/kmeshDaemonApi';
import {
  daemonRequest,
  toggleDaemonFeature,
  type ToggleEndpoint,
} from '../../utils/kmeshDaemonProxy';

const LOG_LEVELS = ['trace', 'debug', 'info', 'warning', 'error', 'fatal', 'panic'];

export default function ObservabilityPanel() {
  const namespace = KMESH_NAMESPACE;
  const { pods, readyPod, loading: podsLoading, error: podError } = useKmeshDaemonPods();
  const [selectedPodName, setSelectedPodName] = useState<string>('');

  // Automatically select the first ready pod if none is selected
  useEffect(() => {
    if (!selectedPodName && readyPod) {
      setSelectedPodName(readyPod.name);
    }
  }, [readyPod, selectedPodName]);

  const {
    data: loggers,
    status: loggersStatus,
    error: loggersError,
  } = useKmeshLoggers(namespace, selectedPodName || null);
  const [selectedLogger, setSelectedLogger] = useState<string>('bpf');
  const [selectedLevel, setSelectedLevel] = useState<string>('info');

  useEffect(() => {
    if (loggers && loggers.length > 0 && !loggers.includes(selectedLogger)) {
      setSelectedLogger(loggers[0]);
    }
  }, [loggers, selectedLogger]);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (loggersStatus === 'error' && loggersError) {
      setActionError(`Failed to fetch available loggers: ${loggersError}`);
    }
  }, [loggersStatus, loggersError]);

  // Local state for toggles (defaults to false)
  const [toggleStates, setToggleStates] = useState<Partial<Record<ToggleEndpoint, boolean>>>({});

  // Reset toggle states when pod changes
  useEffect(() => {
    setToggleStates({});
    setActionError(null);
    setActionSuccess(null);
  }, [selectedPodName]);

  if (podError) {
    return (
      <SectionBox title="Kmesh Observability Controls">
        <Typography color="error">Error locating Kmesh daemon pod: {podError}</Typography>
      </SectionBox>
    );
  }

  if (podsLoading) {
    return (
      <SectionBox title="Kmesh Observability Controls">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </SectionBox>
    );
  }

  if (pods.length === 0) {
    return (
      <SectionBox title="Kmesh Observability Controls">
        <Typography color="text.secondary">No Kmesh daemon pods found.</Typography>
      </SectionBox>
    );
  }

  const handleToggle = async (endpoint: ToggleEndpoint, enable: boolean, label: string) => {
    if (!selectedPodName) return;

    const previous = !!toggleStates[endpoint];

    // Optimistically update so the switch reflects the user's action immediately.
    setToggleStates(prev => ({ ...prev, [endpoint]: enable }));

    setLoadingAction(label);
    setActionError(null);
    setActionSuccess(null);
    try {
      await toggleDaemonFeature(namespace, selectedPodName, endpoint, enable);
      setActionSuccess(
        `Successfully ${enable ? 'enabled' : 'disabled'} ${label} on ${selectedPodName}`
      );
    } catch (err: unknown) {
      // Revert optimistic update on failure.
      setToggleStates(prev => ({ ...prev, [endpoint]: previous }));
      const message = err instanceof Error ? err.message : String(err);
      setActionError(`Failed to ${enable ? 'enable' : 'disable'} ${label}: ${message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSetLogLevel = async () => {
    if (!selectedPodName) return;
    setLoadingAction('Log Level');
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await daemonRequest<Response>(
        namespace,
        selectedPodName,
        DAEMON_ENDPOINTS.LOGGERS,
        {
          method: 'POST',
          body: { name: selectedLogger, level: selectedLevel },
          isJSON: false,
        }
      );
      if (!res.ok) {
        throw new Error(`Kmesh daemon log level update failed: ${res.status} ${res.statusText}`);
      }
      setActionSuccess(
        `Successfully set logger '${selectedLogger}' to '${selectedLevel}' on ${selectedPodName}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setActionError(`Failed to set log level: ${message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const selectedPodReady = pods.find(p => p.name === selectedPodName)?.ready ?? false;

  const FeatureRow = ({ label, endpoint }: { label: string; endpoint: ToggleEndpoint }) => (
    <Box display="flex" justifyContent="space-between" alignItems="center" py={1.5}>
      <Typography variant="body1">{label}</Typography>
      <Box>
        <Switch
          checked={!!toggleStates[endpoint]}
          onChange={e => handleToggle(endpoint, e.target.checked, label)}
          disabled={loadingAction !== null || !selectedPodName || !selectedPodReady}
          inputProps={{ 'aria-label': label }}
          color="primary"
        />
      </Box>
    </Box>
  );

  return (
    <SectionBox title="Kmesh Observability Controls">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl size="small" sx={{ minWidth: 350 }} disabled={loadingAction !== null}>
          <InputLabel id="target-pod-label">Daemon Pod</InputLabel>
          <Select
            labelId="target-pod-label"
            id="target-pod-select"
            value={selectedPodName}
            label="Daemon Pod"
            displayEmpty
            renderValue={value => ((value as string) ? (value as string) : 'Select a daemon pod')}
            onChange={e => {
              setSelectedPodName(e.target.value as string);
              setActionError(null);
              setActionSuccess(null);
            }}
          >
            <MenuItem value="" disabled>
              Select a daemon pod
            </MenuItem>
            {pods.map(pod => (
              <MenuItem key={pod.name} value={pod.name}>
                {pod.name} {pod.nodeName ? `(${pod.nodeName})` : ''}{' '}
                {!pod.ready ? '(Not Ready)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {actionError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {actionError}
        </Typography>
      )}
      {actionSuccess && (
        <Typography sx={{ mb: 2, color: 'success.main' }}>{actionSuccess}</Typography>
      )}

      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Switch positions reflect actions taken in this panel during this session; the daemon does
          not expose current toggle state.
        </Typography>
        <FeatureRow label="Monitoring (Master Switch)" endpoint={DAEMON_ENDPOINTS.MONITORING} />
        <Divider />
        <FeatureRow label="Access Logs" endpoint={DAEMON_ENDPOINTS.ACCESSLOG} />
        <Divider />
        <FeatureRow label="Workload Metrics" endpoint={DAEMON_ENDPOINTS.WORKLOAD_METRICS} />
        <Divider />
        <FeatureRow label="Connection Metrics" endpoint={DAEMON_ENDPOINTS.CONNECTION_METRICS} />
        <Divider />
        <FeatureRow label="XDP Authz Offloading" endpoint={DAEMON_ENDPOINTS.AUTHZ} />
        <Divider />

        <Box display="flex" alignItems="center" py={3} gap={2}>
          <Typography variant="body1" sx={{ minWidth: 100 }}>
            Log Level:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="logger-label">Logger</InputLabel>
            <Select
              labelId="logger-label"
              id="logger-select"
              value={selectedLogger}
              label="Logger"
              onChange={e => setSelectedLogger(e.target.value as string)}
              disabled={
                loadingAction !== null ||
                !selectedPodName ||
                !selectedPodReady ||
                loggersStatus !== 'success'
              }
            >
              {(loggers && loggers.length > 0 ? loggers : ['bpf', 'kmesh', 'cni']).map(logger => (
                <MenuItem key={logger} value={logger}>
                  {logger}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="level-label">Level</InputLabel>
            <Select
              labelId="level-label"
              id="level-select"
              value={selectedLevel}
              label="Level"
              onChange={e => setSelectedLevel(e.target.value as string)}
              disabled={loadingAction !== null || !selectedPodName || !selectedPodReady}
            >
              {LOG_LEVELS.map(lvl => (
                <MenuItem key={lvl} value={lvl}>
                  {lvl}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSetLogLevel}
            disabled={
              loadingAction !== null ||
              !selectedPodName ||
              !selectedPodReady ||
              loggersStatus !== 'success'
            }
          >
            Set Level
          </Button>
        </Box>
      </Box>
    </SectionBox>
  );
}

import { ConfigStore, K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import { type ChangeEvent, type ReactNode, useEffect, useId, useState } from 'react';

interface AutoSaveSwitchProps {
  label: string;
  onSave: (value: boolean) => void;
  defaultValue?: boolean;
  helperText?: ReactNode;
  describedBy?: string;
}

function AutoSaveSwitch({
  label,
  onSave,
  defaultValue,
  helperText = null,
  describedBy,
}: AutoSaveSwitchProps) {
  const [value, setValue] = useState(defaultValue);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setValue(newValue);

    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => onSave(newValue), 100);
    setTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return (
    <>
      <Switch
        checked={value}
        inputProps={{ 'aria-label': label, 'aria-describedby': describedBy }}
        onChange={handleChange}
      />
      {helperText && <FormHelperText sx={{ ml: 1.75, mt: 0.5 }}>{helperText}</FormHelperText>}
    </>
  );
}

function SettingsRows({ rows }: { rows: { name: string; value: ReactNode }[] }) {
  if (rows.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ mt: 2, px: 2 }}>
      {rows.map(row => (
        <Box
          component="label"
          key={row.name}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            alignItems: 'center',
            gap: 2,
            py: 1.5,
            cursor: 'pointer',
            '&:not(:last-child)': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Typography component="span" sx={{ overflowWrap: 'anywhere' }}>
            {row.name}
          </Typography>
          <Box component="span">{row.value}</Box>
        </Box>
      ))}
    </Paper>
  );
}

export interface PluginConfig {
  linkHRelToKs: boolean;
  overviewShowFilter: 'configured' | 'all';
  overviewSortFilter: string;
  /** Clusters, by name, where mutating actions are shown on Flux-managed resources. */
  allowFluxManagedActions: Record<string, boolean>;
}

const DEFAULT_CONFIG: PluginConfig = {
  linkHRelToKs: false,
  overviewShowFilter: 'configured',
  overviewSortFilter: 'failed',
  allowFluxManagedActions: {},
};

export const store = new ConfigStore<PluginConfig>('@headlamp-k8s/flux');

/**
 * Whether mutating actions are shown on Flux-managed resources in the given cluster.
 * Clusters that were never opted in, including newly added ones, keep them hidden.
 */
export function areFluxManagedActionsAllowed(
  config: Partial<PluginConfig> | undefined,
  cluster: string
): boolean {
  return config?.allowFluxManagedActions?.[cluster] === true;
}

export function FluxSettings() {
  const { t } = useTranslation();
  const linkHRelLabel = t('Link HelmReleases to Kustomizations instead of HelmRepositories');
  const clusters = K8s.useClustersConf() || {};
  const actionsWarningId = useId();
  const [currentConfig, setCurrentConfig] = useState<PluginConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...store.get(),
  }));

  // Merge into the latest stored config rather than this render's snapshot, so
  // switches saved within the same debounce window don't overwrite each other.
  function handleSave(update: Partial<PluginConfig>) {
    store.update(update);
    setCurrentConfig(prev => ({ ...prev, ...update }));
  }

  function handleClusterActionsSave(cluster: string, allowed: boolean) {
    handleSave({
      allowFluxManagedActions: { ...store.get()?.allowFluxManagedActions, [cluster]: allowed },
    });
  }

  const settingsRows = [
    {
      name: linkHRelLabel,
      value: (
        <AutoSaveSwitch
          label={linkHRelLabel}
          defaultValue={currentConfig?.linkHRelToKs}
          onSave={value => handleSave({ linkHRelToKs: value })}
        />
      ),
    },
  ];

  const resourceActionsRows = Object.keys(clusters).map(cluster => ({
    name: cluster,
    value: (
      <AutoSaveSwitch
        key={cluster}
        label={t(
          'Show edit, scale, delete and rollback actions on Flux-managed resources in {{cluster}}',
          { cluster }
        )}
        defaultValue={areFluxManagedActionsAllowed(currentConfig, cluster)}
        onSave={allowed => handleClusterActionsSave(cluster, allowed)}
        describedBy={actionsWarningId}
      />
    ),
  }));

  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h5" component="h2">
        {t('Map settings')}
      </Typography>
      <SettingsRows rows={settingsRows} />
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2">
          {t('Resource actions')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('Show edit, scale, delete and rollback actions on Flux-managed resources')}
        </Typography>
        <Typography
          variant="caption"
          component="p"
          color="text.secondary"
          id={actionsWarningId}
          sx={{ mt: 0.5 }}
        >
          {t(
            'Changes made in Headlamp may be reverted by Flux on the next reconciliation, or leave the cluster out of sync with Git. Intended for testing in non-production clusters.'
          )}
        </Typography>
        <SettingsRows rows={resourceActionsRows} />
      </Box>
    </Box>
  );
}

import { ConfigStore, K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import Switch from '@mui/material/Switch';
import { type ChangeEvent, type ReactNode, useId, useState } from 'react';

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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setValue(newValue);
    onSave(newValue);
  };

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
  // a save only changes the settings it was given.
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
    <Box style={{ paddingTop: '8vh' }}>
      <Typography variant="h6">{t('Map settings')}</Typography>
      <NameValueTable rows={settingsRows} />
      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('Resource actions')}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {t('Show edit, scale, delete and rollback actions on Flux-managed resources')}
      </Typography>
      <FormHelperText id={actionsWarningId}>
        {t(
          'Changes made in Headlamp may be reverted by Flux on the next reconciliation, or leave the cluster out of sync with Git. Intended for testing in non-production clusters.'
        )}
      </FormHelperText>
      <NameValueTable rows={resourceActionsRows} />
    </Box>
  );
}

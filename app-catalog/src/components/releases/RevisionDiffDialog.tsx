import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { DiffEditor } from '@monaco-editor/react';
import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { jsonToYAML } from '../../helpers';

export interface RevisionDiffDialogProps {
  open: boolean;
  onClose: () => void;
  releaseName: string;
  releaseNamespace: string;
  releases: any[];
  initialBaseVersion?: number;
  initialTargetVersion?: number;
}

/**
 * Dialog displaying a side-by-side Monaco DiffEditor comparing values between two revisions.
 */
export function RevisionDiffDialog({
  open,
  onClose,
  releaseName,
  releaseNamespace,
  releases,
  initialBaseVersion,
  initialTargetVersion,
}: RevisionDiffDialogProps) {
  const { t } = useTranslation();
  const sortedReleases = useMemo(
    () => (releases ? [...releases].sort((a, b) => b.version - a.version) : []),
    [releases]
  );

  const defaultTarget = useMemo(() => {
    if (initialTargetVersion !== undefined) return initialTargetVersion;
    return sortedReleases.length > 0 ? sortedReleases[0].version : 1;
  }, [initialTargetVersion, sortedReleases]);

  const defaultBase = useMemo(() => {
    if (initialBaseVersion !== undefined) return initialBaseVersion;
    if (sortedReleases.length > 1) {
      return sortedReleases[1].version;
    }
    return sortedReleases.length > 0 ? sortedReleases[0].version : 1;
  }, [initialBaseVersion, sortedReleases]);

  const [baseVersion, setBaseVersion] = useState<number>(defaultBase);
  const [targetVersion, setTargetVersion] = useState<number>(defaultTarget);
  const [isUserValuesOnly, setIsUserValuesOnly] = useState(false);

  useEffect(() => {
    if (open) {
      setBaseVersion(defaultBase);
      setTargetVersion(defaultTarget);
    }
  }, [open, defaultBase, defaultTarget]);

  const themeName =
    typeof window !== 'undefined' ? localStorage.getItem('headlampThemePreference') : null;

  const baseRelease = useMemo(
    () => sortedReleases.find(r => r.version === baseVersion),
    [sortedReleases, baseVersion]
  );

  const targetRelease = useMemo(
    () => sortedReleases.find(r => r.version === targetVersion),
    [sortedReleases, targetVersion]
  );

  const baseYaml = useMemo(() => {
    if (!baseRelease) return '';
    const userConfig = baseRelease.config || {};
    const chartValues = baseRelease.chart?.values || {};
    const valuesObj = isUserValuesOnly ? userConfig : Object.assign({}, chartValues, userConfig);
    return jsonToYAML(valuesObj);
  }, [baseRelease, isUserValuesOnly]);

  const targetYaml = useMemo(() => {
    if (!targetRelease) return '';
    const userConfig = targetRelease.config || {};
    const chartValues = targetRelease.chart?.values || {};
    const valuesObj = isUserValuesOnly ? userConfig : Object.assign({}, chartValues, userConfig);
    return jsonToYAML(valuesObj);
  }, [targetRelease, isUserValuesOnly]);

  const handleSwap = () => {
    setBaseVersion(targetVersion);
    setTargetVersion(baseVersion);
  };

  return (
    <Dialog
      open={open}
      maxWidth="lg"
      fullWidth
      withFullScreen
      onClose={onClose}
      title={
        releaseNamespace
          ? t('Compare Revisions - {{ releaseName }} ({{ releaseNamespace }})', {
              releaseName,
              releaseNamespace,
            })
          : t('Compare Revisions - {{ releaseName }}', { releaseName })
      }
    >
      <Box px={3} pt={1} pb={1} display="flex" flexDirection="column" gap={1.5}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel id="base-revision-label">{t('Base Revision')}</InputLabel>
              <Select
                labelId="base-revision-label"
                id="base-revision-select"
                value={baseVersion}
                label={t('Base Revision')}
                onChange={e => setBaseVersion(Number(e.target.value))}
              >
                {sortedReleases.map(r => (
                  <MenuItem key={r.version} value={r.version}>
                    {t('Revision {{ version }}', { version: r.version })}
                    {r.chart?.metadata?.version ? ` (${r.chart.metadata.version})` : ''}
                    {r.info?.last_deployed
                      ? ` - ${new Date(r.info.last_deployed).toLocaleDateString()}`
                      : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2} textAlign="center">
            <Tooltip title={t('Swap revisions')}>
              <IconButton onClick={handleSwap} size="small" aria-label={t('Swap revisions')}>
                <Icon icon="mdi:swap-horizontal" width={24} height={24} />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel id="target-revision-label">{t('Compare With')}</InputLabel>
              <Select
                labelId="target-revision-label"
                id="target-revision-select"
                value={targetVersion}
                label={t('Compare With')}
                onChange={e => setTargetVersion(Number(e.target.value))}
              >
                {sortedReleases.map(r => (
                  <MenuItem key={r.version} value={r.version}>
                    {t('Revision {{ version }}', { version: r.version })}
                    {r.chart?.metadata?.version ? ` (${r.chart.metadata.version})` : ''}
                    {r.info?.last_deployed
                      ? ` - ${new Date(r.info.last_deployed).toLocaleDateString()}`
                      : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <FormControlLabel
            control={
              <Checkbox
                checked={isUserValuesOnly}
                onChange={e => setIsUserValuesOnly(e.target.checked)}
                inputProps={{ 'aria-label': t('Show user defined values only') }}
                size="small"
              />
            }
            label={<Typography variant="body2">{t('User defined values only')}</Typography>}
          />
          <Typography variant="caption" color="textSecondary">
            {baseVersion === targetVersion
              ? t('Both panes display the same revision')
              : t('Left: Revision {{ base }} | Right: Revision {{ target }}', {
                  base: baseVersion,
                  target: targetVersion,
                })}
          </Typography>
        </Box>
      </Box>
      <DialogContent sx={{ p: 2, height: '520px' }}>
        <DiffEditor
          original={baseYaml}
          modified={targetYaml}
          language="yaml"
          height="100%"
          theme={themeName === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined">
          {t('Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

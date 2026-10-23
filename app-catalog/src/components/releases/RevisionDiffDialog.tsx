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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { jsonToYAML, mergeHelmValues } from '../../helpers';

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

  const defaultTarget = useMemo<number | ''>(() => {
    if (
      initialTargetVersion !== undefined &&
      sortedReleases.some(r => r.version === initialTargetVersion)
    ) {
      return initialTargetVersion;
    }
    return sortedReleases.length > 0 ? sortedReleases[0].version : '';
  }, [initialTargetVersion, sortedReleases]);

  const defaultBase = useMemo<number | ''>(() => {
    if (
      initialBaseVersion !== undefined &&
      sortedReleases.some(r => r.version === initialBaseVersion)
    ) {
      return initialBaseVersion;
    }
    if (sortedReleases.length > 1) {
      return sortedReleases[1].version;
    }
    return sortedReleases.length > 0 ? sortedReleases[0].version : '';
  }, [initialBaseVersion, sortedReleases]);

  const [baseVersion, setBaseVersion] = useState<number | ''>(defaultBase);
  const [targetVersion, setTargetVersion] = useState<number | ''>(defaultTarget);
  const [isUserValuesOnly, setIsUserValuesOnly] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      setBaseVersion(defaultBase);
      setTargetVersion(defaultTarget);
    }
  }, [open, defaultBase, defaultTarget]);

  const selectedBaseVersion = sortedReleases.some(r => r.version === baseVersion)
    ? baseVersion
    : '';
  const selectedTargetVersion = sortedReleases.some(r => r.version === targetVersion)
    ? targetVersion
    : '';

  const baseRelease = useMemo(
    () => sortedReleases.find(r => r.version === selectedBaseVersion),
    [sortedReleases, selectedBaseVersion]
  );

  const targetRelease = useMemo(
    () => sortedReleases.find(r => r.version === selectedTargetVersion),
    [sortedReleases, selectedTargetVersion]
  );

  const baseYaml = useMemo(() => {
    if (!baseRelease) return '';
    const userConfig = baseRelease.config || {};
    const chartValues = baseRelease.chart?.values || {};
    const valuesObj = isUserValuesOnly
      ? userConfig
      : mergeHelmValues(chartValues, userConfig, baseRelease.chart);
    return jsonToYAML(valuesObj);
  }, [baseRelease, isUserValuesOnly]);

  const targetYaml = useMemo(() => {
    if (!targetRelease) return '';
    const userConfig = targetRelease.config || {};
    const chartValues = targetRelease.chart?.values || {};
    const valuesObj = isUserValuesOnly
      ? userConfig
      : mergeHelmValues(chartValues, userConfig, targetRelease.chart);
    return jsonToYAML(valuesObj);
  }, [targetRelease, isUserValuesOnly]);

  const handleSwap = () => {
    if (selectedBaseVersion === '' || selectedTargetVersion === '') return;
    setBaseVersion(selectedTargetVersion);
    setTargetVersion(selectedBaseVersion);
  };

  const canSwap =
    selectedBaseVersion !== '' &&
    selectedTargetVersion !== '' &&
    selectedBaseVersion !== selectedTargetVersion;

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
                value={selectedBaseVersion}
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
              <span>
                <IconButton
                  onClick={handleSwap}
                  disabled={!canSwap}
                  size="small"
                  aria-label={t('Swap revisions')}
                >
                  <Icon icon="mdi:swap-horizontal" width={24} height={24} />
                </IconButton>
              </span>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel id="target-revision-label">{t('Compare With')}</InputLabel>
              <Select
                labelId="target-revision-label"
                id="target-revision-select"
                value={selectedTargetVersion}
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
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
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
          {selectedBaseVersion !== '' && selectedTargetVersion !== '' && (
            <Typography variant="caption" color="textSecondary">
              {selectedBaseVersion === selectedTargetVersion
                ? t('Both panes display the same revision')
                : t('Left: Revision {{ base }} | Right: Revision {{ target }}', {
                    base: selectedBaseVersion,
                    target: selectedTargetVersion,
                  })}
            </Typography>
          )}
        </Box>
      </Box>
      <DialogContent
        sx={{
          p: 2,
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            flex: '1 1 auto',
            minHeight: { xs: '320px', sm: '480px' },
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0 }}>
            {open && (
              <DiffEditor
                original={baseYaml}
                modified={targetYaml}
                language="yaml"
                height="100%"
                theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  readOnly: true,
                  renderSideBySide: !isSmallScreen,
                  ignoreTrimWhitespace: false,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined">
          {t('Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

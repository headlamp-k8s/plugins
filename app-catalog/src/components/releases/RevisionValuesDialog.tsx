import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Editor from '@monaco-editor/react';
import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';
import { jsonToYAML } from '../../helpers';

export interface RevisionValuesDialogProps {
  open: boolean;
  onClose: () => void;
  releaseName: string;
  releaseNamespace: string;
  revision: any | null;
}

/**
 * Dialog displaying read-only Helm values for a specific release revision.
 */
export function RevisionValuesDialog({
  open,
  onClose,
  releaseName,
  releaseNamespace,
  revision,
}: RevisionValuesDialogProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [isUserValuesOnly, setIsUserValuesOnly] = useState(false);

  const themeName =
    typeof window !== 'undefined' ? localStorage.getItem('headlampThemePreference') : null;

  const yamlContent = useMemo(() => {
    if (!revision) return '';
    const userConfig = revision.config || {};
    const chartValues = revision.chart?.values || {};
    const valuesObj = isUserValuesOnly ? userConfig : Object.assign({}, chartValues, userConfig);
    return jsonToYAML(valuesObj);
  }, [revision, isUserValuesOnly]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent);
      enqueueSnackbar(t('Values copied to clipboard'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('Failed to copy values to clipboard'), { variant: 'error' });
    }
  };

  if (!revision) return null;

  const chartName = revision.chart?.metadata?.name || '';
  const chartVersion = revision.chart?.metadata?.version || '';
  const appVersion = revision.chart?.metadata?.appVersion || '';

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      withFullScreen
      onClose={onClose}
      title={
        releaseNamespace
          ? t('Revision {{ version }} Values - {{ releaseName }} ({{ releaseNamespace }})', {
              version: revision.version,
              releaseName,
              releaseNamespace,
            })
          : t('Revision {{ version }} Values - {{ releaseName }}', {
              version: revision.version,
              releaseName,
            })
      }
    >
      <Box px={3} pt={1} pb={0} display="flex" flexDirection="column" gap={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Box display="flex" gap={2} alignItems="center">
            {chartName && (
              <Typography variant="body2" color="textSecondary">
                {t('Chart')}: <strong>{chartName}</strong> ({chartVersion})
              </Typography>
            )}
            {appVersion && (
              <Typography variant="body2" color="textSecondary">
                {t('App Version')}: <strong>{appVersion}</strong>
              </Typography>
            )}
            {revision.info?.description && (
              <Typography variant="body2" color="textSecondary">
                {revision.info.description}
              </Typography>
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
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
            <Tooltip title={t('Copy to clipboard')}>
              <IconButton onClick={handleCopy} size="small" aria-label={t('Copy to clipboard')}>
                <Icon icon="mdi:content-copy" width={20} height={20} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      <DialogContent sx={{ p: 2, height: '500px' }}>
        <Editor
          value={yamlContent}
          language="yaml"
          height="100%"
          theme={themeName === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            lineNumbers: 'on',
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

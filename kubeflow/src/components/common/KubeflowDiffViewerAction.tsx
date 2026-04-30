import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import { DiffEditor } from '@monaco-editor/react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

interface KubeflowDiffViewerProps {
  title: string;
  original: string;
  modified: string;
  originalLabel: string;
  modifiedLabel: string;
  language?: string;
  activityId?: string;
}

/**
 * Component that renders a Monaco diff viewer.
 * Designed to be launched via Activity.launch().
 */
export function KubeflowDiffViewer({
  title,
  original,
  modified,
  originalLabel,
  modifiedLabel,
  language = 'yaml',
}: KubeflowDiffViewerProps) {
  const theme = useTheme();

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 3, flexGrow: 1, minHeight: 0 }}>
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {originalLabel}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {modifiedLabel}
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ height: 'calc(100% - 40px)', width: '100%' }}>
          <DiffEditor
            original={original}
            modified={modified}
            language={language}
            theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Launches a full-screen diff viewer in a new Headlamp tab/activity.
 */
export function launchKubeflowDiffViewer(props: KubeflowDiffViewerProps) {
  const defaultId = `diff-viewer-${props.title.replace(/\s+/g, '-').toLowerCase()}`;
  Activity.launch({
    id: props.activityId || defaultId,
    title: props.title,
    icon: <Icon icon="mdi:compare" width="100%" height="100%" />,
    location: 'full',
    content: <KubeflowDiffViewer {...props} />,
  });
}

/**
 * Renders an action that opens a read-only Monaco diff viewer in a new tab.
 */
export function KubeflowDiffViewerAction(props: KubeflowDiffViewerProps) {
  return (
    <ActionButton
      description={props.title}
      icon="mdi:compare"
      onClick={() => launchKubeflowDiffViewer(props)}
    />
  );
}

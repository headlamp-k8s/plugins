import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import Editor from '@monaco-editor/react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

/**
 * Props for the KubeflowJsonViewer component and its launch actions.
 * @see {@link https://microsoft.github.io/monaco-editor/ Monaco Editor}
 */
interface KubeflowJsonViewerProps {
  /** The title displayed in the viewer header and tab. */
  title: string;
  /** The JSON object or raw JSON string to be formatted and displayed. */
  value: unknown;
  /** Optional ID for the Headlamp Activity to prevent opening duplicate tabs. */
  activityId?: string;
}

/**
 * Component that renders a Monaco JSON viewer.
 * Designed to be launched via Activity.launch().
 */
export function KubeflowJsonViewer({ title, value }: KubeflowJsonViewerProps) {
  const theme = useTheme();
  let serializedValue = '';

  if (typeof value === 'string') {
    try {
      // Attempt to parse and re-stringify to ensure pretty printing
      serializedValue = JSON.stringify(JSON.parse(value), null, 2);
    } catch (e) {
      // Fallback to the string itself if not valid JSON, converting literal \n
      // and only normalizing bare LF line endings without corrupting existing CRLF.
      serializedValue = value.replace(/\\n/g, '\n').replace(/(^|[^\r])\n/g, '$1\r\n');
    }
  } else {
    serializedValue = JSON.stringify(value, null, 2);
  }

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <Editor
          value={serializedValue}
          language="json"
          theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </Box>
    </Box>
  );
}

/**
 * Launches a full-screen JSON viewer in a new Headlamp tab/activity.
 */
export function launchKubeflowJsonViewer(title: string, value: unknown, activityId?: string) {
  const defaultId = `json-viewer-${title.replace(/\s+/g, '-').toLowerCase()}`;
  Activity.launch({
    id: activityId || defaultId,
    title: title,
    icon: <Icon icon="mdi:code-json" width="100%" height="100%" />,
    location: 'full',
    content: <KubeflowJsonViewer title={title} value={value} />,
  });
}

/**
 * Renders a details-page action that opens a read-only Monaco JSON viewer in a new tab.
 */
export function KubeflowJsonViewerAction({ title, value, activityId }: KubeflowJsonViewerProps) {
  return (
    <ActionButton
      description={title}
      icon="mdi:code-json"
      onClick={() => launchKubeflowJsonViewer(title, value, activityId)}
    />
  );
}

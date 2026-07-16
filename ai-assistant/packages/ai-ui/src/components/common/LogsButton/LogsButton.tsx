/**
 * LogsButton — inline button that opens a {@link LogsDialog} for a resource.
 *
 * Renders a compact paper card with a "View in Editor" button. Clicking the
 * button opens the full log viewer dialog. This component has no
 * headlamp-plugin dependency and can be used in any React + MUI context.
 */

import { Icon } from '@iconify/react';
import { Box, Button, Dialog, Paper, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildLogTitle } from '../../../formatting/logFormatting';
import LogsDialog from '../LogsDialog/LogsDialog';

/** Props for the LogsButton component that shows a button to open a logs dialog. */
export interface LogsButtonProps {
  /** The raw log text content to display when the button is clicked. */
  logs: string;
  /** The Kubernetes resource name associated with these logs. */
  resourceName?: string;
  /** The type/kind of the Kubernetes resource (e.g. "Pod"). */
  resourceType?: string;
  /** The namespace of the Kubernetes resource. */
  namespace?: string;
  /** The container name within the pod, if applicable. */
  containerName?: string;
  /** Component used to render the dialog shell. Falls back to MUI Dialog. */
  DialogSlot?: React.ElementType;
}

/**
 * Inline card with a "View in Editor" button. Opens a {@link LogsDialog}
 * showing the log content for a Kubernetes resource.
 *
 * @param props - Log content, optional resource metadata, and dialog slot.
 * @returns Log summary card and full log dialog.
 */
const LogsButton: React.FC<LogsButtonProps> = ({
  logs,
  resourceName,
  resourceType,
  namespace,
  containerName,
  DialogSlot = Dialog,
}) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const effectiveResourceName = resourceName || t('resource');
  const effectiveResourceType = resourceType || t('Resource');
  const title = buildLogTitle(
    effectiveResourceType,
    effectiveResourceName,
    containerName,
    namespace
  );

  return (
    <>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          my: 1,
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 1,
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {title}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:code-braces" aria-hidden="true" />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            {t('View in Editor')}
          </Button>
        </Box>
      </Paper>

      <LogsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        logs={logs}
        title={title}
        resourceName={effectiveResourceName}
        DialogSlot={DialogSlot}
      />
    </>
  );
};

export default LogsButton;

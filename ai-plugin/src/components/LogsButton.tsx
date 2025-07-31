import { Icon } from '@iconify/react';
import { Box, Button, Paper, Typography } from '@mui/material';
import React, { useState } from 'react';
import LogsDialog from './LogsDialog';

interface LogsButtonProps {
  logs: string;
  resourceName?: string;
  resourceType?: string;
  namespace?: string;
}

const LogsButton: React.FC<LogsButtonProps> = ({
  logs,
  resourceName = 'resource',
  resourceType = 'Resource',
  namespace,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const getTitle = () => {
    const parts = [resourceType];
    if (resourceName) {
      parts.push(resourceName);
    }
    if (namespace) {
      parts.push(`(${namespace})`);
    }
    parts.push('Logs');
    return parts.join(' ');
  };

  const getLogLineCount = () => {
    if (!logs) return 0;
    return logs.split('\n').filter(line => line.trim().length > 0).length;
  };

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
              {getTitle()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getLogLineCount()} log lines available
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:text-box-outline" />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            View Logs
          </Button>
        </Box>
      </Paper>

      <LogsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        logs={logs}
        title={getTitle()}
        resourceName={resourceName}
      />
    </>
  );
};

export default LogsButton;

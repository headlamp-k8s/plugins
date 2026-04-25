import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Typography } from '@mui/material';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { getSettingsURL } from '../../utils';

interface AIAssistantHeaderProps {
  isTestMode: boolean;
  disableSettingsButton: boolean;
  onClose: () => void;
}

export default function AIAssistantHeader({
  isTestMode,
  disableSettingsButton,
  onClose,
}: AIAssistantHeaderProps) {
  const history = useHistory();

  return (
    <Box
      sx={{
        padding: 1,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6">
          AI Assistant (alpha)
          {isTestMode && (
            <Chip
              label="TEST MODE"
              color="warning"
              size="small"
              sx={{ ml: 1, fontSize: '0.7rem' }}
            />
          )}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ActionButton
          description="Settings"
          onClick={() => {
            history.push(getSettingsURL());
          }}
          icon="mdi:settings"
          iconButtonProps={{
            disabled: disableSettingsButton,
          }}
        />
        <ActionButton description="Close" onClick={onClose} icon="mdi:close" />
      </Box>
    </Box>
  );
}

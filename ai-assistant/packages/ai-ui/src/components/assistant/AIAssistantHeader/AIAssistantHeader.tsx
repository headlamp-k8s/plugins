import { Box, Chip, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultActionButton } from '../../defaults/DefaultSlots/DefaultSlots';

/** Props accepted by the ActionButton slot component. */
export interface ActionButtonSlotProps {
  /** Short description shown as a tooltip. */
  description: string;
  /** Iconify icon identifier. */
  icon: string;
  /** Click handler. */
  onClick: React.MouseEventHandler<HTMLElement>;
  /** Additional props forwarded to the underlying IconButton. */
  iconButtonProps?: Record<string, any>;
}

/** Props for the AIAssistantHeader component displayed at the top of the assistant panel. */
export interface AIAssistantHeaderProps {
  /** Whether the assistant is operating in test mode. */
  isTestMode: boolean;
  /** Whether the settings navigation button should be disabled. */
  disableSettingsButton: boolean;
  /** Callback invoked when the user closes the assistant panel. */
  onClose: () => void;
  /** Callback invoked when the user clicks the settings button. */
  onSettings: () => void;
  /** Component used to render icon action buttons. Falls back to MUI IconButton + Tooltip. */
  ActionButtonSlot?: React.ComponentType<ActionButtonSlotProps>;
}

export default function AIAssistantHeader({
  isTestMode,
  disableSettingsButton,
  onClose,
  onSettings,
  ActionButtonSlot = DefaultActionButton,
}: AIAssistantHeaderProps) {
  const { t } = useTranslation();
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
          {t('AI Assistant (preview)')}
          {isTestMode && (
            <Chip
              label={t('TEST MODE')}
              color="warning"
              size="small"
              sx={{ ml: 1, fontSize: '0.7rem' }}
            />
          )}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ActionButtonSlot
          description={t('Settings')}
          icon="mdi:settings"
          onClick={onSettings}
          iconButtonProps={{ disabled: disableSettingsButton, size: 'small' }}
        />
        <ActionButtonSlot
          description={t('Close')}
          icon="mdi:close"
          onClick={onClose}
          iconButtonProps={{ size: 'small' }}
        />
      </Box>
    </Box>
  );
}

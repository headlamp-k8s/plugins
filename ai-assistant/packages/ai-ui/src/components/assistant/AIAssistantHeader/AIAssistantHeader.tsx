import { Icon } from '@iconify/react';
import { Box, Chip, IconButton, type IconButtonProps, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Props accepted by the ActionButton slot component. */
export interface ActionButtonSlotProps {
  /** Short description shown as a tooltip. */
  description: string;
  /** Iconify icon identifier. */
  icon: string;
  /** Click handler forwarded to the underlying icon button. */
  onClick: NonNullable<IconButtonProps['onClick']>;
  /** Additional props forwarded to the underlying IconButton. */
  iconButtonProps?: IconButtonProps;
}

/** Props for the AIAssistantHeader component displayed at the top of the assistant panel. */
export interface AIAssistantHeaderProps {
  /** Whether the assistant is operating in test mode. */
  isTestMode: boolean;
  /** Whether the settings navigation button should be disabled. */
  disableSettingsButton: boolean;
  /** Callback invoked when the user closes the assistant panel. @returns No value. */
  onClose: () => void;
  /** Callback invoked when the user clicks the settings button. @returns No value. */
  onSettings: () => void;
  /** Component used to render icon action buttons. Falls back to MUI IconButton + Tooltip. */
  ActionButtonSlot?: React.ComponentType<ActionButtonSlotProps>;
}

/**
 * Renders the standalone MUI fallback for header action slots.
 *
 * @param props - Action description, icon, callback, and button props.
 * @returns Tooltip-wrapped icon button.
 */
function DefaultHeaderAction({
  description,
  icon,
  onClick,
  iconButtonProps,
}: ActionButtonSlotProps): React.ReactElement {
  return (
    <Tooltip title={description}>
      <IconButton onClick={onClick} {...iconButtonProps}>
        <Icon icon={icon} aria-hidden="true" />
      </IconButton>
    </Tooltip>
  );
}

/**
 * Renders the assistant panel heading and settings/close actions.
 *
 * @param props - Header mode, action state, callbacks, and optional action slot.
 * @returns Assistant panel header UI.
 */
export default function AIAssistantHeader({
  isTestMode,
  disableSettingsButton,
  onClose,
  onSettings,
  ActionButtonSlot = DefaultHeaderAction,
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6">{t('AI Assistant (preview)')}</Typography>
        {isTestMode && (
          <Chip label={t('TEST MODE')} color="warning" size="small" sx={{ fontSize: '0.7rem' }} />
        )}
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

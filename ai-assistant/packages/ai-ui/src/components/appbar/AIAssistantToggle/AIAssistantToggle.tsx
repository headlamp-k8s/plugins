/**
 * App-bar toggle button for an AI assistant panel.
 *
 * Renders a toggle button that opens/closes the AI panel. When no model
 * provider has been configured, shows a one-time configuration popover
 * prompting the user to open settings.
 *
 * Framework-agnostic: depends only on MUI and Iconify — no headlamp-plugin
 * imports. The host application injects behaviour via callback props.
 */

import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Popper,
  ToggleButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Props for the {@link AIAssistantToggle} component. */
export interface AIAssistantToggleProps {
  /** Whether the assistant panel is currently open. */
  isOpen: boolean;
  /** Callback invoked when the user clicks the toggle button. @returns No value. */
  onToggle: () => void;
  /** Whether to show the "configure your provider" popover. */
  showConfigPrompt: boolean;
  /** Callback invoked when the user dismisses the configuration popover. @returns No value. */
  onDismissPrompt: () => void;
  /** Callback invoked when the user clicks "Open Settings" in the popover. @returns No value. */
  onConfigure: () => void;
  /** Iconify icon identifier displayed on the toggle button. */
  icon?: string;
  /** Tooltip text for the toggle button. */
  tooltipTitle?: string;
}

/**
 * Toggle button with an optional configuration popover.
 *
 * Designed to sit in an application top bar. The popover appears once when
 * no AI provider is configured and disappears after the user dismisses or
 * navigates to settings.
 *
 * @param props - Toggle state, callbacks, and optional presentation overrides.
 * @returns App-bar toggle and optional configuration prompt.
 */
export default function AIAssistantToggle({
  isOpen,
  onToggle,
  showConfigPrompt,
  onDismissPrompt,
  onConfigure,
  icon = 'mdi:assistant',
  tooltipTitle,
}: AIAssistantToggleProps) {
  const { t } = useTranslation();
  const [popoverAnchor, setPopoverAnchor] = React.useState<HTMLElement | null>(null);
  const theme = useTheme();
  const effectiveTooltipTitle = tooltipTitle?.trim() || t('AI Assistant');
  const handleToggleRef = React.useCallback((element: HTMLElement | null): void => {
    setPopoverAnchor(element);
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={effectiveTooltipTitle}>
        <ToggleButton
          ref={handleToggleRef}
          aria-label={effectiveTooltipTitle}
          onClick={onToggle}
          selected={isOpen}
          size="small"
          value="ai-assistant"
        >
          <Icon icon={icon} width="24px" color={theme.palette.text.primary} aria-hidden="true" />
        </ToggleButton>
      </Tooltip>

      <Popper
        open={showConfigPrompt && !!popoverAnchor}
        anchorEl={popoverAnchor}
        placement="bottom"
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ]}
        sx={{
          zIndex: theme.zIndex.modal,
        }}
      >
        <Paper
          role="dialog"
          aria-label={t('Configure AI Assistant')}
          elevation={8}
          sx={{
            p: 2,
            maxWidth: 300,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {t('Configure AI Assistant')}
            </Typography>
            <IconButton
              size="small"
              aria-label={t('Dismiss configuration prompt')}
              onClick={onDismissPrompt}
              sx={{ ml: 1, mt: -0.5 }}
            >
              <Icon icon="mdi:close" aria-hidden="true" />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            {t(
              'To use the AI Assistant, you need to configure at least one AI model provider in the settings.'
            )}
          </Typography>
          <Button variant="contained" size="small" onClick={onConfigure} fullWidth>
            {t('Open Settings')}
          </Button>
        </Paper>
      </Popper>
    </Box>
  );
}

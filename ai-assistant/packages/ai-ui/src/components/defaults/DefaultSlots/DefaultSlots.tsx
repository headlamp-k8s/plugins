/**
 * Default MUI-based fallback implementations for slot props.
 *
 * These are used when headlamp-plugin components are not injected,
 * allowing ai-ui components to work standalone with plain MUI.
 */

import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ActionButtonSlotProps } from '../../assistant/AIAssistantHeader/AIAssistantHeader';

/**
 * Default dialog implementation using MUI Dialog.
 *
 * Accepts the same props as headlamp's Dialog component
 * (`open`, `onClose`, `maxWidth`, `fullWidth`, `PaperProps`, `children`).
 */
export const DefaultDialog: React.ElementType = Dialog;

/**
 * Default action button implementation using MUI IconButton + Tooltip + Iconify Icon.
 *
 * Provides the same API surface as headlamp's ActionButton:
 * `description` (tooltip), `icon` (Iconify ID), `onClick`, and `iconButtonProps`.
 */
export function DefaultActionButton({
  description,
  icon,
  onClick,
  iconButtonProps,
}: ActionButtonSlotProps) {
  return (
    <Tooltip title={description}>
      <IconButton onClick={onClick} {...iconButtonProps}>
        <Icon icon={icon} />
      </IconButton>
    </Tooltip>
  );
}

/**
 * Default confirm dialog implementation using MUI Dialog.
 *
 * Accepts props compatible with headlamp's ConfirmDialog:
 * `open`, `handleClose`, `onConfirm`, `title`, `description`, `confirmLabel`.
 */
export function DefaultConfirmDialog({
  open,
  handleClose,
  onConfirm,
  title,
  description,
  confirmLabel,
}: {
  open: boolean;
  handleClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {typeof description === 'string' ? (
          <DialogContentText>{description}</DialogContentText>
        ) : (
          description
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('Cancel')}</Button>
        <Button onClick={onConfirm} color="primary" variant="contained">
          {confirmLabel || t('Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Default editor dialog implementation using MUI Dialog with a textarea.
 *
 * Accepts props compatible with headlamp's EditorDialog:
 * `item`, `open`, `onClose`, `setOpen`, `saveLabel`, `onSave`, `title`.
 */
export function DefaultEditorDialog({
  item,
  open,
  onClose,
  setOpen,
  saveLabel,
  onSave,
  title,
}: {
  item: string;
  open: boolean;
  onClose: () => void;
  setOpen: (open: boolean) => void;
  saveLabel?: string;
  onSave: (content: string) => void;
  title?: string;
}) {
  const { t } = useTranslation();
  const [value, setValue] = React.useState(item);
  React.useEffect(() => {
    setValue(item);
  }, [item]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>
        <Box
          component="textarea"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
          sx={{
            width: '100%',
            minHeight: 300,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            resize: 'vertical',
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setOpen(false);
            onClose();
          }}
        >
          {t('Cancel')}
        </Button>
        <Button onClick={() => onSave(value)} color="primary" variant="contained">
          {saveLabel || t('Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Default content renderer that displays text content as-is.
 *
 * A minimal fallback for headlamp's ContentRenderer that renders
 * content as preformatted text. Does not support markdown or YAML detection.
 * The `onYamlDetected` prop is accepted for type compatibility but ignored.
 */
export function DefaultContentRenderer({
  content,
}: {
  content: string;
  /** Accepted for type compatibility with the ContentRenderer slot interface. */
  onYamlDetected?: (yaml: string) => void;
}) {
  return (
    <Typography
      component="pre"
      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', m: 0 }}
    >
      {content}
    </Typography>
  );
}

/**
 * Default section wrapper using a simple Box with title.
 *
 * Provides the same API surface as headlamp's SectionBox:
 * `title` and `children`.
 */
export function DefaultSectionWrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

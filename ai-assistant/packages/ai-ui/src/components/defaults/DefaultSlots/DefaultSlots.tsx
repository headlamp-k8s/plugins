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
 *
 * @param props - Action description, icon, callback, and button overrides.
 * @returns Accessible icon action button.
 */
export function DefaultActionButton({
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

/** Props accepted by {@link DefaultConfirmDialog}. */
export interface DefaultConfirmDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Closes the dialog without confirming. */
  handleClose: () => void;
  /** Confirms the requested operation. */
  onConfirm: () => void;
  /** Dialog title supplied by the host. */
  title: string;
  /** Dialog description supplied by the host. */
  description: React.ReactNode;
  /** Optional host-provided confirmation label. */
  confirmLabel?: string;
  /** Whether confirmation is temporarily disabled. */
  disabled?: boolean;
}

/**
 * Default confirm dialog implementation using MUI Dialog.
 *
 * Accepts props compatible with headlamp's ConfirmDialog:
 * `open`, `handleClose`, `onConfirm`, `title`, `description`, `confirmLabel`.
 *
 * @param props - Dialog state, content, labels, and action callbacks.
 * @returns Confirmation dialog.
 */
export function DefaultConfirmDialog({
  open,
  handleClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  disabled = false,
}: DefaultConfirmDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const titleId = React.useId();
  const descriptionId = React.useId();
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        {typeof description === 'string' ? (
          <DialogContentText id={descriptionId}>{description}</DialogContentText>
        ) : (
          <Box id={descriptionId}>{description}</Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={disabled}>
          {t('Cancel')}
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained" disabled={disabled}>
          {confirmLabel || t('Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Props accepted by {@link DefaultEditorDialog}. */
export interface DefaultEditorDialogProps {
  /** Current editor content. */
  item: string;
  /** Whether the dialog is open. */
  open: boolean;
  /** Notifies the host that editing was cancelled. */
  onClose: () => void;
  /** Updates the host-controlled open state. */
  setOpen: (open: boolean) => void;
  /** Optional host-provided save label. */
  saveLabel?: string;
  /** Saves the current editor content. */
  onSave: (content: string) => void;
  /** Optional host-provided dialog title. */
  title?: string;
  /** Whether editor actions are temporarily disabled. */
  disabled?: boolean;
}

/**
 * Default editor dialog implementation using MUI Dialog with a textarea.
 *
 * Accepts props compatible with headlamp's EditorDialog:
 * `item`, `open`, `onClose`, `setOpen`, `saveLabel`, `onSave`, `title`.
 *
 * @param props - Editor state, content, labels, and action callbacks.
 * @returns Accessible plain-text editor dialog.
 */
export function DefaultEditorDialog({
  item,
  open,
  onClose,
  setOpen,
  saveLabel,
  onSave,
  title,
  disabled = false,
}: DefaultEditorDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const [value, setValue] = React.useState(item);
  const effectiveTitle = title || t('Edit content');
  const titleId = React.useId();
  React.useEffect(() => {
    setValue(item);
  }, [item]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{effectiveTitle}</DialogTitle>
      <DialogContent>
        <Box
          component="textarea"
          aria-label={t('Content to edit')}
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
          disabled={disabled}
          onClick={() => {
            setOpen(false);
            onClose();
          }}
        >
          {t('Cancel')}
        </Button>
        <Button
          onClick={() => onSave(value)}
          color="primary"
          variant="contained"
          disabled={disabled}
        >
          {saveLabel || t('Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Props accepted by {@link DefaultContentRenderer}. */
export interface DefaultContentRendererProps {
  /** Plain text content to render. */
  content: string;
  /** Accepted for compatibility; the plain renderer performs no YAML detection. */
  onYamlDetected?: (yaml: string, resourceType: string) => void;
}

/**
 * Default content renderer that displays text content as-is.
 *
 * A minimal fallback for headlamp's ContentRenderer that renders
 * content as preformatted text. Does not support markdown or YAML detection.
 * The `onYamlDetected` prop is accepted for type compatibility but ignored.
 *
 * @param props - Plain text content and ignored compatibility callback.
 * @returns Plain text preserving whitespace and line breaks.
 */
export function DefaultContentRenderer({
  content,
}: DefaultContentRendererProps): React.ReactElement {
  return (
    <Typography
      component="div"
      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', m: 0 }}
    >
      {content}
    </Typography>
  );
}

/** Props accepted by {@link DefaultSectionWrapper}. */
export interface DefaultSectionWrapperProps {
  /** Section heading supplied by the host. */
  title: string;
  /** Section content. */
  children: React.ReactNode;
}

/**
 * Default section wrapper using a simple Box with title.
 *
 * Provides the same API surface as headlamp's SectionBox:
 * `title` and `children`.
 *
 * @param props - Section title and content.
 * @returns Titled settings section.
 */
export function DefaultSectionWrapper({
  title,
  children,
}: DefaultSectionWrapperProps): React.ReactElement {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

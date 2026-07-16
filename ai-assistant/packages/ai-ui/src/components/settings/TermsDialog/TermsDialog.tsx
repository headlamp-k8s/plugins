import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Props for {@link TermsDialog}. */
export interface TermsDialogProps {
  /** Whether the terms dialog is visible. */
  open: boolean;
  /** Closes the dialog without accepting. */
  onClose: () => void;
  /** Continues after the user accepts the terms. */
  onAccept: () => void;
}

/**
 * Presents AI assistant cost, credential, privacy, and responsibility terms.
 * Acceptance is reset every time the dialog opens so continuing always requires
 * an explicit decision for the current presentation.
 *
 * @param props - Visibility and acceptance-flow callbacks.
 * @returns Terms dialog with an acknowledgement-gated continue action.
 */
export default function TermsDialog({ open, onClose, onAccept }: TermsDialogProps) {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const reminderId = useId();

  useEffect(() => {
    if (open) setAccepted(false);
  }, [open]);

  const handleAccept = (): void => {
    setAccepted(false);
    onAccept();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <DialogTitle id={titleId}>
        <Box display="flex" alignItems="center" gap={1}>
          <Icon aria-hidden icon="mdi:alert-circle" width="24px" height="24px" color="orange" />
          <Typography component="span" variant="h6">
            {t('AI Assistant Terms & Important Information')}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography id={descriptionId} variant="body1" sx={{ mb: 3, fontWeight: 'medium' }}>
          {t('Before using the AI Assistant, please review the following important information:')}
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <Icon aria-hidden icon="mdi:currency-usd" width="20px" height="20px" color="orange" />
            </ListItemIcon>
            <ListItemText
              primary={t('Usage Costs')}
              secondary={t(
                'Using AI providers may incur charges based on your usage. These costs are billed directly by the AI provider (OpenAI, Anthropic, etc.) and are not covered by Headlamp.'
              )}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Icon aria-hidden icon="mdi:key" width="20px" height="20px" color="orange" />
            </ListItemIcon>
            <ListItemText
              primary={t('API Keys')}
              secondary={t(
                'You will need to provide your own API keys from AI providers. These keys are stored locally in your browser and are not transmitted to Headlamp servers.'
              )}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Icon aria-hidden icon="mdi:shield-alert" width="20px" height="20px" color="orange" />
            </ListItemIcon>
            <ListItemText
              primary={t('Data Privacy')}
              secondary={t(
                "Your queries and cluster information will be sent to the selected AI provider for processing. Please review your AI provider's privacy policy and ensure you comply with your organization's data policies."
              )}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Icon
                aria-hidden
                icon="mdi:account-supervisor"
                width="20px"
                height="20px"
                color="orange"
              />
            </ListItemIcon>
            <ListItemText
              primary={t('Responsibility')}
              secondary={t(
                "You are responsible for monitoring your usage, managing costs, and ensuring compliance with your organization's policies when using AI features."
              )}
            />
          </ListItem>
        </List>

        <Box
          id={reminderId}
          role="note"
          sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
            <Icon
              aria-hidden
              icon="mdi:alert-outline"
              style={{ marginRight: 6, verticalAlign: 'middle' }}
            />
            {t('Important Reminder')}
          </Typography>
          <Typography variant="body2">
            {t(
              'Always verify AI-generated suggestions before applying them to your Kubernetes clusters, especially in production environments. The AI Assistant is a tool to help you, but you remain responsible for all actions taken.'
            )}
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              color="primary"
              inputProps={{ 'aria-describedby': reminderId }}
            />
          }
          label={t('I understand and accept these terms.')}
          sx={{ mt: 3 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>{t('Cancel')}</Button>
        <Button variant="contained" color="primary" onClick={handleAccept} disabled={!accepted}>
          {t('Accept & Continue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

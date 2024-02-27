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
import { useState } from 'react';

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function TermsDialog({ open, onClose, onAccept }: TermsDialogProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Icon icon="mdi:alert-circle" width="24px" height="24px" color="orange" />
          <Typography variant="h6">AI Assistant Terms & Important Information</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3, fontWeight: 'medium' }}>
          Before using the AI Assistant, please review the following important information:
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <Icon icon="mdi:currency-usd" width="20px" height="20px" color="orange" />
            </ListItemIcon>
            <ListItemText
              primary="Usage Costs"
              secondary="Using AI providers may incur charges based on your usage. These costs are billed directly by the AI provider (OpenAI, Anthropic, etc.) and are not covered by Headlamp."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Icon icon="mdi:key" width="20px" height="20px" color="orange" />
            </ListItemIcon>
            <ListItemText
              primary="API Keys"
              secondary="You will need to provide your own API keys from AI providers. These keys are stored locally in your browser and are not transmitted to Headlamp servers."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Icon icon="mdi:shield-alert" width="20px" height="20px" color="orange" />
            </ListItemIcon>
            <ListItemText
              primary="Data Privacy"
              secondary="Your queries and cluster information will be sent to the selected AI provider for processing. Please review your AI provider's privacy policy and ensure you comply with your organization's data policies."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Icon icon="mdi:account-supervisor" width="20px" height="20px" color="orange" />
            </ListItemIcon>
            <ListItemText
              primary="Responsibility"
              secondary="You are responsible for monitoring your usage, managing costs, and ensuring compliance with your organization's policies when using AI features."
            />
          </ListItem>
        </List>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
            ⚠️ Important Reminder
          </Typography>
          <Typography variant="body2">
            Always verify AI-generated suggestions before applying them to your Kubernetes clusters,
            especially in production environments. The AI Assistant is a tool to help you, but you
            remain responsible for all actions taken.
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              color="primary"
            />
          }
          label={<Typography variant="body2">I understand and accept these terms.</Typography>}
          sx={{ mt: 3 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={onAccept} disabled={!accepted}>
          Accept & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}

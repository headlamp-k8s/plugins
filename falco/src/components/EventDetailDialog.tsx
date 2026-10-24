import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import React from 'react';
import { FalcoEvent } from '../types/FalcoEvent';
import { formatFalcoTime, getEventUser, getTagColor } from '../utils/falcoEventUtils';

interface EventDetailDialogProps {
  event: FalcoEvent | null;
  open: boolean;
  onClose: () => void;
}

/**
 * A dialog component for displaying detailed Falco event information.
 */
const EventDetailDialog: React.FC<EventDetailDialogProps> = ({ event, open, onClose }) => {
  if (!event) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{event.rule || 'Event Details'}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Time:</strong> {formatFalcoTime(event)}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Priority:</strong> {event.priority || 'N/A'}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Rule:</strong> {event.rule || 'N/A'}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Source:</strong> {event.source || 'N/A'}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <strong>User:</strong> {getEventUser(event)}
        </Typography>

        {Array.isArray(event.tags) && event.tags.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Tags:</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {event.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  sx={{
                    backgroundColor: getTagColor(tag),
                    color: '#fff',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Message:</strong>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
            }}
          >
            {event.output || event.msg || 'N/A'}
          </Typography>
        </Box>

        {event.output_fields && Object.keys(event.output_fields).length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Output Fields:</strong>
            </Typography>
            <Box
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
              }}
            >
              {JSON.stringify(event.output_fields, null, 2)}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailDialog;

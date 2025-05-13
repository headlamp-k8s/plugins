import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import React from 'react';
import { truncate } from '../utils/falcoEventUtils';

/**
 * Props for the MessageCell component.
 */
interface MessageCellProps {
  message: string;
  fullText: string;
  onClick: () => void;
}

/**
 * A component to display a message in a table cell with tooltip and click handling.
 */
const MessageCell: React.FC<MessageCellProps> = ({ message, fullText, onClick }) => {
  const messageText = truncate(message.replace(/^\d{2}:\d{2}:\d{2}\.\d{9}:\s*/, ''), 60);

  return (
    <Tooltip
      title={fullText}
      placement="top"
      arrow
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            backgroundColor: 'rgba(0, 0, 0, 0.87)',
            color: '#fff',
            fontSize: '0.8rem',
            padding: '8px 12px',
            borderRadius: '6px',
            maxWidth: 500,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          },
          '& .MuiTooltip-arrow': {
            color: 'rgba(0, 0, 0, 0.87)',
          },
        },
      }}
    >
      <Box
        onClick={onClick}
        component="div"
        role="button"
        tabIndex={0}
        onKeyPress={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick();
          }
        }}
        sx={{
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'inline-block',
          maxWidth: 260,
          color: 'primary.main',
          '&:hover': {
            color: 'primary.dark',
            textDecoration: 'underline',
          },
          transition: 'all 0.2s ease',
          borderRadius: '4px',
          px: 0.5,
          py: 0.25,
          '&:focus': {
            outline: '2px solid rgba(25, 118, 210, 0.3)',
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
          },
        }}
      >
        {messageText}
      </Box>
    </Tooltip>
  );
};

export default MessageCell;

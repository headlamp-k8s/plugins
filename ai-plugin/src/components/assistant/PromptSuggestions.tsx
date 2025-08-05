import { Icon } from '@iconify/react';
import { Box, Chip, Typography } from '@mui/material';
import React from 'react';

interface PromptSuggestionsProps {
  suggestions: string[];
  apiError: string | null;
  loading: boolean;
  onPromptSelect: (prompt: string) => void;
  onPromptSend: (prompt: string) => void;
  onErrorClear: () => void;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  suggestions,
  apiError,
  loading,
  onPromptSelect,
  onPromptSend,
  onErrorClear,
}) => {
  if (loading) {
    return null;
  }

  return (
    <Box>
      {/* Show error message when there was a content filter error */}
      {apiError && apiError.includes('content filter') && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          Try one of these safe Kubernetes questions instead:
        </Typography>
      )}

      {/* Regular suggestions (used for both normal and content filter error cases) */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }} mb={1}>
        {suggestions.map((prompt, i) => (
          <Chip
            key={i}
            label={prompt}
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => {
              onPromptSelect(prompt);
            }}
            onDelete={() => {
              if (apiError && apiError.includes('content filter')) {
                onErrorClear();
              }
              onPromptSend(prompt);
            }}
            deleteIcon={<Icon icon="mdi:send" width="20px" />}
            sx={{
              height: 'auto',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                textAlign: 'left',
                display: 'block',
                padding: '4px 8px',
                minHeight: '16px',
                fontSize: '0.92em',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

import { Icon } from '@iconify/react';
import { Box, Chip, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Props for {@link PromptSuggestions}. */
interface PromptSuggestionsProps {
  /** Suggested prompts to show as chips. */
  suggestions: string[];
  /** Current API error, if one should influence the suggestion UI. */
  apiError: string | null;
  /** Whether suggestions are still being fetched. */
  loading: boolean;
  /** Called when a suggestion is inserted into the prompt input. */
  onPromptSelect: (prompt: string) => void;
  /** Called when a suggestion is sent immediately. */
  onPromptSend: (prompt: string) => void;
  /** Clears any displayed error before resending a prompt. */
  onErrorClear: () => void;
}

/** Renders clickable suggestion chips and content-filter fallback guidance for the prompt input. */
export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  suggestions,
  apiError,
  loading,
  onPromptSelect,
  onPromptSend,
  onErrorClear,
}) => {
  const { t } = useTranslation();
  if (loading) {
    return null;
  }

  return (
    <Box>
      {/* Show error message when there was a content filter error */}
      {apiError && apiError.includes('content filter') && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          {t('Try one of these safe Kubernetes questions instead:')}
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

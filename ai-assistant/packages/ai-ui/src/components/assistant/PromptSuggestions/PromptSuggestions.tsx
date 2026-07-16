import { Icon } from '@iconify/react';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Props for {@link PromptSuggestions}. */
export interface PromptSuggestionsProps {
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

/**
 * Renders selectable prompt chips and accessible send actions.
 *
 * @param props - Suggestions, request state, and selection/send callbacks.
 * @returns Suggestion controls, guidance, or nothing while loading.
 */
export function PromptSuggestions({
  suggestions,
  apiError,
  loading,
  onPromptSelect,
  onPromptSend,
  onErrorClear,
}: PromptSuggestionsProps): React.ReactElement | null {
  const { t } = useTranslation();
  if (loading) {
    return null;
  }
  const hasContentFilterError = apiError?.toLowerCase().includes('content filter') ?? false;

  return (
    <Box>
      {/* Show error message when there was a content filter error */}
      {hasContentFilterError && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          {t('Try one of these safe Kubernetes questions instead:')}
        </Typography>
      )}

      {/* Regular suggestions (used for both normal and content filter error cases) */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }} mb={1}>
        {suggestions.map((prompt, index) => (
          <Box key={`${prompt}-${index}`} sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <Chip
              label={prompt}
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => onPromptSelect(prompt)}
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
            <IconButton
              size="small"
              aria-label={t('Send suggestion: {{prompt}}', { prompt })}
              onClick={() => {
                if (hasContentFilterError) onErrorClear();
                onPromptSend(prompt);
              }}
            >
              <Icon icon="mdi:send" width="20px" aria-hidden="true" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

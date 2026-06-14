import type { AssistantActivityStep } from '@headlamp-k8s/ai-common/conversation/types';
import { Icon } from '@iconify/react';
import {
  Box,
  ButtonBase,
  CircularProgress,
  Collapse,
  LinearProgress,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Intermediate activity step emitted during agent reasoning. */
export type ThinkingStep = AssistantActivityStep;

/** Props for {@link AgentThinkingBlock}. */
export interface AgentThinkingBlockProps {
  /** Ordered reasoning steps to display. */
  steps: ThinkingStep[];
  /** Whether the agent is still actively processing. */
  isActive: boolean;
}

/**
 * Displays a collapsible summary of agent activity while a run is active or complete.
 *
 * @param props - Ordered activity steps and current run state.
 * @returns Collapsible activity summary, or nothing when there are no steps.
 */
export default function AgentThinkingBlock({
  steps,
  isActive,
}: AgentThinkingBlockProps): React.ReactElement | null {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const stepsId = useId();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (steps.length === 0) return null;

  const latestStep = steps[steps.length - 1];
  const summaryLabel = isActive
    ? getSummaryFromStep(latestStep, t)
    : steps.length === 1
    ? t('Used 1 step')
    : t('Used {{count}} steps', { count: steps.length });

  return (
    <Box
      sx={{
        mb: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: isActive ? 'primary.main' : 'divider',
        overflow: 'hidden',
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Header — always visible */}
      <ButtonBase
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        aria-controls={stepsId}
        sx={{
          display: 'flex',
          width: '100%',
          textAlign: 'left',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          cursor: 'pointer',
          userSelect: 'none',
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          },
        }}
      >
        {/* Chevron */}
        <Icon
          icon="mdi:chevron-right"
          width="18px"
          aria-hidden="true"
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease',
            flexShrink: 0,
            color: theme.palette.primary.main,
          }}
        />

        {/* Animated spinner or check */}
        {isActive ? (
          <CircularProgress size={14} thickness={5} aria-hidden="true" sx={{ flexShrink: 0 }} />
        ) : (
          <Icon
            icon="mdi:check-circle-outline"
            width="16px"
            color={theme.palette.success.main}
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          />
        )}

        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {isActive ? t('Thinking…') : t('Thought process')}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            flexShrink: 0,
            ml: 'auto',
          }}
        >
          {summaryLabel}
        </Typography>
      </ButtonBase>

      {/* Progress bar while active */}
      {isActive && (
        <LinearProgress
          color="primary"
          aria-label={t('Agent thinking progress')}
          sx={{
            height: 2,
          }}
        />
      )}

      {/* Collapsible steps list */}
      <Collapse in={expanded} timeout={200}>
        <Box
          id={stepsId}
          sx={{
            px: 1.5,
            py: 1,
            maxHeight: 400,
            overflowY: 'auto',
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.background.paper,
          }}
        >
          {steps.map((step, idx) => (
            <Box
              key={step.id || idx}
              sx={{
                py: 0.5,
                '&:not(:last-child)': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 0.75,
                  mb: 0.25,
                },
              }}
            >
              <Typography
                variant="caption"
                component="div"
                sx={{
                  fontFamily: 'inherit',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: 'text.secondary',
                  m: 0,
                  lineHeight: 1.5,
                }}
              >
                {step.content}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Derives a compact, translated status from the latest activity step.
 * Tool steps may embed a tool name after `:` or `Tool`; unrecognized formats
 * deliberately fall back to a generic translated status.
 *
 * @param step - Latest activity step.
 * @param t - Translation function.
 * @returns Summary suitable for the collapsed header.
 */
function getSummaryFromStep(
  step: ThinkingStep,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (step.type === 'tool-start') {
    const match = step.content.match(/:\s*(.+)/);
    return match ? `${match[1].trim()}…` : t('Calling tool…');
  }
  if (step.type === 'tool-result') {
    const match = step.content.match(/Tool\s+(\S+)/);
    return match ? t('{{tool}} done', { tool: match[1] }) : t('Tool done');
  }
  if (step.type === 'todo-update') {
    return t('Updating plan…');
  }
  return t('Thinking…');
}

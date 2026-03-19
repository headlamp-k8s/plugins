import { Icon } from '@iconify/react';
import { Box, CircularProgress, Collapse, LinearProgress, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

export interface ThinkingStep {
  id: string;
  content: string;
  /** 'tool-start' | 'tool-result' | 'intermediate-text' | 'todo-update' */
  type: 'tool-start' | 'tool-result' | 'intermediate-text' | 'todo-update';
  timestamp: number;
}

interface AgentThinkingBlockProps {
  steps: ThinkingStep[];
  /** Whether the agent is still processing (show animated indicator) */
  isActive: boolean;
}

/**
 * Collapsible "Thinking" block styled to match Headlamp's UI theme.
 * Shows agent intermediate steps (tool calls, plan updates, etc.)
 * while the agent works. Auto-collapses when the run finishes.
 */
export default function AgentThinkingBlock({ steps, isActive }: AgentThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  if (steps.length === 0) return null;

  const latestStep = steps[steps.length - 1];
  const summaryLabel = isActive
    ? getSummaryFromStep(latestStep)
    : `Used ${steps.length} step${steps.length !== 1 ? 's' : ''}`;

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
      <Box
        onClick={() => setExpanded(prev => !prev)}
        sx={{
          display: 'flex',
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
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
            color: theme.palette.primary.main,
          }}
        />

        {/* Animated spinner or check */}
        {isActive ? (
          <CircularProgress size={14} thickness={5} sx={{ flexShrink: 0 }} />
        ) : (
          <Icon
            icon="mdi:check-circle-outline"
            width="16px"
            color={theme.palette.success.main}
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
          {isActive ? 'Thinking…' : 'Thought process'}
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
      </Box>

      {/* Progress bar while active */}
      {isActive && (
        <LinearProgress
          color="primary"
          sx={{
            height: 2,
          }}
        />
      )}

      {/* Collapsible steps list */}
      <Collapse in={expanded} timeout={200}>
        <Box
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
                component="pre"
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

function getSummaryFromStep(step: ThinkingStep): string {
  if (step.type === 'tool-start') {
    const match = step.content.match(/:\s*(.+)/);
    return match ? `${match[1].trim()}…` : 'Calling tool…';
  }
  if (step.type === 'tool-result') {
    const match = step.content.match(/Tool\s+(\S+)/);
    return match ? `${match[1]} done` : 'Tool done';
  }
  if (step.type === 'todo-update') {
    return 'Updating plan…';
  }
  return 'Thinking…';
}

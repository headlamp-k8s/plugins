/**
 * ProactiveDiagnosisSection
 *
 * Renders the proactive diagnosis results at the top of the AI chat window.
 * Shows a task list with status indicators:
 *   ⬜ pending — queued, not yet processing
 *   ⏳ in-progress — currently being diagnosed (with collapsible thinking block)
 *   ✅ completed — diagnosis available (expandable)
 *   ❌ failed — diagnosis error (expandable)
 *
 * The thinking block for an active diagnosis is collapsible like the chat's
 * AgentThinkingBlock so it feels consistent with the rest of the UI.
 */

import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  LinearProgress,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useEffect, useRef, useState } from 'react';
import ContentRenderer from '../../ContentRenderer';
import { DiagnosisResult, DiagnosisThinkingStep } from '../../utils/ProactiveDiagnosisManager';

interface ProactiveDiagnosisSectionProps {
  diagnoses: DiagnosisResult[];
  scrollToEventUid: string | null;
  onScrollComplete: () => void;
  isCycleRunning: boolean;
  onYamlAction?: (yaml: string, title: string, resourceType: string, isDelete: boolean) => void;
}

/* ── Status helpers ──────────────────────────────────────────────── */

function getStatusIcon(d: DiagnosisResult) {
  if (d.loading) return '⏳';
  if (d.pending) return '⬜';
  if (d.error) return '❌';
  return '✅';
}

function getStatusLabel(d: DiagnosisResult) {
  if (d.loading) return 'Diagnosing…';
  if (d.pending) return 'Queued';
  if (d.error) return 'Failed';
  return 'Completed';
}

/* ── Collapsible Thinking Block (mirrors AgentThinkingBlock style) ── */

function DiagnosisThinkingBlock({
  event,
  steps,
  isActive,
}: {
  event: DiagnosisResult['event'];
  steps: DiagnosisThinkingStep[];
  isActive: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  // Auto-scroll to latest step when new steps arrive
  useEffect(() => {
    if (expanded && stepsEndRef.current) {
      stepsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [steps.length, expanded]);

  const latestStep = steps[steps.length - 1];
  const summaryLabel = isActive
    ? latestStep
      ? getStepSummary(latestStep)
      : 'Analyzing event…'
    : `${steps.length} step${steps.length !== 1 ? 's' : ''}`;

  return (
    <Box
      sx={{
        mt: 0.5,
        mb: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: isActive ? 'primary.main' : 'divider',
        overflow: 'hidden',
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Header */}
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
        <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, ml: 'auto' }}>
          {summaryLabel}
        </Typography>
      </Box>

      {/* Progress bar while active */}
      {isActive && <LinearProgress color="primary" sx={{ height: 2 }} />}

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
          {steps.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              {`Diagnosing ${event.objectKind}/${event.objectName}` +
                (event.objectNamespace ? ` in ${event.objectNamespace}` : '') +
                `\nReason: ${event.reason}` +
                `\nMessage: ${event.message}`}
            </Typography>
          ) : (
            steps.map((step, idx) => (
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                  <Icon
                    icon={getStepIcon(step.type)}
                    width="14px"
                    color={getStepIconColor(step.type, theme)}
                    style={{ flexShrink: 0 }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {getStepTypeLabel(step.type)}
                  </Typography>
                </Box>
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
                    fontSize: '0.75rem',
                  }}
                >
                  {step.content}
                </Typography>
              </Box>
            ))
          )}
          <div ref={stepsEndRef} />
        </Box>
      </Collapse>
    </Box>
  );
}

/* ── Step display helpers ───────────────────────────────────────── */

function getStepSummary(step: DiagnosisThinkingStep): string {
  if (step.type === 'tool-start') {
    const match = step.content.match(/:\s*(.+)/);
    return match ? `${match[1].trim()}…` : 'Calling tool…';
  }
  if (step.type === 'tool-result') return 'Tool done';
  if (step.type === 'todo-update') return 'Updating plan…';
  return 'Thinking…';
}

function getStepIcon(type: DiagnosisThinkingStep['type']): string {
  switch (type) {
    case 'tool-start':
      return 'mdi:wrench';
    case 'tool-result':
      return 'mdi:check';
    case 'todo-update':
      return 'mdi:format-list-checks';
    default:
      return 'mdi:message-text-outline';
  }
}

function getStepIconColor(type: DiagnosisThinkingStep['type'], theme: any): string {
  switch (type) {
    case 'tool-start':
      return theme.palette.info.main;
    case 'tool-result':
      return theme.palette.success.main;
    case 'todo-update':
      return theme.palette.warning.main;
    default:
      return theme.palette.text.secondary;
  }
}

function getStepTypeLabel(type: DiagnosisThinkingStep['type']): string {
  switch (type) {
    case 'tool-start':
      return 'Tool call';
    case 'tool-result':
      return 'Tool result';
    case 'todo-update':
      return 'Plan update';
    default:
      return 'Intermediate';
  }
}

/* ── Content parser: split diagnosis text into thinking vs answer ── */

/**
 * Splits the raw diagnosis text into two parts:
 *   - thinking: tool calls, investigation task lists, intermediate output
 *   - answer:   the final summary / root-cause / remediation
 *
 * Heuristic: lines starting with 🔧 or "### Investigation Tasks" are thinking.
 * The last contiguous block of non-thinking text is the answer.
 */
function splitDiagnosisContent(text: string): { thinking: string; answer: string } {
  if (!text) return { thinking: '', answer: '' };

  const lines = text.split('\n');

  // Patterns that indicate "thinking / intermediate" content
  const thinkingPatterns = [
    /^🔧/, // tool call lines
    /^###?\s*Investigation Tasks/i, // task list headers
    /^\d+\.\s*[⏳⬜✅❌]/, // task list items with status emojis
  ];

  const isThinkingLine = (line: string) => thinkingPatterns.some(p => p.test(line.trim()));

  // Walk through lines; consecutive thinking lines are grouped.
  // The final non-thinking block is the "answer".
  // Everything before it (including any intermediate non-thinking gaps
  // sandwiched between thinking blocks) is "thinking".
  //
  // Strategy: find the index of the last thinking line, then everything
  // after that line is the answer.
  let lastThinkingIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isThinkingLine(lines[i])) {
      lastThinkingIdx = i;
    }
  }

  // If no thinking was found, the whole thing is the answer
  if (lastThinkingIdx === -1) {
    return { thinking: '', answer: text };
  }

  // Skip any blank lines right after the last thinking line
  let answerStart = lastThinkingIdx + 1;
  while (answerStart < lines.length && lines[answerStart].trim() === '') {
    answerStart++;
  }

  const thinking = lines.slice(0, answerStart).join('\n').trim();
  const answer = lines.slice(answerStart).join('\n').trim();

  return { thinking, answer };
}

/* ── Reusable collapsible section ─────────────────────────────────── */

interface CollapsibleSectionProps {
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  icon,
  iconColor,
  title,
  subtitle,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: theme.palette.background.default,
        mb: 0.5,
      }}
    >
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
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          },
        }}
      >
        <Icon
          icon="mdi:chevron-right"
          width="18px"
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
            color: iconColor,
          }}
        />
        <Icon icon={icon} width="16px" color={iconColor} style={{ flexShrink: 0 }} />
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
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, ml: 'auto' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      <Collapse in={expanded} timeout={200}>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            maxHeight: 500,
            overflowY: 'auto',
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.background.paper,
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

/* ── Completed / Error result block ──────────────────────────────── */

function DiagnosisResultBlock({
  diagnosis,
  onYamlAction,
}: {
  diagnosis: DiagnosisResult;
  onYamlAction?: (yaml: string, title: string, resourceType: string, isDelete: boolean) => void;
}) {
  const theme = useTheme();

  // Wrap onYamlAction to match the onYamlDetected signature expected by ContentRenderer
  const handleYamlDetected = React.useCallback(
    (yaml: string, resourceType: string) => {
      if (onYamlAction) {
        onYamlAction(yaml, `Apply ${resourceType}`, resourceType, false);
      }
    },
    [onYamlAction]
  );

  if (diagnosis.error) {
    return (
      <Box sx={{ mt: 0.5, mb: 1, ml: 3 }}>
        <CollapsibleSection
          icon="mdi:alert-circle-outline"
          iconColor={theme.palette.error.main}
          title="Diagnosis failed"
          subtitle={new Date(diagnosis.diagnosedAt).toLocaleTimeString()}
          defaultExpanded
        >
          <Alert severity="error" variant="outlined" sx={{ fontSize: '0.75rem' }}>
            {diagnosis.error}
          </Alert>
        </CollapsibleSection>
      </Box>
    );
  }

  const { thinking, answer } = splitDiagnosisContent(diagnosis.diagnosis);
  const stepsToShow = diagnosis.thinkingSteps || [];

  return (
    <Box sx={{ mt: 0.5, mb: 1, ml: 3 }}>
      {/* Thinking / tool calls — collapsed by default */}
      {stepsToShow.length > 0 && (
        <DiagnosisThinkingBlock event={diagnosis.event} steps={stepsToShow} isActive={false} />
      )}
      {/* Fallback: show parsed thinking text if no steps were captured */}
      {stepsToShow.length === 0 && thinking && (
        <CollapsibleSection
          icon="mdi:brain"
          iconColor={theme.palette.info.main}
          title="Thought process"
          subtitle={`${(thinking.match(/🔧/g) || []).length} tool call${
            (thinking.match(/🔧/g) || []).length !== 1 ? 's' : ''
          }`}
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
              fontSize: '0.78rem',
            }}
          >
            {thinking}
          </Typography>
        </CollapsibleSection>
      )}

      {/* Answer — expanded by default, nicely rendered */}
      {answer && (
        <CollapsibleSection
          icon="mdi:check-circle-outline"
          iconColor={theme.palette.success.main}
          title="Diagnosis"
          subtitle={new Date(diagnosis.diagnosedAt).toLocaleTimeString()}
          defaultExpanded
        >
          <Box
            sx={{
              fontSize: '0.85rem',
              '& p': { margin: '4px 0' },
              '& ul, & ol': { margin: '4px 0', pl: 2 },
              '& h1, & h2, & h3, & h4': {
                mt: 1.5,
                mb: 0.5,
                fontSize: '0.95rem',
                fontWeight: 700,
              },
              '& code': {
                bgcolor: 'action.hover',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.8rem',
                fontFamily: 'monospace',
              },
              '& pre': {
                bgcolor: 'action.hover',
                p: 1,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.8rem',
              },
              '& blockquote': {
                borderLeft: '3px solid',
                borderColor: 'divider',
                pl: 1.5,
                ml: 0,
                color: 'text.secondary',
              },
            }}
          >
            <ContentRenderer
              content={answer}
              onYamlDetected={onYamlAction ? handleYamlDetected : undefined}
            />
          </Box>
        </CollapsibleSection>
      )}

      {/* Fallback: if parsing produced no answer, show everything */}
      {!answer && !thinking && (
        <CollapsibleSection
          icon="mdi:check-circle-outline"
          iconColor={theme.palette.success.main}
          title="Diagnosis"
          subtitle={new Date(diagnosis.diagnosedAt).toLocaleTimeString()}
          defaultExpanded
        >
          <Box
            sx={{
              fontSize: '0.85rem',
              '& p': { margin: '4px 0' },
              '& ul, & ol': { margin: '4px 0', pl: 2 },
            }}
          >
            <ContentRenderer
              content={diagnosis.diagnosis}
              onYamlDetected={onYamlAction ? handleYamlDetected : undefined}
            />
          </Box>
        </CollapsibleSection>
      )}
    </Box>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */

export default function ProactiveDiagnosisSection({
  diagnoses,
  scrollToEventUid,
  onScrollComplete,
  isCycleRunning,
  onYamlAction,
}: ProactiveDiagnosisSectionProps) {
  const theme = useTheme();
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle scroll-to-event from events table click
  useEffect(() => {
    if (!scrollToEventUid) return;

    const timer = setTimeout(() => {
      const el = itemRefs.current[scrollToEventUid];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      onScrollComplete();
    }, 300);

    return () => clearTimeout(timer);
  }, [scrollToEventUid, onScrollComplete]);

  if (diagnoses.length === 0 && !isCycleRunning) {
    return null;
  }

  const completedCount = diagnoses.filter(d => !d.loading && !d.pending).length;

  return (
    <Box sx={{ mb: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          px: 1,
        }}
      >
        <Icon icon="mdi:shield-search" width={20} color={theme.palette.primary.main} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Proactive Diagnosis
        </Typography>
        {isCycleRunning && <CircularProgress size={14} sx={{ ml: 0.5 }} />}
        <Chip
          label={`${completedCount}/${diagnoses.length} event${diagnoses.length !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
          sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
        />
      </Box>

      {/* Task list — one row per event with status icon */}
      {diagnoses.map(d => (
        <div
          key={d.eventUid}
          ref={el => {
            itemRefs.current[d.eventUid] = el;
          }}
        >
          {/* Status row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: d.loading ? 'action.hover' : 'transparent',
              transition: 'background-color 0.2s ease',
              ...(scrollToEventUid === d.eventUid && {
                borderLeft: '3px solid',
                borderColor: 'primary.main',
              }),
            }}
          >
            <Typography variant="body2" sx={{ flexShrink: 0, lineHeight: 1 }}>
              {getStatusIcon(d)}
            </Typography>
            <Icon
              icon={d.event.type === 'Error' ? 'mdi:alert-circle' : 'mdi:alert'}
              color={
                d.event.type === 'Error' ? theme.palette.error.main : theme.palette.warning.main
              }
              width={16}
              style={{ flexShrink: 0 }}
            />
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: d.loading ? 600 : 400,
              }}
            >
              {d.event.objectKind}/{d.event.objectName}
              {d.event.objectNamespace ? ` (${d.event.objectNamespace})` : ''}
            </Typography>
            <Chip
              label={d.event.reason}
              size="small"
              color={d.event.type === 'Error' ? 'error' : 'warning'}
              sx={{ fontSize: '0.6rem', height: 18, flexShrink: 0 }}
            />
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', flexShrink: 0, minWidth: 70, textAlign: 'right' }}
            >
              {getStatusLabel(d)}
            </Typography>
          </Box>

          {/* Thinking block — only for the currently-processing event */}
          {d.loading && (
            <Box sx={{ ml: 3 }}>
              <DiagnosisThinkingBlock event={d.event} steps={d.thinkingSteps || []} isActive />
            </Box>
          )}

          {/* Result block — for completed / errored events */}
          {!d.loading && !d.pending && (d.diagnosis || d.error) && (
            <DiagnosisResultBlock diagnosis={d} onYamlAction={onYamlAction} />
          )}
        </div>
      ))}

      {/* Separator between proactive diagnoses and regular chat */}
      {diagnoses.length > 0 && (
        <Divider sx={{ mt: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Chat
          </Typography>
        </Divider>
      )}
    </Box>
  );
}

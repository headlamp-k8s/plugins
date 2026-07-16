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
  ButtonBase,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  LinearProgress,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getStatusIcon,
  getStatusLabel,
  getStepIcon,
  getStepIconColor,
  getStepSummary,
  getStepTypeLabel,
  splitDiagnosisContent,
} from '../../../diagnosis/diagnosisHelpers';
import type {
  DiagnosisResult,
  DiagnosisThinkingStep,
} from '../../../diagnosis/ProactiveDiagnosisManager';
import { DefaultContentRenderer } from '../../defaults/DefaultSlots/DefaultSlots';

/** Props for the ProactiveDiagnosisSection component that displays diagnosis results. */
export interface ProactiveDiagnosisSectionProps {
  /** List of diagnosis results to render. */
  diagnoses: DiagnosisResult[];
  /** UID of the event to auto-scroll to, or null if none. */
  scrollToEventUid: string | null;
  /** Callback invoked after the auto-scroll animation completes. */
  onScrollComplete: () => void;
  /** Whether a diagnosis cycle is currently in progress. */
  isCycleRunning: boolean;
  /** Callback invoked when the user triggers a YAML apply/delete action from a diagnosis. */
  onYamlAction?: (yaml: string, title: string, resourceType: string, isDelete: boolean) => void;
  /** Slot for the content renderer component that handles markdown/YAML display. Falls back to a plain-text renderer. */
  ContentRendererSlot?: React.ComponentType<DiagnosisContentRendererProps>;
}

/** Props supplied to diagnosis content renderer slots. */
export interface DiagnosisContentRendererProps {
  /** Diagnosis markdown or plain text. */
  content: string;
  /** Receives YAML content discovered by the renderer. */
  onYamlDetected?: (yaml: string, resourceType: string) => void;
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
}): React.ReactElement {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const contentId = React.useId();

  // Auto-scroll to latest step when new steps arrive
  useEffect(() => {
    if (expanded && typeof stepsEndRef.current?.scrollIntoView === 'function') {
      stepsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [steps.length, expanded]);

  const latestStep = steps[steps.length - 1];
  const summaryLabel = isActive
    ? latestStep
      ? latestStep.type === 'tool-start'
        ? getStepSummary(latestStep)
        : t(getStepSummary(latestStep))
      : t('Analyzing event…')
    : t(steps.length !== 1 ? '{{count}} steps' : '{{count}} step', { count: steps.length });

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
      <ButtonBase
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        aria-controls={contentId}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          cursor: 'pointer',
          userSelect: 'none',
          width: '100%',
          textAlign: 'left',
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          },
        }}
      >
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
        <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, ml: 'auto' }}>
          {summaryLabel}
        </Typography>
      </ButtonBase>

      {/* Progress bar while active */}
      {isActive && (
        <LinearProgress
          color="primary"
          aria-label={t('Diagnosis thinking progress')}
          sx={{ height: 2 }}
        />
      )}

      {/* Collapsible steps list */}
      <Collapse in={expanded} timeout={prefersReducedMotion ? 0 : 200}>
        <Box
          id={contentId}
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
              {event.objectNamespace
                ? t(
                    'Diagnosing {{objectKind}}/{{objectName}} in {{namespace}}\nReason: {{reason}}\nMessage: {{message}}',
                    {
                      objectKind: event.objectKind,
                      objectName: event.objectName,
                      namespace: event.objectNamespace,
                      reason: event.reason,
                      message: event.message,
                    }
                  )
                : t(
                    'Diagnosing {{objectKind}}/{{objectName}}\nReason: {{reason}}\nMessage: {{message}}',
                    {
                      objectKind: event.objectKind,
                      objectName: event.objectName,
                      reason: event.reason,
                      message: event.message,
                    }
                  )}
            </Typography>
          ) : (
            steps.map(step => (
              <Box
                key={step.id}
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
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {t(getStepTypeLabel(step.type))}
                  </Typography>
                </Box>
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

/* ── Content parser: split diagnosis text into thinking vs answer ── */

/* ── Reusable collapsible section ─────────────────────────────────── */

/** Props for the CollapsibleSection helper component used within diagnosis cards. */
interface CollapsibleSectionProps {
  /** Iconify icon identifier to display in the section header. */
  icon: string;
  /** CSS color for the header icon. */
  iconColor: string;
  /** Title text displayed in the section header. */
  title: string;
  /** Optional subtitle text displayed below the title. */
  subtitle?: string;
  /** Whether the section starts in expanded state. */
  defaultExpanded?: boolean;
  /** Content rendered inside the collapsible area. */
  children: React.ReactNode;
}

function CollapsibleSection({
  icon,
  iconColor,
  title,
  subtitle,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps): React.ReactElement {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const contentId = React.useId();

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
      <ButtonBase
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        aria-controls={contentId}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          cursor: 'pointer',
          userSelect: 'none',
          width: '100%',
          textAlign: 'left',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          },
        }}
      >
        <Icon
          icon="mdi:chevron-right"
          width="18px"
          aria-hidden="true"
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease',
            flexShrink: 0,
            color: iconColor,
          }}
        />
        <Icon
          icon={icon}
          width="16px"
          color={iconColor}
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        />
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
      </ButtonBase>

      <Collapse in={expanded} timeout={prefersReducedMotion ? 0 : 200}>
        <Box
          id={contentId}
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
  ContentRendererSlot,
}: {
  diagnosis: DiagnosisResult;
  onYamlAction?: (yaml: string, title: string, resourceType: string, isDelete: boolean) => void;
  ContentRendererSlot: React.ComponentType<DiagnosisContentRendererProps>;
}): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();

  // Wrap onYamlAction to match the onYamlDetected signature expected by ContentRenderer
  const handleYamlDetected = React.useCallback(
    (yaml: string, resourceType: string) => {
      if (onYamlAction) {
        onYamlAction(yaml, t('Apply {{resourceType}}', { resourceType }), resourceType, false);
      }
    },
    [onYamlAction, t]
  );

  if (diagnosis.error) {
    return (
      <Box sx={{ mt: 0.5, mb: 1, ml: 3 }}>
        <CollapsibleSection
          icon="mdi:alert-circle-outline"
          iconColor={theme.palette.error.main}
          title={t('Diagnosis failed')}
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
          title={t('Thought process')}
          subtitle={
            (thinking.match(/🔧/g) || []).length === 1
              ? t('1 tool call')
              : t('{{count}} tool calls', { count: (thinking.match(/🔧/g) || []).length })
          }
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
          title={t('Diagnosis')}
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
            <ContentRendererSlot
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
          title={t('Diagnosis')}
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
            <ContentRendererSlot
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
  ContentRendererSlot = DefaultContentRenderer,
}: ProactiveDiagnosisSectionProps): React.ReactElement | null {
  const { t } = useTranslation();
  const theme = useTheme();
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const headingId = React.useId();

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
  const latestDiagnosis = diagnoses.find(d => d.loading) ?? diagnoses[diagnoses.length - 1];
  const announcement = latestDiagnosis
    ? t('Diagnosis for {{kind}} {{name}}: {{status}}', {
        kind: latestDiagnosis.event.objectKind,
        name: latestDiagnosis.event.objectName,
        status: t(getStatusLabel(latestDiagnosis)),
      })
    : t('Proactive diagnosis is running');

  return (
    <Box component="section" aria-labelledby={headingId} sx={{ mb: 2 }}>
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
        <Icon
          icon="mdi:shield-search"
          width={20}
          color={theme.palette.primary.main}
          aria-hidden="true"
        />
        <Typography
          id={headingId}
          variant="subtitle2"
          component="h2"
          sx={{ fontWeight: 600, color: 'primary.main' }}
        >
          {t('Proactive Diagnosis')}
        </Typography>
        {isCycleRunning && (
          <CircularProgress
            size={14}
            aria-label={t('Proactive diagnosis progress')}
            sx={{ ml: 0.5 }}
          />
        )}
        <Chip
          label={t(
            diagnoses.length !== 1
              ? '{{completed}}/{{total}} events'
              : '{{completed}}/{{total}} event',
            { completed: completedCount, total: diagnoses.length }
          )}
          size="small"
          variant="outlined"
          sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
        />
      </Box>

      <Box
        role="status"
        aria-live="polite"
        aria-atomic="true"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
        }}
      >
        {announcement}
      </Box>

      {/* Task list — one interactive row per event with status icon. */}
      <Box>
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
              <Typography aria-hidden="true" variant="body2" sx={{ flexShrink: 0, lineHeight: 1 }}>
                {getStatusIcon(d)}
              </Typography>
              <Icon
                icon={d.event.type === 'Error' ? 'mdi:alert-circle' : 'mdi:alert'}
                color={
                  d.event.type === 'Error' ? theme.palette.error.main : theme.palette.warning.main
                }
                width={16}
                style={{ flexShrink: 0 }}
                aria-hidden="true"
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
                {t(getStatusLabel(d))}
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
              <DiagnosisResultBlock
                diagnosis={d}
                onYamlAction={onYamlAction}
                ContentRendererSlot={ContentRendererSlot}
              />
            )}
          </div>
        ))}
      </Box>

      {/* Separator between proactive diagnoses and regular chat */}
      {diagnoses.length > 0 && (
        <Divider sx={{ mt: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('Chat')}
          </Typography>
        </Divider>
      )}
    </Box>
  );
}

import type { AgentThinkingStep } from '@headlamp-k8s/ai-common/agents/types';
import { Icon } from '@iconify/react';
import {
  Box,
  ButtonBase,
  CircularProgress,
  Collapse,
  keyframes,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// ── Animations ───────────────────────────────────────────────────────────────

const pulse = keyframes`
  0%   { opacity: 1; }
  50%  { opacity: 0.4; }
  100% { opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

// ── Phase metadata ───────────────────────────────────────────────────────────

type Phase = 'init' | 'planning' | 'executing';

interface PhaseMeta {
  /** Iconify identifier shown for an active phase. */
  icon: string;
  /** Label shown while the phase has unfinished steps. */
  activeLabel: string;
  /** Label shown after every phase step completes. */
  doneLabel: string;
}

const PHASE_ORDER: Phase[] = ['init', 'planning', 'executing'];

// ── Props ────────────────────────────────────────────────────────────────────

export interface AgentThinkingStepsProps {
  /** Agent progress steps to group and render by phase. */
  steps: AgentThinkingStep[];
  /** Whether the agent is still producing work. Defaults to `true`. */
  isRunning?: boolean;
}

/**
 * Checks whether an untrusted phase value is supported by the UI.
 *
 * @param phase - Phase value to inspect.
 * @returns Whether the value is a recognized thinking phase.
 */
function isPhase(phase: unknown): phase is Phase {
  return phase === 'init' || phase === 'planning' || phase === 'executing';
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Renders live agent progress grouped into collapsible phases.
 *
 * The component auto-collapses initialization when planning begins and keeps
 * new progress visible when the user remains near the bottom of its scroll area.
 *
 * @param props - Agent progress display properties.
 * @returns Grouped progress UI, or `null` when there are no steps.
 */
const AgentThinkingSteps: React.FC<AgentThinkingStepsProps> = React.memo(
  ({ steps, isRunning = true }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const successColor = theme.palette.success.main;
    const [collapsedPhases, setCollapsedPhases] = useState<Set<Phase>>(new Set());
    const prevPhaseCountRef = useRef<Record<Phase, number>>({ init: 0, planning: 0, executing: 0 });

    const phaseMeta = useMemo<Record<Phase, PhaseMeta>>(
      () => ({
        init: {
          icon: 'mdi:cog-outline',
          activeLabel: t('Initializing'),
          doneLabel: t('Initialized'),
        },
        planning: {
          icon: 'mdi:clipboard-list-outline',
          activeLabel: t('Tasks'),
          doneLabel: t('All tasks complete'),
        },
        executing: {
          icon: 'mdi:play-circle-outline',
          activeLabel: t('Executing'),
          doneLabel: t('Execution complete'),
        },
      }),
      [t]
    );
    const endRef = useRef<HTMLDivElement>(null);

    // Group steps by phase
    const grouped = useMemo(() => {
      const map: Record<Phase, AgentThinkingStep[]> = { init: [], planning: [], executing: [] };
      for (const s of steps) {
        const phase = isPhase(s.phase) ? s.phase : 'executing';
        map[phase].push(s);
      }
      return map;
    }, [steps]);

    // Auto-collapse a phase when the next phase starts populating
    useEffect(() => {
      const prev = prevPhaseCountRef.current;
      for (let i = 0; i < PHASE_ORDER.length - 1; i++) {
        const phase = PHASE_ORDER[i];
        const nextPhase = PHASE_ORDER[i + 1];
        const prevNext = prev[nextPhase];
        if (grouped[nextPhase].length > 0 && prevNext === 0 && grouped[phase].length > 0) {
          // Next phase just received its first item – collapse this one
          // Never auto-collapse planning: task status updates are the primary progress indicator
          if (phase !== 'planning') {
            setCollapsedPhases(s => new Set(s).add(phase));
          }
        }
      }
      prevPhaseCountRef.current = {
        init: grouped.init.length,
        planning: grouped.planning.length,
        executing: grouped.executing.length,
      };
    }, [grouped]);

    // Scroll the scroll container when new steps appear so the growing
    // "Agent working…" box stays visible. Uses direct scrollTo on the
    // scroll parent instead of scrollIntoView, which can target the wrong
    // container when MUI Collapse wrappers have overflow:hidden.
    useEffect(() => {
      const el = endRef.current;
      if (steps.length === 0 || !el) return;

      // Find the current scroll container on each update because the host may
      // replace MUI Collapse wrappers without unmounting this component.
      let scrollParent: HTMLElement | null = el.parentElement;
      while (scrollParent) {
        const overflowY = getComputedStyle(scrollParent).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') break;
        scrollParent = scrollParent.parentElement;
      }

      // Delay to let MUI Collapse animations settle before measuring
      const timer = setTimeout(() => {
        if (!scrollParent) return;

        // Only auto-scroll if user is near the bottom (matches TextStreamContainer pattern)
        const distanceFromBottom =
          scrollParent.scrollHeight - scrollParent.scrollTop - scrollParent.clientHeight;
        if (distanceFromBottom > scrollParent.clientHeight) return;

        // Respect prefers-reduced-motion (with SSR guard)
        const reducedMotion =
          typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches === true
            : false;

        scrollParent.scrollTo({
          top: scrollParent.scrollHeight - scrollParent.clientHeight,
          behavior: reducedMotion ? 'auto' : 'smooth',
        });
      }, 350);

      return () => clearTimeout(timer);
    }, [steps.length]);

    if (steps.length === 0) return null;

    // Determine which phases have items
    const activePhases = PHASE_ORDER.filter(p => grouped[p].length > 0);

    /**
     * Toggles one phase's expanded state.
     *
     * @param phase - Phase whose step list should be toggled.
     * @returns No value.
     */
    const togglePhase = (phase: Phase): void => {
      setCollapsedPhases(prev => {
        const next = new Set(prev);
        if (next.has(phase)) {
          next.delete(phase);
        } else {
          next.add(phase);
        }
        return next;
      });
    };

    /**
     * Checks whether every step in a populated phase is complete.
     *
     * @param phase - Phase to inspect.
     * @returns Whether the phase has steps and all are completed.
     */
    const isPhaseComplete = (phase: Phase): boolean =>
      grouped[phase].length > 0 && grouped[phase].every(s => s.status === 'completed');

    /**
     * Renders one agent progress step.
     *
     * @param step - Agent progress step to render.
     * @returns Status icon and step label.
     */
    const renderStep = (step: AgentThinkingStep): React.ReactNode => (
      <Box
        key={step.id}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0.75,
          py: 0.25,
          animation: `${fadeIn} 0.25s ease`,
        }}
      >
        {step.status === 'running' ? (
          <Icon
            icon="mdi:loading"
            width={13}
            style={{ animation: `${spin} 1s linear infinite`, marginTop: 2, flexShrink: 0 }}
          />
        ) : step.status === 'completed' ? (
          <Icon
            icon="mdi:check-circle-outline"
            width={13}
            style={{ color: successColor, marginTop: 2, flexShrink: 0 }}
          />
        ) : (
          <Icon
            icon="mdi:circle-outline"
            width={13}
            style={{ opacity: 0.35, marginTop: 2, flexShrink: 0 }}
          />
        )}
        <Typography
          variant="caption"
          sx={{
            color:
              step.status === 'running'
                ? 'text.primary'
                : step.status === 'completed'
                ? 'text.secondary'
                : 'text.disabled',
            fontWeight: step.status === 'running' ? 500 : 400,
            lineHeight: 1.4,
            ...(step.status === 'running' && {
              animation: `${pulse} 2s ease-in-out infinite`,
            }),
          }}
        >
          {step.label}
        </Typography>
      </Box>
    );

    /**
     * Renders a populated phase and its collapsible steps.
     *
     * @param phase - Phase to render.
     * @returns Collapsible phase UI, or `null` for an empty phase.
     */
    const renderPhaseSection = (phase: Phase): React.ReactNode => {
      const items = grouped[phase];
      if (items.length === 0) return null;

      const meta = phaseMeta[phase];
      const done = isPhaseComplete(phase);
      const collapsed = collapsedPhases.has(phase);

      return (
        <Box key={phase} sx={{ mb: 0.75, '&:last-child': { mb: 0 } }}>
          {/* Phase header */}
          <ButtonBase
            aria-controls={`agent-thinking-${phase}-steps`}
            aria-expanded={!collapsed}
            aria-label={t(
              items.length === 1
                ? 'Toggle {{phase}}: {{count}} step'
                : 'Toggle {{phase}}: {{count}} steps',
              {
                phase: done ? meta.doneLabel : meta.activeLabel,
                count: items.length,
              }
            )}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              width: '100%',
              textAlign: 'left',
              userSelect: 'none',
              py: 0.25,
              '&:hover': { opacity: 0.8 },
            }}
            onClick={() => togglePhase(phase)}
          >
            {done ? (
              <Icon icon="mdi:check-circle" width={15} style={{ color: successColor }} />
            ) : (
              <Icon
                icon={meta.icon}
                width={15}
                style={!done ? { animation: `${pulse} 2s ease-in-out infinite` } : undefined}
              />
            )}
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: '0.72rem',
                letterSpacing: 0.3,
                color: done ? 'text.secondary' : 'text.primary',
              }}
            >
              {done ? meta.doneLabel : meta.activeLabel}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', fontSize: '0.6rem', ml: 0.5 }}
            >
              {t(items.length === 1 ? '{{count}} step' : '{{count}} steps', {
                count: items.length,
              })}
            </Typography>
            <Icon
              icon={collapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'}
              width={14}
              style={{ marginLeft: 'auto', opacity: 0.4 }}
            />
          </ButtonBase>

          {/* Phase items */}
          <Collapse id={`agent-thinking-${phase}-steps`} in={!collapsed} timeout={200}>
            <Box sx={{ pl: 1.5 }}>{items.map(renderStep)}</Box>
          </Collapse>
        </Box>
      );
    };

    return (
      <Collapse in={steps.length > 0}>
        <Box
          sx={{
            my: 1.5,
            mx: 0,
            p: 1.5,
            borderRadius: 1,
            bgcolor: theme => alpha(theme.palette.action.hover, 0.04),
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Top-level header */}
          <Box
            role="status"
            aria-live="polite"
            aria-atomic="true"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              mb: 1,
            }}
          >
            {isRunning ? (
              <Icon
                icon="mdi:brain"
                width={16}
                style={{ animation: `${pulse} 2s ease-in-out infinite` }}
              />
            ) : (
              <Icon icon="mdi:check-all" width={16} style={{ color: successColor }} />
            )}
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, letterSpacing: 0.3, fontSize: '0.75rem' }}
            >
              {isRunning ? t('Agent working…') : t('Done')}
            </Typography>
            {isRunning && <CircularProgress size={12} thickness={5} aria-hidden />}
          </Box>

          {/* Phase sections */}
          {activePhases.map(renderPhaseSection)}

          {/* Scroll sentinel: scrolled into view when new steps arrive */}
          <div ref={endRef} />
        </Box>
      </Collapse>
    );
  }
);

AgentThinkingSteps.displayName = 'AgentThinkingSteps';

export default AgentThinkingSteps;

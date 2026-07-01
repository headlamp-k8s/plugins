import type { AgentThinkingStep } from '@headlamp-k8s/ai-common/agent/agentTypes';
import { Icon } from '@iconify/react';
import { Box, CircularProgress, Collapse, keyframes, Typography, useTheme } from '@mui/material';
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

// ── Phase metadata ───────────────────────────────────────────────────────────

type Phase = 'init' | 'planning' | 'executing';

interface PhaseMeta {
  icon: string;
  activeLabel: string;
  doneLabel: string;
}

const PHASE_ORDER: Phase[] = ['init', 'planning', 'executing'];

// ── Props ────────────────────────────────────────────────────────────────────

interface AgentThinkingStepsProps {
  steps: AgentThinkingStep[];
  isRunning?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

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
    const scrollParentRef = useRef<HTMLElement | null>(null);

    // Group steps by phase
    const grouped = useMemo(() => {
      const map: Record<Phase, AgentThinkingStep[]> = { init: [], planning: [], executing: [] };
      for (const s of steps) {
        const phase = (s.phase ?? 'executing') as Phase;
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
        const prevNext = prev[nextPhase] ?? 0;
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

      // Cache the nearest scroll container (overflow-y: auto/scroll).
      // Skips MUI Collapse wrappers which use overflow:hidden.
      if (!scrollParentRef.current) {
        let sp: HTMLElement | null = el.parentElement;
        while (sp) {
          const overflowY = getComputedStyle(sp).overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') break;
          sp = sp.parentElement;
        }
        scrollParentRef.current = sp;
      }

      // Delay to let MUI Collapse animations settle before measuring
      const timer = setTimeout(() => {
        const scrollParent = scrollParentRef.current;
        if (!scrollParent) return;

        // Only auto-scroll if user is near the bottom (matches TextStreamContainer pattern)
        const distanceFromBottom =
          scrollParent.scrollHeight - scrollParent.scrollTop - scrollParent.clientHeight;
        if (distanceFromBottom > scrollParent.clientHeight) return;

        // Respect prefers-reduced-motion (with SSR guard)
        const reducedMotion =
          typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

    const togglePhase = (phase: Phase) => {
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

    const isPhaseComplete = (phase: Phase): boolean =>
      grouped[phase].length > 0 && grouped[phase].every(s => s.status === 'completed');

    const renderStep = (step: AgentThinkingStep) => (
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
            style={{ animation: 'spin 1s linear infinite', marginTop: 2, flexShrink: 0 }}
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

    const renderPhaseSection = (phase: Phase) => {
      const items = grouped[phase];
      if (items.length === 0) return null;

      const meta = phaseMeta[phase];
      const done = isPhaseComplete(phase);
      const collapsed = collapsedPhases.has(phase);

      return (
        <Box key={phase} sx={{ mb: 0.75, '&:last-child': { mb: 0 } }}>
          {/* Phase header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
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
                style={
                  !done ? ({ animation: `${pulse} 2s ease-in-out infinite` } as any) : undefined
                }
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
              ({items.length})
            </Typography>
            <Icon
              icon={collapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'}
              width={14}
              style={{ marginLeft: 'auto', opacity: 0.4 }}
            />
          </Box>

          {/* Phase items */}
          <Collapse in={!collapsed} timeout={200}>
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
                style={{ animation: `${pulse} 2s ease-in-out infinite` } as any}
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

        {/* Spinner keyframes (shared) */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </Collapse>
    );
  }
);

AgentThinkingSteps.displayName = 'AgentThinkingSteps';

export default AgentThinkingSteps;

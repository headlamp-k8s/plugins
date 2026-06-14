// Copyright (c) Microsoft Corporation.
// Licensed under the Apache 2.0.

import type { AgentThinkingStep } from '@headlamp-k8s/ai-common/agents/types';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import AgentThinkingSteps from './AgentThinkingSteps';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const meta: Meta<typeof AgentThinkingSteps> = {
  title: 'AIAssistant/AgentThinkingSteps',
  component: AgentThinkingSteps,
};
export default meta;

const now = Date.now();

export const initSteps: AgentThinkingStep[] = [
  { id: 1, label: 'Connecting to cluster', status: 'completed', phase: 'init', timestamp: now },
  { id: 2, label: 'Loading context', status: 'completed', phase: 'init', timestamp: now },
];

export const planningSteps: AgentThinkingStep[] = [
  { id: 3, label: 'Analyze pod health', status: 'completed', phase: 'planning', timestamp: now },
  { id: 4, label: 'Check node resources', status: 'completed', phase: 'planning', timestamp: now },
  { id: 5, label: 'Review recent events', status: 'running', phase: 'planning', timestamp: now },
  { id: 6, label: 'Gather network policies', status: 'pending', phase: 'planning', timestamp: now },
];

export const executingSteps: AgentThinkingStep[] = [
  {
    id: 7,
    label: 'Running kubectl get pods',
    status: 'completed',
    phase: 'executing',
    timestamp: now,
  },
  { id: 8, label: 'Fetching node metrics', status: 'running', phase: 'executing', timestamp: now },
];

export const completedSteps: AgentThinkingStep[] = [
  ...initSteps,
  ...planningSteps,
  ...executingSteps,
].map(step => ({ ...step, status: 'completed' }));

/** Agent actively working with steps across all phases. */
export const Running: StoryFn<typeof AgentThinkingSteps> = () => (
  <AgentThinkingSteps steps={[...initSteps, ...planningSteps, ...executingSteps]} isRunning />
);

/** All steps completed - shows success styling. */
export const Completed: StoryFn<typeof AgentThinkingSteps> = () => {
  return <AgentThinkingSteps steps={completedSteps} isRunning={false} />;
};

/** Only init phase visible. */
export const InitPhaseOnly: StoryFn<typeof AgentThinkingSteps> = () => (
  <AgentThinkingSteps
    steps={[
      { id: 1, label: 'Connecting to cluster', status: 'completed', phase: 'init', timestamp: now },
      { id: 2, label: 'Loading context', status: 'running', phase: 'init', timestamp: now },
    ]}
    isRunning
  />
);

/** Running state in dark theme - verifies contrast of success colors. */
export const RunningDark: StoryFn<typeof AgentThinkingSteps> = () => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <AgentThinkingSteps steps={[...initSteps, ...planningSteps, ...executingSteps]} isRunning />
  </ThemeProvider>
);

/** All completed in dark theme - verifies green checkmarks contrast. */
export const CompletedDark: StoryFn<typeof AgentThinkingSteps> = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AgentThinkingSteps steps={completedSteps} isRunning={false} />
    </ThemeProvider>
  );
};

// ── Edge cases ───────────────────────────────────────────────────────────────

/** Single step in running state - minimal case. */
export const SingleStep: StoryFn<typeof AgentThinkingSteps> = () => (
  <AgentThinkingSteps
    steps={[
      { id: 1, label: 'Connecting to cluster', status: 'running', phase: 'init', timestamp: now },
    ]}
    isRunning
  />
);

/** Many steps - 15+ tasks across all phases. */
export const ManySteps: StoryFn<typeof AgentThinkingSteps> = () => {
  const steps: AgentThinkingStep[] = [
    { id: 1, label: 'Connecting to cluster', status: 'completed', phase: 'init', timestamp: now },
    { id: 2, label: 'Loading context', status: 'completed', phase: 'init', timestamp: now },
    {
      id: 3,
      label: 'Authenticating with Azure AD',
      status: 'completed',
      phase: 'init',
      timestamp: now,
    },
    {
      id: 4,
      label: 'Check pod status across all namespaces',
      status: 'completed',
      phase: 'planning',
      timestamp: now,
    },
    {
      id: 5,
      label: 'Analyze node resource utilization',
      status: 'completed',
      phase: 'planning',
      timestamp: now,
    },
    {
      id: 6,
      label: 'Review recent Kubernetes events',
      status: 'completed',
      phase: 'planning',
      timestamp: now,
    },
    {
      id: 7,
      label: 'Check PersistentVolumeClaim status',
      status: 'completed',
      phase: 'planning',
      timestamp: now,
    },
    {
      id: 8,
      label: 'Inspect network policies',
      status: 'completed',
      phase: 'planning',
      timestamp: now,
    },
    {
      id: 9,
      label: 'Verify ingress configuration',
      status: 'completed',
      phase: 'planning',
      timestamp: now,
    },
    {
      id: 10,
      label: 'Running kubectl get pods --all-namespaces',
      status: 'completed',
      phase: 'executing',
      timestamp: now,
    },
    {
      id: 11,
      label: 'Running kubectl top nodes',
      status: 'completed',
      phase: 'executing',
      timestamp: now,
    },
    {
      id: 12,
      label: 'Running kubectl get events --sort-by=.lastTimestamp',
      status: 'completed',
      phase: 'executing',
      timestamp: now,
    },
    {
      id: 13,
      label: 'Running kubectl get pvc -A',
      status: 'completed',
      phase: 'executing',
      timestamp: now,
    },
    {
      id: 14,
      label: 'Running kubectl get networkpolicies -A',
      status: 'running',
      phase: 'executing',
      timestamp: now,
    },
    {
      id: 15,
      label: 'Running kubectl get ingress -A',
      status: 'pending',
      phase: 'executing',
      timestamp: now,
    },
  ];
  return <AgentThinkingSteps steps={steps} isRunning />;
};

/** Steps with very long labels - verify text wrapping. */
export const LongLabels: StoryFn<typeof AgentThinkingSteps> = () => (
  <AgentThinkingSteps
    steps={[
      {
        id: 1,
        label:
          'Connecting to AKS cluster myaks-production-eastus2-environment-primary in subscription my-azure-subscription-id-12345',
        status: 'completed',
        phase: 'init',
        timestamp: now,
      },
      {
        id: 2,
        label:
          'Loading Kubernetes context for cluster myaks-production-eastus2-environment-primary with RBAC enabled and Azure AD integration',
        status: 'completed',
        phase: 'init',
        timestamp: now,
      },
      {
        id: 3,
        label:
          'Analyzing pod health for all 47 deployments across 12 namespaces including production, staging, development, monitoring, and system namespaces',
        status: 'running',
        phase: 'planning',
        timestamp: now,
      },
    ]}
    isRunning
  />
);

/** All steps pending - early state before any work starts. */
export const AllPending: StoryFn<typeof AgentThinkingSteps> = () => (
  <AgentThinkingSteps
    steps={[
      { id: 1, label: 'Connecting to cluster', status: 'pending', phase: 'init', timestamp: now },
      { id: 2, label: 'Loading context', status: 'pending', phase: 'init', timestamp: now },
    ]}
    isRunning
  />
);

/** Many steps in dark theme - verify all status icons contrast. */
export const ManyStepsDark: StoryFn<typeof AgentThinkingSteps> = () => {
  const steps: AgentThinkingStep[] = [
    { id: 1, label: 'Connecting to cluster', status: 'completed', phase: 'init', timestamp: now },
    { id: 2, label: 'Loading context', status: 'completed', phase: 'init', timestamp: now },
    {
      id: 3,
      label: 'Authenticating with Azure AD',
      status: 'completed',
      phase: 'init',
      timestamp: now,
    },
    { id: 4, label: 'Check pod status', status: 'completed', phase: 'planning', timestamp: now },
    {
      id: 5,
      label: 'Analyze node resources',
      status: 'completed',
      phase: 'planning',
      timestamp: now,
    },
    { id: 6, label: 'Review events', status: 'completed', phase: 'planning', timestamp: now },
    {
      id: 7,
      label: 'Running kubectl get pods',
      status: 'completed',
      phase: 'executing',
      timestamp: now,
    },
    {
      id: 8,
      label: 'Running kubectl top nodes',
      status: 'completed',
      phase: 'executing',
      timestamp: now,
    },
    {
      id: 9,
      label: 'Running kubectl get events',
      status: 'running',
      phase: 'executing',
      timestamp: now,
    },
    {
      id: 10,
      label: 'Running kubectl get pvc -A',
      status: 'pending',
      phase: 'executing',
      timestamp: now,
    },
  ];
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AgentThinkingSteps steps={steps} isRunning />
    </ThemeProvider>
  );
};

// ── Smart scroll demo ────────────────────────────────────────────────────────

/** Demonstrates smart scroll: user question stays visible when thinking steps appear. */
export const SmartScroll: StoryFn<typeof AgentThinkingSteps> = () => {
  const [steps, setSteps] = React.useState<AgentThinkingStep[]>([]);

  React.useEffect(() => {
    // Simulate progressive step arrivals
    const timers = [
      setTimeout(
        () =>
          setSteps([
            {
              id: 1,
              label: 'Connecting to cluster',
              status: 'running',
              phase: 'init',
              timestamp: Date.now(),
            },
          ]),
        1000
      ),
      setTimeout(
        () =>
          setSteps(prev => [
            { ...prev[0], status: 'completed' as const },
            {
              id: 2,
              label: 'Loading context',
              status: 'running',
              phase: 'init',
              timestamp: Date.now(),
            },
          ]),
        2000
      ),
      setTimeout(
        () =>
          setSteps(prev => [
            ...prev.map(s => ({ ...s, status: 'completed' as const })),
            {
              id: 3,
              label: 'Analyze pod health',
              status: 'running',
              phase: 'planning',
              timestamp: Date.now(),
            },
            {
              id: 4,
              label: 'Check node resources',
              status: 'pending',
              phase: 'planning',
              timestamp: Date.now(),
            },
          ]),
        3000
      ),
      setTimeout(
        () =>
          setSteps(prev => [
            ...prev.map(s => ({ ...s, status: 'completed' as const })),
            {
              id: 5,
              label: 'Running kubectl get pods',
              status: 'running',
              phase: 'executing',
              timestamp: Date.now(),
            },
          ]),
        4000
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{
        height: 300,
        overflow: 'auto',
        border: '1px solid #ccc',
        padding: 16,
      }}
    >
      {/* Filler content to push thinking steps below the fold */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
          Previous conversation message {i + 1}
        </div>
      ))}
      <div
        style={{
          padding: 12,
          margin: '8px 0',
          background: '#e3f2fd',
          borderRadius: 4,
        }}
      >
        <strong>You:</strong> Why are my pods crashing in the production namespace?
      </div>
      <AgentThinkingSteps steps={steps} isRunning={steps.length > 0} />
    </div>
  );
};

/**
 * User scrolled away: scroll the container to the top before steps arrive.
 * The component should NOT yank the viewport back down.
 */
export const ScrolledAway: StoryFn<typeof AgentThinkingSteps> = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [steps, setSteps] = React.useState<AgentThinkingStep[]>([]);

  React.useEffect(() => {
    // Start scrolled to the top (simulating user scrolled away)
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    const timers = [
      setTimeout(
        () =>
          setSteps([
            {
              id: 1,
              label: 'Connecting to cluster',
              status: 'running',
              phase: 'init',
              timestamp: Date.now(),
            },
          ]),
        500
      ),
      setTimeout(
        () =>
          setSteps(prev => [
            { ...prev[0], status: 'completed' as const },
            {
              id: 2,
              label: 'Loading context',
              status: 'running',
              phase: 'init',
              timestamp: Date.now(),
            },
          ]),
        1500
      ),
      setTimeout(
        () =>
          setSteps(prev => [
            ...prev.map(s => ({ ...s, status: 'completed' as const })),
            {
              id: 3,
              label: 'Analyze pod health',
              status: 'running',
              phase: 'planning',
              timestamp: Date.now(),
            },
          ]),
        2500
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: 200,
        overflow: 'auto',
        border: '1px solid #ccc',
        padding: 16,
      }}
    >
      {/* Lots of filler to make the container scrollable */}
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
          Old message {i + 1}
        </div>
      ))}
      <div
        style={{
          padding: 12,
          margin: '8px 0',
          background: '#e3f2fd',
          borderRadius: 4,
        }}
      >
        <strong>You:</strong> Why are my pods crashing?
      </div>
      <AgentThinkingSteps steps={steps} isRunning={steps.length > 0} />
    </div>
  );
};

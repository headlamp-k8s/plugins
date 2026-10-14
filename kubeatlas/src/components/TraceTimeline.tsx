/*
 * Copyright 2026 The KubeAtlas Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Link, Stack, Tooltip, Typography } from '@mui/material';
import { OtelTraceSummary } from '../api/types';
import { formatDuration, jaegerTraceUrl } from '../lib/otel';

export interface TraceTimelineProps {
  traces: OtelTraceSummary[];
  // Base URL of a Jaeger/Tempo UI. When set, clicking a trace opens
  // <base>/trace/<traceId> in a new tab; when empty, the rows are inert
  // (KubeAtlas is not a trace viewer — deep inspection is Jaeger's job).
  jaegerBaseUrl?: string;
}

// TraceTimeline is a deliberately simple recent-trace strip: one bar per
// trace, width proportional to wall-clock duration, labelled with the
// services it touched. It is NOT a full trace/span waterfall — that is
// Jaeger/Tempo's job, which each row links out to when a base URL is set.
export function TraceTimeline({ traces, jaegerBaseUrl }: TraceTimelineProps) {
  if (traces.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No recent traces. Send OTLP traces to the KubeAtlas receiver to populate this view.
      </Typography>
    );
  }

  const maxDur = Math.max(1, ...traces.map(t => t.durationNs));

  return (
    <Stack spacing={0.5} data-testid="trace-timeline">
      {traces.map(t => {
        const widthPct = Math.max(2, (t.durationNs / maxDur) * 100);
        const url = jaegerTraceUrl(jaegerBaseUrl, t.traceId);
        const row = (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
            <Box
              sx={{
                flex: 1,
                minWidth: 120,
                height: 16,
                bgcolor: 'action.hover',
                borderRadius: 0.5,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  right: 'auto',
                  width: `${widthPct}%`,
                  bgcolor: 'primary.main',
                  opacity: 0.8,
                  borderRadius: 0.5,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ width: 72, textAlign: 'right' }}>
              {formatDuration(t.durationNs)}
            </Typography>
            <Typography variant="caption" sx={{ width: 240 }} noWrap>
              {t.services.length > 0 ? t.services.join(' → ') : '(no service.name)'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ width: 72 }}>
              {t.spanCount} spans
            </Typography>
          </Box>
        );
        return (
          <Tooltip
            key={t.traceId}
            title={url ? `Open trace ${t.traceId} in Jaeger/Tempo` : `trace ${t.traceId}`}
          >
            {url ? (
              <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                color="inherit"
              >
                {row}
              </Link>
            ) : (
              <Box>{row}</Box>
            )}
          </Tooltip>
        );
      })}
    </Stack>
  );
}

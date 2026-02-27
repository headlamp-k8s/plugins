/**
 * ProactiveDiagnosisSection
 *
 * Renders the proactive diagnosis results at the top of the AI chat window.
 * Each diagnosis is shown in an expandable card that mirrors the normal chat style.
 * Supports scroll-to-event when a user clicks from the events table column.
 */

import { Icon } from '@iconify/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { DiagnosisResult } from '../../utils/ProactiveDiagnosisManager';
import ContentRenderer from '../../ContentRenderer';

interface ProactiveDiagnosisSectionProps {
  diagnoses: DiagnosisResult[];
  scrollToEventUid: string | null;
  onScrollComplete: () => void;
  isCycleRunning: boolean;
}

export default function ProactiveDiagnosisSection({
  diagnoses,
  scrollToEventUid,
  onScrollComplete,
  isCycleRunning,
}: ProactiveDiagnosisSectionProps) {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [expandedUid, setExpandedUid] = React.useState<string | null>(null);

  // Handle scroll-to-event from events table click
  useEffect(() => {
    if (!scrollToEventUid) return;

    // Auto-expand the target diagnosis
    setExpandedUid(scrollToEventUid);

    // Scroll to the element after a short delay to let expansion render
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

  // Separate completed diagnoses from loading ones
  const completedDiagnoses = diagnoses.filter(d => !d.loading);
  const loadingDiagnoses = diagnoses.filter(d => d.loading);

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
        <Icon icon="mdi:shield-search" width={20} color="#1976d2" />
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, color: 'primary.main' }}
        >
          Proactive Diagnosis
        </Typography>
        {isCycleRunning && (
          <CircularProgress size={14} sx={{ ml: 0.5 }} />
        )}
        <Chip
          label={`${completedDiagnoses.length} event${completedDiagnoses.length !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
          sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
        />
      </Box>

      {/* Loading events */}
      {loadingDiagnoses.map(d => (
        <div
          key={d.eventUid}
          ref={el => { itemRefs.current[d.eventUid] = el; }}
        >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            mb: 0.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Diagnosing: {d.event.objectKind}/{d.event.objectName} — {d.event.reason}
          </Typography>
        </Box>
        </div>
      ))}

      {/* Completed diagnoses */}
      {completedDiagnoses.map(d => (
        <div key={d.eventUid} ref={el => { itemRefs.current[d.eventUid] = el; }}>
        <Accordion
          expanded={expandedUid === d.eventUid}
          onChange={(_, isExpanded) => setExpandedUid(isExpanded ? d.eventUid : null)}
          disableGutters
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: scrollToEventUid === d.eventUid ? 'primary.main' : 'divider',
            borderRadius: '8px !important',
            mb: 0.5,
            '&::before': { display: 'none' },
            transition: 'border-color 0.3s ease',
          }}
        >
          <AccordionSummary
            expandIcon={<Icon icon="mdi:chevron-down" />}
            sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Icon
                icon={d.event.type === 'Error' ? 'mdi:alert-circle' : 'mdi:alert'}
                color={d.event.type === 'Error' ? '#d32f2f' : '#ed6c02'}
                width={18}
              />
              <Typography variant="body2" noWrap sx={{ fontWeight: 500, flex: 1 }}>
                {d.event.objectKind}/{d.event.objectName}
              </Typography>
              <Chip
                label={d.event.reason}
                size="small"
                color={d.event.type === 'Error' ? 'error' : 'warning'}
                sx={{ fontSize: '0.65rem', height: 18 }}
              />
              {d.error && (
                <Chip
                  label="Failed"
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 18 }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 2, pb: 1.5 }}>
            {/* Event details */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {d.event.message}
            </Typography>

            {d.error ? (
              <Alert severity="error" variant="outlined" sx={{ fontSize: '0.75rem' }}>
                {d.error}
              </Alert>
            ) : (
              <Box
                sx={{
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  p: 1.5,
                  fontSize: '0.85rem',
                  '& p': { margin: '4px 0' },
                  '& ul, & ol': { margin: '4px 0', pl: 2 },
                }}
              >
                <ContentRenderer content={d.diagnosis} />
              </Box>
            )}

            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', mt: 1, textAlign: 'right' }}
            >
              Diagnosed at {new Date(d.diagnosedAt).toLocaleTimeString()}
            </Typography>
          </AccordionDetails>
        </Accordion>
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

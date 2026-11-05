/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Code } from '@connectrpc/connect';
import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Alert,
  Button,
  ButtonGroup,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import type { PipeCDConfig } from '../api/pipecd';
import { getCommand, PipeCDApiError, syncApplication } from '../api/pipecd';
import type { SyncStrategyName } from '../types/pipecd';
import type { Translate } from '../utils/time';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;
const SYNC_REQUEST_TIMEOUT_MS = 30000;

/**
 * Errors after which the server may still have queued the sync: the reply was
 * lost or the request timed out, not refused. Reporting these as a failure
 * would invite a retry, which could start a second deployment.
 */
const UNCONFIRMED_CODES: ReadonlySet<number> = new Set([
  Code.Unknown,
  Code.DeadlineExceeded,
  Code.Unavailable,
]);

/** Waits `ms`, or less if `signal` aborts first. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    const done = (): void => {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done);
  });
}

/**
 * A signal for one request: it aborts when `parent` does, or after `ms`.
 * Call `clear` once the request settles.
 */
function requestSignal(
  parent: AbortSignal,
  ms: number
): { signal: AbortSignal; timedOut: () => boolean; clear: () => void } {
  const controller = new AbortController();
  let expired = false;
  const abort = (): void => controller.abort();
  const timer = setTimeout(() => {
    expired = true;
    controller.abort();
  }, ms);
  parent.addEventListener('abort', abort);
  return {
    signal: controller.signal,
    timedOut: () => expired,
    clear: () => {
      clearTimeout(timer);
      parent.removeEventListener('abort', abort);
    },
  };
}

/**
 * The three strategies PipeCD supports. APIService.SyncApplication gained the
 * sync_strategy field in pipe-cd/pipecd; against an older server the field is
 * ignored and the default sync runs instead.
 */
function syncStrategies(
  t: Translate
): { value: SyncStrategyName; label: string; description: string }[] {
  return [
    {
      value: 'AUTO',
      label: t('Sync'),
      description: t(
        'PipeCD will decide whether to apply the manifests directly or run the pipeline.'
      ),
    },
    {
      value: 'QUICK_SYNC',
      label: t('Quick Sync'),
      description: t('Applies the manifests directly, without running the pipeline.'),
    },
    {
      value: 'PIPELINE',
      label: t('Pipeline Sync'),
      description: t('Runs the deployment pipeline configured for this application.'),
    },
  ];
}

type Phase = 'idle' | 'confirming' | 'syncing';

interface SyncResult {
  severity: 'success' | 'info' | 'error';
  message: string;
}

interface SyncButtonProps {
  config: PipeCDConfig;
  applicationId: string;
  applicationName: string;
  /** PipeCD does not deploy a disabled application, so the console blocks syncing it too. */
  disabled?: boolean;
  /** Called once a sync is started or queued so the page can reload the application. */
  onSynced?: () => void;
}

function describeFailure(error: unknown, t: Translate): string {
  if (error instanceof PipeCDApiError && error.status === Code.PermissionDenied) {
    return t('This API key is read-only. Syncing needs a READ_WRITE key.');
  }
  return error instanceof Error ? error.message : String(error);
}

/** The sync may or may not be queued, so say so instead of reporting a failure. */
function unconfirmedResult(t: Translate): SyncResult {
  return {
    severity: 'info',
    message: t(
      'PipeCD did not confirm the sync, but it may still run. Check the deployments below before syncing again.'
    ),
  };
}

export function SyncButton({
  config,
  applicationId,
  applicationName,
  disabled = false,
  onSynced,
}: SyncButtonProps): JSX.Element {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<SyncResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [strategy, setStrategy] = useState<SyncStrategyName>('AUTO');
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const strategies = syncStrategies(t);
  const selected = strategies.find(option => option.value === strategy);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const showResult = (next: SyncResult): void => {
    setResult(next);
    setResultOpen(true);
  };

  /** The dialog stays clickable while it fades out, so only close it from the confirm step. */
  const closeDialog = (): void => {
    setPhase(current => (current === 'confirming' ? 'idle' : current));
  };

  /**
   * Polls the command until piped reports an outcome, or we give up waiting.
   *
   * The command is already queued by now, so a failed poll only means its status
   * is unknown. Keep trying rather than report a failure that invites a retry,
   * which would start a second deployment.
   */
  const waitForCommand = async (commandId: string, signal: AbortSignal): Promise<SyncResult> => {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline && !signal.aborted) {
      await sleep(Math.min(POLL_INTERVAL_MS, deadline - Date.now()), signal);
      const remaining = deadline - Date.now();
      if (remaining <= 0 || signal.aborted) break;

      // A status check that hangs must not keep the buttons busy past the
      // deadline, so each one is cut off when the time left runs out.
      const poll = requestSignal(signal, remaining);

      try {
        const command = await getCommand(config, commandId, { signal: poll.signal });
        switch (command.status) {
          case 'COMMAND_SUCCEEDED':
            return {
              severity: 'success',
              message: t('Sync started for {{name}}.', { name: applicationName }),
            };
          case 'COMMAND_FAILED':
            return { severity: 'error', message: t('PipeCD could not start the sync.') };
          case 'COMMAND_TIMEOUT':
            return {
              severity: 'error',
              message: t('The piped did not pick up the sync in time.'),
            };
          default:
            break;
        }
      } catch {
        // Try again on the next poll.
      } finally {
        poll.clear();
      }
    }

    return {
      severity: 'info',
      message: t(
        'The sync is queued, but the piped has not picked it up yet. Check the deployments below before syncing again.'
      ),
    };
  };

  const handleSync = async (): Promise<void> => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('syncing');
    setResultOpen(false);

    const finish = (outcome: SyncResult): void => {
      showResult(outcome);
      if (outcome.severity !== 'error') onSynced?.();
    };

    // The sync request itself must not hang either, or the buttons stay busy.
    const request = requestSignal(controller.signal, SYNC_REQUEST_TIMEOUT_MS);
    try {
      let commandId: string;
      try {
        commandId = await syncApplication(config, applicationId, {
          strategy,
          signal: request.signal,
        });
      } finally {
        request.clear();
      }
      const outcome = await waitForCommand(commandId, controller.signal);
      if (controller.signal.aborted) return;
      finish(outcome);
    } catch (err) {
      if (controller.signal.aborted) return;
      const unconfirmed =
        request.timedOut() || (err instanceof PipeCDApiError && UNCONFIRMED_CODES.has(err.status));
      finish(
        unconfirmed ? unconfirmedResult(t) : { severity: 'error', message: describeFailure(err, t) }
      );
    } finally {
      inFlightRef.current = false;
      if (!controller.signal.aborted) setPhase('idle');
    }
  };

  return (
    <>
      <ButtonGroup size="small" variant="outlined" sx={{ flexShrink: 0 }}>
        <Button
          disabled={disabled || phase === 'syncing'}
          onClick={() => {
            setStrategy('AUTO');
            setPhase('confirming');
          }}
          startIcon={
            phase === 'syncing' ? <CircularProgress size={14} /> : <Icon icon="mdi:sync" />
          }
          sx={{ whiteSpace: 'nowrap' }}
        >
          {phase === 'syncing' ? t('Syncing…') : t('Sync')}
        </Button>
        <Button
          aria-label={t('Sync options')}
          disabled={disabled || phase === 'syncing'}
          onClick={event => setMenuAnchor(event.currentTarget)}
          sx={{ px: 0.5, minWidth: 32 }}
        >
          <Icon icon="mdi:menu-down" />
        </Button>
      </ButtonGroup>

      <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
        {strategies.map(option => (
          <MenuItem
            key={option.value}
            onClick={() => {
              setMenuAnchor(null);
              setStrategy(option.value);
              setPhase('confirming');
            }}
          >
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={phase === 'confirming'} onClose={closeDialog}>
        <DialogTitle>
          {t('{{action}} {{name}}?', { action: selected?.label, name: applicationName })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selected?.description} {t('The deployment starts straight away.')}
          </DialogContentText>
          {strategy !== 'AUTO' && (
            <DialogContentText sx={{ mt: 1.5 }}>
              {t(
                'This needs a PipeCD server newer than v0.58.0. An older server ignores this choice and runs its default sync.'
              )}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t('Cancel')}</Button>
          <Button
            variant="contained"
            disabled={phase !== 'confirming'}
            onClick={() => void handleSync()}
          >
            {t('Sync')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={resultOpen}
        autoHideDuration={6000}
        onClose={() => setResultOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={result?.severity ?? 'info'} onClose={() => setResultOpen(false)}>
          {result?.message}
        </Alert>
      </Snackbar>
    </>
  );
}

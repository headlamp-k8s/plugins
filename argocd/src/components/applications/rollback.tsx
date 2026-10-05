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

import { ActionButton, Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { ArgoApplication, RevisionHistory, SourceSpec } from '../../resources/application';

export interface RollbackOperationController {
  execute: (
    name: string,
    namespace: string,
    entry: RevisionHistory,
    syncOptions?: string[]
  ) => Promise<boolean>;
  isLoading: boolean;
}

function sourceLabel(source: SourceSpec | undefined): string {
  if (!source) return 'Unknown source';
  return source.path || source.chart || source.repoURL;
}

function RevisionDetails(props: { entry: RevisionHistory }) {
  const { entry } = props;
  const revisions = entry.revisions ?? (entry.revision ? [entry.revision] : []);
  const sources = entry.sources ?? (entry.source ? [entry.source] : []);

  return (
    <Box sx={{ display: 'grid', gap: 0.5, minWidth: 0 }}>
      {revisions.map((revision, index) => (
        <Box key={`${entry.id}-${index}`} sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {revisions.length > 1 ? `Source ${index + 1}` : 'Source'}: {sourceLabel(sources[index])}
          </Typography>
          <Typography
            component="div"
            variant="body2"
            sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}
          >
            {revision}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function DeploymentTime(props: { value: string }) {
  const formatted = new Date(props.value).toLocaleString();

  return (
    <time dateTime={props.value} title={props.value}>
      {formatted}
    </time>
  );
}

/** Renders a deliberate rollback selector for complete earlier Application deployments. */
export function RollbackAction(props: {
  application: ArgoApplication;
  operation: RollbackOperationController;
  disabled?: boolean;
}) {
  const { application, operation, disabled = false } = props;
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const candidates = application.rollbackHistory;
  const selectedEntry = candidates.find(entry => entry.id === selectedId);
  const isBlocked = disabled || operation.isLoading;

  const closeDialog = () => {
    if (operation.isLoading) return;
    setOpen(false);
    setSelectedId(null);
  };

  const confirmRollback = async () => {
    if (!selectedEntry || isBlocked) return;

    const succeeded = await operation.execute(
      application.metadata.name,
      application.metadata.namespace,
      selectedEntry,
      application.syncPolicy?.syncOptions ?? []
    );
    if (succeeded) {
      setOpen(false);
      setSelectedId(null);
    }
  };

  return (
    <>
      <ActionButton
        description={operation.isLoading ? 'Rolling back...' : 'Rollback'}
        longDescription="Deploy an earlier revision from Argo CD Sync History without changing the Application's configured Git revision."
        icon={operation.isLoading ? 'mdi:loading' : 'mdi:backup-restore'}
        onClick={() => setOpen(true)}
        iconButtonProps={{ disabled: isBlocked }}
      />
      <Dialog open={open} onClose={closeDialog} title="Rollback Application">
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>
            Select an earlier successful deployment for {application.metadata.name}. No option is
            selected automatically.
          </Typography>
          <RadioGroup
            aria-label="Rollback revision"
            value={selectedId === null ? '' : String(selectedId)}
            onChange={event => setSelectedId(Number(event.target.value))}
          >
            {candidates.map(entry => (
              <Box
                key={entry.id}
                sx={{
                  border: theme => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <FormControlLabel
                  value={String(entry.id)}
                  control={<Radio />}
                  disabled={operation.isLoading}
                  sx={{ alignItems: 'flex-start', m: 0, p: 1.25, width: '100%' }}
                  label={
                    <Box sx={{ display: 'grid', gap: 0.5, pt: 0.25 }}>
                      <Typography variant="subtitle2">History ID {entry.id}</Typography>
                      <RevisionDetails entry={entry} />
                      <Typography variant="caption" color="text.secondary">
                        Deployed <DeploymentTime value={entry.deployedAt as string} />
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            ))}
          </RadioGroup>

          {selectedEntry && (
            <Box
              aria-label="Selected deployment"
              sx={{
                border: theme => `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 1.5,
                mt: 2,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                Selected deployment · History ID {selectedEntry.id}
              </Typography>
              <RevisionDetails entry={selectedEntry} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Deployed <DeploymentTime value={selectedEntry.deployedAt as string} />
              </Typography>
            </Box>
          )}

          <Alert
            severity="warning"
            sx={theme => ({
              mt: 2,
              color: theme.palette.text.primary,
              '& .MuiAlert-icon': { color: theme.palette.warning.main },
              '& .MuiAlert-message': { color: theme.palette.text.primary },
            })}
          >
            This deploys the selected historical content as a one-time operation. It does not change
            spec.source.targetRevision or spec.sources, so Git remains the source of truth.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={operation.isLoading}>
            Cancel
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={confirmRollback}
            disabled={!selectedEntry || isBlocked}
          >
            {operation.isLoading ? 'Rolling back...' : 'Rollback'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/*
 * Copyright 2026 The Kubernetes Authors
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

import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';
import { detachPatch, getDetachIntent } from './detachAction';

/**
 * Header action that detaches or re-attaches a BareMetalHost.
 *
 * Registered against every details view, so it returns null unless the resource is a
 * BareMetalHost. Detaching takes the host out of the operator's management without
 * deleting it; attaching returns it. The button label reflects the current state, and
 * on confirm it writes or removes the detached annotation.
 *
 * @param props.item - The resource whose details view is open.
 */
export function DetachActionButton({ item }: { item: KubeObject }) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!item || item.kind !== 'BareMetalHost') {
    return null;
  }

  const intent = getDetachIntent(item);
  const name = item.metadata.name;

  // Sends the patch, closing the dialog on success and surfacing the failure in
  // place otherwise, so a rejected request is never left unhandled or unseen.
  async function submit() {
    try {
      await item.patch(detachPatch(intent.targetDetached));
      setOpen(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <ActionButton
        description={intent.label}
        icon={intent.isDetached ? 'mdi:link-variant' : 'mdi:link-variant-off'}
        onClick={() => {
          setSubmitError(null);
          setOpen(true);
        }}
      />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{`${intent.label}: ${name}`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {intent.targetDetached
              ? `This detaches ${name}, taking it out of the operator's management without ` +
                `deleting it. The operator stops reconciling it until it is attached again.`
              : `This attaches ${name}, returning it to the operator's management.`}
          </DialogContentText>
          {submitError && (
            <DialogContentText color="error" sx={{ mt: 1 }}>
              {submitError}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>
            {intent.label}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

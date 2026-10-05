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
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { useState } from 'react';
import { RebootMode, rebootPatch } from './rebootAction';

/**
 * Header action that reboots a BareMetalHost.
 *
 * Registered against every details view, so it returns null unless the resource is a
 * BareMetalHost. Reboot is imperative: on confirm it writes the reboot annotation, and
 * the operator reboots the host over its BMC and clears the annotation. The dialog lets
 * the user choose a soft or hard reboot, and confirms because it affects physical
 * hardware.
 *
 * @param props.item - The resource whose details view is open.
 */
export function RebootActionButton({ item }: { item: KubeObject }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<RebootMode>('soft');
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!item || item.kind !== 'BareMetalHost') {
    return null;
  }

  const name = item.metadata.name;

  // Sends the patch, closing the dialog on success and surfacing the failure in
  // place otherwise, so a rejected request is never left unhandled or unseen.
  async function submit() {
    try {
      await item.patch(rebootPatch(mode));
      setOpen(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <ActionButton
        description="Reboot"
        icon="mdi:restart"
        onClick={() => {
          setSubmitError(null);
          setOpen(true);
        }}
      />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{`Reboot: ${name}`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`This asks the operator to reboot ${name} over its BMC. A soft reboot is graceful; ` +
              `a hard reboot is a power cycle.`}
          </DialogContentText>
          <RadioGroup
            row
            name="reboot-mode"
            aria-label="Reboot mode"
            value={mode}
            onChange={e => setMode(e.target.value as RebootMode)}
          >
            <FormControlLabel value="soft" control={<Radio />} label="Soft" />
            <FormControlLabel value="hard" control={<Radio />} label="Hard" />
          </RadioGroup>
          {submitError && (
            <DialogContentText color="error" sx={{ mt: 1 }}>
              {submitError}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>
            Reboot
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

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
import { getPowerIntent, powerPatch } from './powerAction';

/**
 * Header action that toggles a BareMetalHost's power intent (`spec.online`).
 *
 * Registered against every details view, so it returns null unless the resource
 * is a BareMetalHost. It reads the current power state to label the button, and
 * on confirm sends a single-field patch; the operator carries out the actual
 * power change over the host's BMC. Because it acts on physical hardware, the
 * change goes through a confirmation dialog.
 *
 * @param props.item - The resource whose details view is open.
 */
export function PowerActionButton({ item }: { item: KubeObject }) {
  const [open, setOpen] = useState(false);

  if (!item || item.kind !== 'BareMetalHost') {
    return null;
  }

  const intent = getPowerIntent(item);
  const name = item.metadata.name;

  return (
    <>
      <ActionButton
        description={intent.label}
        icon={intent.isOn ? 'mdi:power-plug-off' : 'mdi:power-plug'}
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{`${intent.label}: ${name}`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`This sets spec.online to ${intent.targetOnline} on ${name}. The bare metal ` +
              `operator then powers the host ${intent.targetOnline ? 'on' : 'off'} over its BMC.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpen(false);
              item.patch(powerPatch(intent.targetOnline));
            }}
          >
            {intent.label}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

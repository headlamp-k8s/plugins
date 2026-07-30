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
  MenuItem,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import {
  deprovisionPatch,
  DISK_FORMATS,
  DiskFormat,
  imagePatch,
  isConsumed,
  isProvisioned,
  validateImage,
} from './reprovisionAction';

/**
 * Header action that reprovisions a BareMetalHost.
 *
 * Registered against every details view, so it returns null unless the resource is a
 * BareMetalHost. Reprovisioning re-images the host by setting `spec.image`; the form
 * collects the image URL, checksum, and format and validates them the way the operator
 * requires before submitting. When the host already has an image, a Deprovision option
 * clears it. Both are wipes, so the dialog is the confirmation gate.
 *
 * @param props.item - The resource whose details view is open.
 */
export function ReprovisionActionButton({ item }: { item: KubeObject }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [checksum, setChecksum] = useState('');
  const [format, setFormat] = useState<DiskFormat | ''>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!item || item.kind !== 'BareMetalHost') {
    return null;
  }

  const name = item.metadata.name;
  const provisioned = isProvisioned(item);
  const consumed = isConsumed(item);
  const consumerName = item.jsonData.spec?.consumerRef?.name;
  const error = validateImage({ url, checksum, format });
  const close = () => setOpen(false);

  // Sends the patch, closing the dialog on success and surfacing the failure in
  // place otherwise, so a rejected request is never left unhandled or unseen.
  async function submit(patchBody: object) {
    try {
      await item.patch(patchBody);
      setOpen(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <ActionButton
        description="Reprovision"
        icon="mdi:autorenew"
        onClick={() => {
          setSubmitError(null);
          setOpen(true);
        }}
      />
      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{`Reprovision: ${name}`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Re-image ${name} by setting its image. The operator wipes the host and deploys the ` +
              `new image over its BMC.`}
          </DialogContentText>
          {consumed && (
            <DialogContentText sx={{ mt: 1, color: 'warning.main' }}>
              {`This host is claimed by ${consumerName}. Its image is normally managed by that ` +
                `consumer, so reprovisioning it directly may conflict.`}
            </DialogContentText>
          )}
          <TextField
            label="Image URL"
            value={url}
            onChange={e => setUrl(e.target.value)}
            fullWidth
            margin="dense"
            required
            placeholder="http://images.example.com/ubuntu-22.04.qcow2"
          />
          <TextField
            label="Checksum"
            value={checksum}
            onChange={e => setChecksum(e.target.value)}
            fullWidth
            margin="dense"
            helperText="Required for all formats except live-iso and oci:// images."
          />
          <TextField
            label="Format"
            value={format}
            onChange={e => setFormat(e.target.value as DiskFormat | '')}
            select
            fullWidth
            margin="dense"
          >
            <MenuItem value="">(default)</MenuItem>
            {DISK_FORMATS.map(f => (
              <MenuItem key={f} value={f}>
                {f}
              </MenuItem>
            ))}
          </TextField>
          {error && (
            <DialogContentText color="error" sx={{ mt: 1 }}>
              {error}
            </DialogContentText>
          )}
          {submitError && (
            <DialogContentText color="error" sx={{ mt: 1 }}>
              {submitError}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          {provisioned && (
            <Button color="error" onClick={() => submit(deprovisionPatch())}>
              Deprovision
            </Button>
          )}
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="contained"
            disabled={Boolean(error)}
            onClick={() => submit(imagePatch({ url, checksum, format }))}
          >
            Reprovision
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

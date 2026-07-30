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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

/** Disk formats the operator accepts for a provisioning image (from the Image spec). */
export const DISK_FORMATS = ['raw', 'qcow2', 'vdi', 'vmdk', 'live-iso'] as const;
export type DiskFormat = (typeof DISK_FORMATS)[number];

/** The image fields a user enters to (re)provision a host. */
export interface ImageInput {
  url: string;
  checksum: string;
  format: DiskFormat | '';
}

/** Whether the host currently has a provisioning image set. */
export function isProvisioned(host: KubeObject): boolean {
  return Boolean(host.jsonData.spec?.image?.url);
}

/**
 * Whether the host is claimed by a consumer through `spec.consumerRef` (a Metal3Machine
 * or a HostClaim). A consumed host's image is managed by that consumer, so reprovisioning
 * it directly can fight the controller; callers use this to warn.
 */
export function isConsumed(host: KubeObject): boolean {
  return Boolean(host.jsonData.spec?.consumerRef?.name);
}

/**
 * Validates the image input the way the operator requires: a URL is always needed,
 * and a checksum is required for every format except `live-iso` and `oci://` images.
 * Pure, so it can be unit-tested and later reused by a create form.
 *
 * @param input - The image fields the user entered.
 * @returns An error message, or null when the input is valid.
 */
export function validateImage(input: ImageInput): string | null {
  if (!input.url.trim()) {
    return 'An image URL is required.';
  }
  const isLiveIso = input.format === 'live-iso';
  const isOci = input.url.trim().startsWith('oci://');
  if (!isLiveIso && !isOci && !input.checksum.trim()) {
    return 'A checksum is required for this image format.';
  }
  return null;
}

/**
 * Builds the patch that (re)provisions a host by setting `spec.image`. Optional
 * fields are omitted when empty so the operator applies its own defaults.
 *
 * @param input - The validated image fields.
 * @returns The merge-patch body for `KubeObject.patch`.
 */
export function imagePatch(input: ImageInput): { spec: { image: Record<string, string> } } {
  const image: Record<string, string> = { url: input.url.trim() };
  if (input.checksum.trim()) {
    image.checksum = input.checksum.trim();
  }
  if (input.format) {
    image.format = input.format;
  }
  return { spec: { image } };
}

/**
 * Builds the patch that deprovisions a host by clearing `spec.image`. Setting the
 * field to null removes it in a merge patch, which the operator treats as a request
 * to wipe and deprovision.
 *
 * @returns The merge-patch body for `KubeObject.patch`.
 */
export function deprovisionPatch(): { spec: { image: null } } {
  return { spec: { image: null } };
}

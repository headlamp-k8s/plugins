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

/** The disk types the operator reports in `status.hardware.storage[].type`. */
export const DISK_TYPES = ['HDD', 'SSD', 'NVME'] as const;
export type DiskType = (typeof DISK_TYPES)[number];

/** One entry of a host's `status.hardware.storage`, in the fields we read. */
export interface StorageDevice {
  /** Device type, one of HDD, SSD or NVME. Absent on older operator versions. */
  type?: string;
  /**
   * Whether the disk is spinning media. Deprecated upstream in favour of `type`,
   * and serialised with `omitempty`, so `false` and "not reported" are the same
   * absence on the wire and it can only ever confirm a disk *is* rotational.
   */
  rotational?: boolean;
}

/**
 * Formats a storage device's type for display.
 *
 * `type` is the field the operator recommends: it is an enum of HDD, SSD and
 * NVME, so it distinguishes the three, and it is only set when the value is
 * actually known. The older `rotational` boolean cannot do either — it collapses
 * SSD and NVME into one value, and because it is `omitempty` a `false` is
 * indistinguishable from a disk introspection never reported on. So `rotational`
 * is consulted only as a fallback and only when true, and an unknown type is
 * reported as unknown rather than guessed at.
 *
 * @param disk - The storage entry, if present.
 * @returns The disk type, or `'-'` when it cannot be determined.
 */
export function formatDiskType(disk?: StorageDevice): string {
  const reported = disk?.type?.trim();
  if (reported) {
    // Match the documented enum case-insensitively, but pass an unrecognised
    // value straight through so a type added upstream still shows.
    return DISK_TYPES.find(t => t === reported.toUpperCase()) ?? reported;
  }
  // Only a true rotational tells us anything; false or absent are the same here.
  return disk?.rotational === true ? 'HDD' : '-';
}

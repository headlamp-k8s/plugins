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

/** Protocol label per BMC type the operator registers a handler for. */
const PROTOCOL_LABELS: Record<string, string> = {
  ipmi: 'IPMI',
  libvirt: 'libvirt',
  redfish: 'Redfish',
  'idrac-redfish': 'iDRAC (Redfish)',
  'ilo5-redfish': 'iLO 5 (Redfish)',
  'redfish-virtualmedia': 'Redfish virtual media',
  'idrac-virtualmedia': 'iDRAC virtual media',
  'ilo5-virtualmedia': 'iLO 5 virtual media',
  'redfish-uefihttp': 'Redfish UEFI HTTP',
};

/** Whether a BMC scheme is recognised, absent, or unrecognised. */
export type BmcSchemeStatus = 'ok' | 'missing' | 'unknown';

/** The result of parsing a BMC address scheme. */
export interface BmcScheme {
  /** The scheme parsed from the address (lower-cased), or '' when there is none. */
  scheme: string;
  /** A human protocol label, or the raw scheme when unrecognised. */
  protocol: string;
  /** Whether the scheme is recognised ('ok'), absent ('missing'), or unknown. */
  status: BmcSchemeStatus;
}

/**
 * Parses and classifies the scheme of a BMC address. The vendor and protocol live
 * only in the URL scheme, so a missing scheme is the trap the operator silently reads
 * as IPMI, and an unrecognised scheme fails the same way. Both are flagged so the UI
 * can warn instead of letting the host fail registration with a generic error. The
 * Redfish family's optional `+http`/`+https` suffix is tolerated.
 *
 * @param address - The value of `spec.bmc.address`, e.g. "redfish://host".
 * @returns The parsed scheme, a protocol label, and its status.
 */
export function parseBmcScheme(address: string | undefined): BmcScheme {
  const raw = (address ?? '').trim();
  const match = raw.match(/^([a-zA-Z0-9-]+)(\+https?)?:\/\//);
  if (!match) {
    return { scheme: '', protocol: 'Unknown', status: 'missing' };
  }
  const type = match[1].toLowerCase();
  if (type in PROTOCOL_LABELS) {
    return { scheme: type, protocol: PROTOCOL_LABELS[type], status: 'ok' };
  }
  return { scheme: type, protocol: type, status: 'unknown' };
}

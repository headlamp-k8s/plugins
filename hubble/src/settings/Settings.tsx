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

import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TextField } from '@mui/material';
import { DEFAULT_ADAPTER_SERVICE, type HubbleSettings } from '../utils/settings';

interface SettingsProps {
  data?: HubbleSettings;
  onDataChange?: (data: HubbleSettings) => void;
}

const fields: { key: keyof HubbleSettings; name: string; label: string; fallback: string }[] = [
  {
    key: 'adapterNamespace',
    name: 'Adapter namespace',
    label: 'Namespace of the hubble-flows-adapter Service',
    fallback: DEFAULT_ADAPTER_SERVICE.namespace,
  },
  {
    key: 'adapterName',
    name: 'Adapter Service',
    label: 'Name of the hubble-flows-adapter Service',
    fallback: DEFAULT_ADAPTER_SERVICE.name,
  },
  {
    key: 'adapterPort',
    name: 'Adapter port',
    label: 'Port name or number of the hubble-flows-adapter Service',
    fallback: DEFAULT_ADAPTER_SERVICE.port,
  },
];

/**
 * Where the plugin finds the hubble-flows-adapter. A field left empty uses the default
 * shown in it, which is what the manifest in the plugin's adapter directory creates.
 */
export default function Settings({ data, onDataChange }: SettingsProps) {
  return (
    <NameValueTable
      rows={fields.map(field => ({
        name: field.name,
        value: (
          <TextField
            size="small"
            value={data?.[field.key] ?? ''}
            placeholder={field.fallback}
            inputProps={{ 'aria-label': field.label }}
            onChange={event => onDataChange?.({ ...data, [field.key]: event.target.value })}
          />
        ),
      }))}
    />
  );
}

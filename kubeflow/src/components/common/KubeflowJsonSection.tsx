/**
 * Copyright 2026 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';

interface KubeflowJsonSectionProps {
  title: string;
  value: unknown;
}

/**
 * Renders a read-only JSON preview inside a standard Headlamp section.
 */
export function KubeflowJsonSection({ title, value }: KubeflowJsonSectionProps) {
  return (
    <SectionBox title={title}>
      <Box
        component="pre"
        sx={{
          m: 0,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
        }}
      >
        {JSON.stringify(value, null, 2)}
      </Box>
    </SectionBox>
  );
}

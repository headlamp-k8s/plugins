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

import { Box } from '@mui/material';
import { useState } from 'react';

interface ChartIconProps {
  url?: string;
  size?: number;
  /**
   * Takes no room until the image is displayed. For a place where the icon stands alone, and an
   * empty slot would look like a stray indent; in a list the slot is kept so the rows stay aligned.
   */
  collapsible?: boolean;
}

/**
 * Icon a chart declares in its metadata, followed by the space separating it from the text.
 *
 * The image is served by the chart publisher, not by the cluster: the browser fetches it from the
 * Internet, which air-gapped or filtered networks cannot reach, sometimes without getting any
 * answer for minutes. Nothing is therefore painted before the image is fully loaded: without an
 * icon, while it loads and when it fails, the slot is simply empty.
 */
export function ChartIcon({ url, size = 20, collapsible = false }: ChartIconProps) {
  const [outcome, setOutcome] = useState<{ url: string; loaded: boolean }>();
  // The outcome of another address says nothing about this one.
  const settled = outcome?.url === url ? outcome : undefined;
  const loaded = settled?.loaded === true;
  const failed = settled?.loaded === false;
  const collapsed = collapsible && !loaded;

  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: 'inline-flex',
        flexShrink: 0,
        overflow: 'hidden',
        height: size,
        width: collapsed ? 0 : size,
        mr: collapsed ? 0 : 1,
      }}
    >
      {url && !failed && (
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          decoding="async"
          // The publisher does not need to know which Headlamp page asked for its icon.
          referrerPolicy="no-referrer"
          style={{
            flexShrink: 0,
            objectFit: 'contain',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 150ms',
          }}
          onLoad={() => setOutcome({ url, loaded: true })}
          onError={() => setOutcome({ url, loaded: false })}
        />
      )}
    </Box>
  );
}

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

import type { Theme } from '@mui/material';

export type AlertSeverity = 'success' | 'info' | 'warning' | 'error';

type AlertTextStyle = { '& .MuiAlert-message'?: { color: string } };

/**
 * Text colour for a status Alert. Combine it with the caller's own spacing:
 * `sx={[{ mb: 2 }, alertTextSx('success')]}`.
 *
 * MUI dims alert text in dark mode, so there the text is tinted by severity at
 * full strength. Light mode keeps MUI's own text colour, because a light tint
 * on the pale alert background is hard to read.
 */
export function alertTextSx(severity: AlertSeverity): (theme: Theme) => AlertTextStyle {
  return theme =>
    theme.palette.mode === 'dark'
      ? { '& .MuiAlert-message': { color: theme.palette[severity].light } }
      : {};
}

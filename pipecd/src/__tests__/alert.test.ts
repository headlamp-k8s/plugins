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
import { createTheme } from '@mui/material';
import { describe, expect, it } from 'vitest';
import { alertTextSx } from '../utils/alert';

function resolve(theme: Theme): Record<string, unknown> {
  return alertTextSx('success')(theme);
}

describe('alertTextSx', () => {
  it('keeps the default alert text colour in light mode', () => {
    expect(resolve(createTheme({ palette: { mode: 'light' } }))).toEqual({});
  });

  it('tints the alert text by severity in dark mode', () => {
    const theme = createTheme({ palette: { mode: 'dark' } });

    expect(resolve(theme)).toEqual({
      '& .MuiAlert-message': { color: theme.palette.success.light },
    });
  });
});

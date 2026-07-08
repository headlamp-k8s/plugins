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

import { getProviderById } from '@headlamp-k8s/ai-common/providers/catalog';
import type { DetectedProvider } from '@headlamp-k8s/ai-common/providers/detectProvider';
import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Props for the DetectedProvidersDialog. */
export interface DetectedProvidersDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Callback when the dialog is closed without adding providers. */
  onClose: () => void;
  /** Detected providers to display. */
  detectedProviders: DetectedProvider[];
  /** Callback when the user adds selected providers. */
  onAddProviders: (providers: DetectedProvider[]) => void;
  /** Callback when the user dismisses all detected providers. */
  onDismiss?: (providers: DetectedProvider[]) => void;
  /** Component used to render the dialog shell. Falls back to MUI Dialog. */
  DialogSlot?: React.ElementType;
}

/**
 * Dialog that displays auto-detected AI providers and lets users select
 * which ones to add to their configuration.
 *
 * @param props - Dialog state, detected providers, callbacks, and optional dialog slot.
 * @returns Provider-selection dialog.
 */
export default function DetectedProvidersDialog({
  open,
  onClose,
  detectedProviders,
  onAddProviders,
  onDismiss,
  DialogSlot = Dialog,
}: DetectedProvidersDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(detectedProviders.map((_, i) => i))
  );
  const providerListKey = JSON.stringify(
    detectedProviders.map(provider => [provider.providerId, provider.displayName, provider.source])
  );
  const providerCount = detectedProviders.length;

  useEffect(() => {
    if (open) {
      setSelected(new Set(Array.from({ length: providerCount }, (_, index) => index)));
    }
  }, [open, providerCount, providerListKey]);

  /** Toggles one provider selection. @param index - Provider list index. @returns No value. */
  const handleToggle = (index: number): void => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  /** Submits the currently selected providers. @returns No value. */
  const handleAdd = (): void => {
    const selectedProviders = detectedProviders.filter((_, i) => selected.has(i));
    onAddProviders(selectedProviders);
  };

  /** Dismisses all detected providers and closes the dialog. @returns No value. */
  const handleDismiss = (): void => {
    onDismiss?.(detectedProviders);
    onClose();
  };

  return (
    <DialogSlot open={open} onClose={onClose} maxWidth="sm">
      <DialogTitle>{t('Detected AI Providers')}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t(
            'The following AI providers were automatically detected on your system. Select which ones you would like to add.'
          )}
        </DialogContentText>
        {detectedProviders.map((provider, index) => {
          const providerInfo = getProviderById(provider.providerId);
          const icon = providerInfo?.icon || 'mdi:robot';
          return (
            <FormControlLabel
              key={`${provider.providerId}-${index}`}
              control={
                <Checkbox checked={selected.has(index)} onChange={() => handleToggle(index)} />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon icon={icon} width={20} height={20} aria-hidden="true" />
                  <Box>
                    <Typography variant="body1">{provider.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('Source: {{source}}', { source: provider.source })}
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ display: 'flex', mb: 1, ml: 0 }}
            />
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDismiss} color="inherit">
          {t('Not Now')}
        </Button>
        <Button onClick={handleAdd} variant="contained" disabled={selected.size === 0}>
          {t('Add Selected ({{count}})', { count: selected.size })}
        </Button>
      </DialogActions>
    </DialogSlot>
  );
}

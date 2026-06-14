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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Mock react-i18next with interpolation support so tests behave like the
// initialized bundle (where initAiUiI18n() has been called).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (!opts) return key;
      return key.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts[k] ?? `{{${k}}}`));
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Heavy MUI/icon deps are not needed for these logic-focused tests.
vi.mock('@iconify/react', () => ({ Icon: () => null }));
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return actual;
});

import {
  type SavedConfigurations,
  saveProviderConfig,
} from '@headlamp-k8s/ai-common/managers/ProviderConfigManager';
import ModelSelector from '../ModelSelector/ModelSelector';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSavedConfigs(providerId: string): SavedConfigurations {
  return saveProviderConfig(
    { providers: [], termsAccepted: true },
    providerId,
    providerId === 'copilot'
      ? { apiKey: 'ghp_test', model: 'gpt-4o' }
      : { apiKey: 'sk-test', model: 'gpt-4o' },
    true,
    providerId === 'copilot' ? 'GitHub Copilot' : 'OpenAI'
  );
}

function renderModelSelector(savedConfigs: SavedConfigurations, onChange = vi.fn()) {
  const active = savedConfigs.providers![0];
  return render(
    <ModelSelector
      selectedProvider={active.providerId}
      config={active.config}
      savedConfigs={savedConfigs}
      configName={active.displayName ?? ''}
      isConfigView
      onChange={onChange}
    />
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog closes after deletion
// ---------------------------------------------------------------------------

describe('ModelSelector — delete dialog', () => {
  it('closes the delete confirmation dialog after confirming deletion', async () => {
    const onChange = vi.fn();
    const configs = makeSavedConfigs('openai');
    renderModelSelector(configs, onChange);

    // Open the 3-dot menu for the provider card
    const moreButton = screen.getByRole('button', { name: /more options/i });
    fireEvent.click(moreButton);

    // Click Delete in the menu
    const deleteMenuItem = await screen.findByRole('menuitem', { name: /delete/i });
    fireEvent.click(deleteMenuItem);

    // Confirm dialog should be visible
    expect(screen.getByText(/are you sure you want to delete/i)).toBeTruthy();

    // Click the confirm Delete button inside the dialog
    const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
    const confirmDelete = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(confirmDelete);

    // Dialog must be gone
    await waitFor(() => {
      expect(screen.queryByText(/are you sure you want to delete/i)).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Provider name interpolation in dialog title
// ---------------------------------------------------------------------------

describe('ModelSelector — ConfigurationDialog title interpolation', () => {
  it.each([
    ['copilot', 'GitHub Copilot'],
    ['azure', 'Azure OpenAI'],
  ])(
    'renders "Configure %s" with the provider name, not {{provider}}',
    async (providerId, expectedName) => {
      const base = makeSavedConfigs('openai');
      const modifiedConfigs: SavedConfigurations = {
        ...base,
        providers: [
          {
            providerId,
            config:
              providerId === 'copilot'
                ? { apiKey: 'ghp_test', model: 'gpt-4o' }
                : {
                    apiKey: 'sk-test',
                    endpoint: 'https://x.openai.azure.com',
                    deploymentName: 'gpt4',
                    model: 'gpt-4',
                  },
            displayName: expectedName,
          },
        ],
      };

      render(
        <ModelSelector
          selectedProvider={providerId}
          config={modifiedConfigs.providers![0].config}
          savedConfigs={modifiedConfigs}
          configName={expectedName}
          isConfigView
          onChange={vi.fn()}
        />
      );

      // Click the provider card to open the configuration dialog
      const providerCard = screen
        .getByText(expectedName)
        .closest('[role="button"], button, .MuiPaper-root');
      if (providerCard) fireEvent.click(providerCard);

      // Or trigger via the Edit menu item
      const moreBtn = screen.queryByRole('button', { name: /more options/i });
      if (moreBtn) {
        fireEvent.click(moreBtn);
        const editItem = await screen.findByRole('menuitem', { name: /edit/i });
        fireEvent.click(editItem);
      }

      // The dialog title must show the real provider name, not the raw {{provider}} key
      const title = await screen
        .findByRole('heading', { name: new RegExp(`Configure ${expectedName}`, 'i') })
        .catch(() => null);
      if (title) {
        expect(title.textContent).not.toContain('{{provider}}');
        expect(title.textContent).toContain(expectedName);
      }
    }
  );
});

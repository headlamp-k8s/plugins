import { expect, type Page, test } from '@playwright/test';
import type { ReactElement } from 'react';

declare global {
  interface Window {
    pluginLib: {
      React: typeof import('react');
      ReactRedux: {
        useSelector: (
          selector: (state: { eventCallbackReducer: { trackerFuncs: unknown[] } }) => number
        ) => number;
      };
      registerAppBarAction: (component: () => ReactElement) => void;
    };
  }
}

test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 15_000 });

async function openAssistant(page: Page) {
  await page.getByRole('button', { name: 'AI Assistant', exact: true }).click();
  await expect(page.locator('#deployment-ai-prompt')).toBeEnabled();
}

async function closeAssistant(page: Page) {
  await page
    .getByRole('complementary', { name: 'AI Assistant panel' })
    .getByRole('button', { name: 'Close', exact: true })
    .click();
}

async function checkPodDraft(page: Page, name: string) {
  await page.getByRole('link', { name, exact: true }).first().click();
  await page.getByRole('button', { name: 'How can I debug this pod?', exact: true }).click();
  await expect(page.locator('#deployment-ai-prompt')).toHaveValue(
    `How can I debug pod ${name} in namespace demo?`
  );
  await page.locator('#deployment-ai-prompt').clear();
}

test.describe('Headlamp navigation event registration', () => {
  let browserErrors: string[];
  let modelRequests: string[];

  test.beforeEach(async ({ page }) => {
    browserErrors = [];
    modelRequests = [];
    page.on('pageerror', error => browserErrors.push(error.message));
    page.on('console', message => {
      if (/Cannot update a component.*while rendering a different component/.test(message.text())) {
        browserErrors.push(message.text());
      }
    });
    page.on('request', request => {
      if (request.url().includes('/event-registration-model/')) {
        modelRequests.push(request.url());
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem(
        'pluginConfigs',
        JSON.stringify({
          '@headlamp-k8s/ai-assistant': {
            previewEnabled: true,
            proactiveDiagnosisEnabled: false,
            configPopoverShown: true,
            enabledTools: [],
            providers: [
              {
                providerId: 'vllm',
                config: {
                  baseUrl: `${location.origin}/event-registration-model`,
                  model: 'navigation-regression',
                },
              },
            ],
          },
        })
      );
    });
    await page.route('**/config', async route => {
      const response = await route.fetch();
      const config = await response.json();
      await route.fulfill({
        response,
        json: {
          ...config,
          clusters: config.clusters.filter((cluster: { name: string }) => cluster.name === 'main'),
        },
      });
    });
    await page.goto('/c/main/pods');
    const login = page.getByRole('button', { name: 'Use A Token' });
    if (await login.isVisible()) {
      const token = process.env.HEADLAMP_TOKEN;
      expect(token, 'HEADLAMP_TOKEN is required when authentication is enabled').toBeTruthy();
      await login.click();
      await page.getByRole('textbox', { name: 'ID token' }).fill(token!);
      await page.getByRole('button', { name: 'Authenticate' }).click();
    }
    await expect(page.getByRole('link', { name: 'checkout-crashloop', exact: true })).toBeVisible();
    await openAssistant(page);
    await page.getByLabel('Assistant mode').click();
    await page.getByRole('option', { name: 'Chat', exact: true }).click();
  });

  test.afterEach(() => {
    expect(
      browserErrors,
      'Navigation must not cause uncaught errors or render-phase warnings'
    ).toEqual([]);
    expect(modelRequests, 'Reviewing context-specific drafts must not send model requests').toEqual(
      []
    );
  });

  test('keeps one host callback through navigation and assistant rerenders', async ({ page }) => {
    // Production React omits development warnings; inspect the real host registry as well.
    await page.evaluate(() => {
      const host = window.pluginLib;
      host.registerAppBarAction(function EventCallbackProbe() {
        const count = host.ReactRedux.useSelector(
          state => state.eventCallbackReducer.trackerFuncs.length
        );
        return host.React.createElement(
          'span',
          { 'data-testid': 'headlamp-event-callback-count', 'aria-hidden': true },
          count
        );
      });
    });
    const callbackCount = page.getByTestId('headlamp-event-callback-count');
    await expect(callbackCount).toHaveText('1');

    for (const name of ['checkout-crashloop', 'inventory-pending', 'checkout-crashloop']) {
      await checkPodDraft(page, name);
      await expect(callbackCount).toHaveText('1');
      await closeAssistant(page);
      await openAssistant(page);
      await expect(callbackCount).toHaveText('1');
      await page.getByRole('button', { name: 'Pods', exact: true }).click();
      await expect(
        page.getByRole('link', { name: 'checkout-crashloop', exact: true })
      ).toBeVisible();
      await expect(callbackCount).toHaveText('1');
    }
  });

  test('uses the current resource for drafts after navigation and panel reopening', async ({
    page,
  }) => {
    await checkPodDraft(page, 'checkout-crashloop');
    await page.getByRole('button', { name: 'Pods', exact: true }).click();
    await expect(page.getByRole('link', { name: 'inventory-pending', exact: true })).toBeVisible();
    await checkPodDraft(page, 'inventory-pending');
    await closeAssistant(page);
    await openAssistant(page);
    await page.getByRole('button', { name: 'How can I debug this pod?', exact: true }).click();
    await expect(page.locator('#deployment-ai-prompt')).toHaveValue(
      'How can I debug pod inventory-pending in namespace demo?'
    );
    await page.locator('#deployment-ai-prompt').clear();

    await page.getByRole('button', { name: 'Deployments', exact: true }).click();
    await page.getByRole('link', { name: 'web', exact: true }).first().click();
    await page
      .getByRole('button', { name: 'How can I scale this deployment?', exact: true })
      .click();
    await expect(page.locator('#deployment-ai-prompt')).toHaveValue(
      'How can I scale deployment web in namespace demo?'
    );
    await expect(
      page.getByRole('button', { name: 'How can I debug this pod?', exact: true })
    ).toBeHidden();
  });
});

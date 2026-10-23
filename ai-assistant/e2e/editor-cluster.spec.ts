import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const screenshotsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');

test.use({ viewport: { width: 1440, height: 1100 } });

test('applies a suggested ServiceAccount from a page without a cluster URL', async ({ page }) => {
  const clientId = '11111111-1111-1111-1111-111111111111';
  const suggestion = `Add the workload identity annotation to the service account:

\`\`\`yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
  namespace: demo
  annotations:
    azure.workload.identity/client-id: ${clientId}
\`\`\``;

  await page.addInitScript(() => {
    localStorage.setItem(
      'pluginConfigs',
      JSON.stringify({
        '@headlamp-k8s/ai-assistant': {
          previewEnabled: true,
          configPopoverShown: true,
          enabledTools: [],
          providers: [
            {
              providerId: 'vllm',
              config: { baseUrl: `${location.origin}/e2e-model`, model: 'editor-regression' },
            },
          ],
        },
      })
    );
  });
  await page.route('**/e2e-model/v1/chat/completions', async route => {
    await route.fulfill({
      json: {
        id: 'editor-regression',
        object: 'chat.completion',
        choices: [
          { index: 0, message: { role: 'assistant', content: suggestion }, finish_reason: 'stop' },
        ],
      },
    });
  });

  await page.goto('/c/main/nodes');
  const tokenLogin = page.getByRole('button', { name: 'Use A Token' });
  if (await tokenLogin.isVisible()) {
    const token = process.env.HEADLAMP_TOKEN;
    expect(token, 'HEADLAMP_TOKEN is required for authentication').toBeTruthy();
    await tokenLogin.click();
    await page.getByRole('textbox', { name: 'ID token' }).fill(token!);
    await page.getByRole('button', { name: 'Authenticate' }).click();
  }
  await expect(page.getByText('kwok-worker', { exact: true })).toBeVisible();
  await page.goto('/settings/plugins/%40headlamp-k8s%2Fai-assistant');
  await page.getByRole('button', { name: 'AI Assistant', exact: true }).click();
  await page.getByLabel('Assistant mode').click();
  await page.getByRole('option', { name: 'Chat', exact: true }).click();

  const prompt = page.locator('#deployment-ai-prompt');
  await expect(prompt).toBeEnabled();
  await prompt.fill('Fix the workload identity annotation on the demo service account.');
  await prompt.press('Enter');
  const openEditor = page.getByRole('button', { name: 'Open In Editor', exact: true });
  await expect(openEditor).toBeVisible();
  await openEditor.click();

  const editor = page.getByRole('dialog');
  await expect(
    editor.getByRole('heading', { name: 'Apply ServiceAccount', level: 6 })
  ).toBeVisible();
  await expect(page).toHaveURL(/\/settings\/plugins\//);

  const applied = page.waitForResponse(
    response =>
      response.url().endsWith('/clusters/main/api/v1/namespaces/demo/serviceaccounts/default') &&
      response.request().method() === 'PUT',
    { timeout: 15_000 }
  );
  await editor.getByRole('button', { name: 'Apply to Cluster' }).click();
  expect((await applied).ok()).toBeTruthy();
  await expect(editor).toBeHidden();

  // Read the actual resource back through Headlamp, rather than mocking the apply request.
  await expect
    .poll(async () => {
      const response = await page.request.get(
        '/clusters/main/api/v1/namespaces/demo/serviceaccounts/default',
        {
          headers: process.env.HEADLAMP_TOKEN
            ? { Authorization: `Bearer ${process.env.HEADLAMP_TOKEN}` }
            : {},
        }
      );
      expect(response.ok()).toBeTruthy();
      const resource = await response.json();
      return resource.metadata.annotations?.['azure.workload.identity/client-id'];
    })
    .toBe(clientId);

  await expect(
    page.getByText('ServiceAccount applied successfully.', { exact: true })
  ).toBeInViewport({ ratio: 1 });
  await expect(
    page.getByText('Applying ServiceAccount to cluster main...', { exact: true })
  ).toBeHidden();
  fs.mkdirSync(screenshotsDir, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotsDir, '11-serviceaccount-applied.png'),
    fullPage: true,
  });
});

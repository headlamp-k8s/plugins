import { expect, type Page, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const screenshotsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');

test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 15_000 });

async function configureProvider(page: Page, enabledTools: string[]) {
  await page.addInitScript(tools => {
    localStorage.setItem(
      'pluginConfigs',
      JSON.stringify({
        '@headlamp-k8s/ai-assistant': {
          previewEnabled: true,
          proactiveDiagnosisEnabled: false,
          configPopoverShown: true,
          enabledTools: tools,
          providers: [
            {
              providerId: 'vllm',
              config: { baseUrl: `${location.origin}/e2e-model`, model: 'editor-regression' },
            },
          ],
        },
      })
    );
  }, enabledTools);
}

function manifestSuggestion(clientId: string): string {
  return `Review this ServiceAccount manifest:

\`\`\`yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
  namespace: demo
  annotations:
    azure.workload.identity/client-id: ${clientId}
\`\`\``;
}

async function openChat(page: Page, startPath: string) {
  await page.goto(startPath);
  const tokenLogin = page.getByRole('button', { name: 'Use A Token' });
  if (await tokenLogin.isVisible()) {
    const token = process.env.HEADLAMP_TOKEN;
    expect(token, 'HEADLAMP_TOKEN is required for authentication').toBeTruthy();
    await tokenLogin.click();
    await page.getByRole('textbox', { name: 'ID token' }).fill(token!);
    await page.getByRole('button', { name: 'Authenticate' }).click();
  }
  await page.getByRole('button', { name: 'AI Assistant', exact: true }).click();
  await page.getByLabel('Assistant mode').click();
  await page.getByRole('option', { name: 'Chat', exact: true }).click();
  await expect(page.locator('#deployment-ai-prompt')).toBeEnabled();
}

async function readAnnotation(page: Page, cluster: string): Promise<string | undefined> {
  const token =
    cluster === 'secondary' ? process.env.HEADLAMP_SECONDARY_TOKEN : process.env.HEADLAMP_TOKEN;
  const response = await page.request.get(
    `/clusters/${cluster}/api/v1/namespaces/demo/serviceaccounts/default`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  expect(response.ok()).toBe(true);
  const resource = await response.json();
  return resource.metadata.annotations?.['azure.workload.identity/client-id'];
}

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

  await configureProvider(page, []);
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
  await expect(editor.getByRole('alert')).toHaveText('Target cluster: main');
  await expect(editor.getByRole('button', { name: 'Apply to main', exact: true })).toBeEnabled();
  await expect(editor.locator('.monaco-editor')).toBeVisible();
  fs.mkdirSync(screenshotsDir, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotsDir, '12-serviceaccount-target-cluster.png'),
    animations: 'disabled',
  });

  const applied = page.waitForResponse(
    response =>
      response.url().endsWith('/clusters/main/api/v1/namespaces/demo/serviceaccounts/default') &&
      response.request().method() === 'PUT',
    { timeout: 15_000 }
  );
  await editor.getByRole('button', { name: 'Apply to main', exact: true }).click();
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
  await page.screenshot({
    path: path.join(screenshotsDir, '11-serviceaccount-applied.png'),
    fullPage: true,
  });
});

const globalSettings = '/settings/plugins/%40headlamp-k8s%2Fai-assistant';
const targetScenarios: Array<{
  name: string;
  path: string;
  toolClusters: string[];
  target: string;
  choose: boolean;
  logError?: string;
}> = [
  {
    name: 'uses the chat request target on a fresh global page with multiple configured clusters',
    path: globalSettings,
    toolClusters: ['secondary'],
    target: 'secondary',
    choose: false,
  },
  {
    name: 'uses the chat request target instead of a different page cluster',
    path: '/c/main/nodes',
    toolClusters: ['secondary'],
    target: 'secondary',
    choose: false,
  },
  {
    name: 'requires an explicit target when the chat queried multiple clusters',
    path: '/c/main/nodes',
    toolClusters: ['main', 'secondary'],
    target: 'secondary',
    choose: true,
  },
  {
    name: 'requires a target on a fresh global page without request provenance',
    path: globalSettings,
    toolClusters: [],
    target: 'main',
    choose: true,
  },
  {
    name: 'does not guess the page cluster without request provenance when several are configured',
    path: '/c/main/nodes',
    toolClusters: [],
    target: 'secondary',
    choose: true,
  },
  {
    name: 'requires a choice after a successful read and a parsed multi-container log error on another cluster',
    path: '/c/main/nodes',
    toolClusters: ['main', 'secondary'],
    target: 'secondary',
    choose: true,
    logError:
      'a container name must be specified for pod checkout-crashloop, choose one of: [app sidecar]',
  },
  {
    name: 'requires a choice after a successful read and an unparsed log error on another cluster',
    path: '/c/main/nodes',
    toolClusters: ['main', 'secondary'],
    target: 'secondary',
    choose: true,
    logError: 'Bad Request',
  },
];

for (const [index, scenario] of targetScenarios.entries()) {
  test(scenario.name, async ({ page }) => {
    const clientId = `22222222-2222-2222-2222-22222222222${index}`;
    let analysisInput = '';
    await configureProvider(
      page,
      scenario.toolClusters.length > 0 ? ['kubernetes_api_request'] : []
    );
    if (scenario.logError) {
      await page.route(
        '**/clusters/secondary/api/v1/namespaces/demo/pods/checkout-crashloop/log*',
        route =>
          route.fulfill({
            status: 400,
            json: {
              kind: 'Status',
              apiVersion: 'v1',
              status: 'Failure',
              code: 400,
              reason: 'Bad Request',
              message: scenario.logError,
            },
          })
      );
    }
    await page.route('**/e2e-model/v1/chat/completions', async route => {
      const request: { tools?: unknown[]; messages: Array<{ content: unknown }> } = route
        .request()
        .postDataJSON();
      const completed = scenario.toolClusters.length === 0 || !request.tools?.length;
      if (completed) {
        analysisInput = request.messages
          .map(message => (typeof message.content === 'string' ? message.content : ''))
          .join('\n');
      }
      await route.fulfill({
        json: {
          id: 'editor-target-provenance',
          object: 'chat.completion',
          choices: [
            {
              index: 0,
              message: completed
                ? { role: 'assistant', content: manifestSuggestion(clientId) }
                : {
                    role: 'assistant',
                    content: '',
                    tool_calls: scenario.toolClusters.map(cluster => ({
                      id: `inspect-${cluster}`,
                      type: 'function',
                      function: {
                        name: 'kubernetes_api_request',
                        arguments: JSON.stringify({
                          url:
                            scenario.logError && cluster === 'secondary'
                              ? '/api/v1/namespaces/demo/pods/checkout-crashloop/log'
                              : '/api/v1/namespaces/demo/serviceaccounts/default',
                          method: 'GET',
                          cluster,
                        }),
                      },
                    })),
                  },
              finish_reason: completed ? 'stop' : 'tool_calls',
            },
          ],
        },
      });
    });
    const otherCluster = scenario.target === 'main' ? 'secondary' : 'main';
    const otherBefore = await readAnnotation(page, otherCluster);
    const writes: string[] = [];
    const reads: string[] = [];
    page.on('request', request => {
      if (
        request.method() === 'GET' &&
        (request.url().includes('/api/v1/namespaces/demo/serviceaccounts') ||
          request.url().includes('/api/v1/namespaces/demo/pods/checkout-crashloop/log'))
      ) {
        reads.push(new URL(request.url()).pathname);
      }
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()) &&
        request.url().includes('/api/v1/namespaces/demo/serviceaccounts')
      ) {
        writes.push(new URL(request.url()).pathname);
      }
    });
    await openChat(page, scenario.path);
    const prompt = page.locator('#deployment-ai-prompt');
    await prompt.fill('Review the ServiceAccount in main and secondary and suggest YAML.');
    await prompt.press('Enter');
    await page.getByRole('button', { name: 'Open In Editor', exact: true }).click();
    const editor = page.getByRole('dialog');
    await expect(
      editor.getByRole('heading', { name: 'Apply ServiceAccount', level: 6 })
    ).toBeVisible();
    if (scenario.logError) {
      expect(analysisInput).toContain(
        scenario.logError.includes('choose one of')
          ? 'Available containers: app, sidecar'
          : 'Would you like me to check the pod details'
      );
    }
    for (const cluster of scenario.toolClusters) {
      expect(reads.some(url => url.startsWith(`/clusters/${cluster}/`))).toBe(true);
    }
    fs.mkdirSync(screenshotsDir, { recursive: true });
    if (scenario.choose) {
      await expect(editor.getByRole('alert')).toHaveText('No cluster selected');
      await expect(
        editor.getByRole('button', { name: 'Apply to Cluster', exact: true })
      ).toBeDisabled();
      expect(writes).toEqual([]);
      await page.screenshot({
        path: path.join(screenshotsDir, `13-editor-choice-${index}.png`),
        animations: 'disabled',
      });
      await editor.getByRole('combobox', { name: 'Target cluster', exact: true }).click();
      await page.getByRole('option', { name: scenario.target, exact: true }).click();
    }
    await expect(editor.getByRole('alert')).toHaveText(`Target cluster: ${scenario.target}`);
    await expect(editor.getByRole('combobox', { name: 'Target cluster' })).toContainText(
      scenario.target
    );
    await page.screenshot({
      path: path.join(screenshotsDir, `14-editor-confirm-${index}.png`),
      animations: 'disabled',
    });
    const applied = page.waitForResponse(
      response =>
        response
          .url()
          .endsWith(
            `/clusters/${scenario.target}/api/v1/namespaces/demo/serviceaccounts/default`
          ) && response.request().method() === 'PUT'
    );
    await editor.getByRole('button', { name: `Apply to ${scenario.target}`, exact: true }).click();
    expect((await applied).ok()).toBe(true);
    await expect(editor).toBeHidden();
    expect(writes.length).toBeGreaterThan(0);
    expect(writes.every(url => url.startsWith(`/clusters/${scenario.target}/`))).toBe(true);
    await expect.poll(() => readAnnotation(page, scenario.target)).toBe(clientId);
    expect(await readAnnotation(page, otherCluster)).toBe(otherBefore);
  });
}

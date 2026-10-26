import { expect, type Page, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const screenshotsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');
test.use({ actionTimeout: 15_000 });
const cardName = /^(Pod|Deployment|Node)\//;
const longAnswer = `The application probe configuration needs review. Inspect the resource before changing it.

## Recommended checks

${Array.from(
  { length: 28 },
  (_, index) =>
    `${
      index + 1
    }. Compare the configured port, probe timing, environment variables, mounted configuration, and recent events. Review the evidence before applying a proposed change.`
).join('\n\n')}

## Suggested manifest for review

\`\`\`yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
  namespace: demo
\`\`\`

End of fixture analysis. Analysis completion does not verify resource health.`;

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

async function configure(
  page: Page,
  {
    additionalProvider = false,
    proactiveDiagnosisEnabled = true,
  }: { additionalProvider?: boolean; proactiveDiagnosisEnabled?: boolean } = {}
) {
  await page.addInitScript(
    ({ additionalProvider, proactiveDiagnosisEnabled }) => {
      localStorage.setItem('headlampThemePreference', 'light');
      localStorage.setItem(
        'pluginConfigs',
        JSON.stringify({
          '@headlamp-k8s/ai-assistant': {
            previewEnabled: true,
            proactiveDiagnosisEnabled,
            configPopoverShown: true,
            enabledTools: [],
            providers: [
              {
                providerId: 'vllm',
                config: { baseUrl: `${location.origin}/ux-model`, model: 'ux-regression' },
              },
              ...(additionalProvider
                ? [
                    {
                      providerId: 'vllm',
                      displayName: 'Second provider',
                      config: {
                        baseUrl: `${location.origin}/ux-model-second`,
                        model: 'second-model',
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      );
    },
    { additionalProvider, proactiveDiagnosisEnabled }
  );
}

async function openAssistant(page: Page, startPath = '/c/main/nodes') {
  await page.goto(startPath);
  const login = page.getByRole('button', { name: 'Use A Token' });
  if (await login.isVisible()) {
    const token = process.env.HEADLAMP_TOKEN;
    expect(token, 'HEADLAMP_TOKEN is required when authentication is enabled').toBeTruthy();
    await login.click();
    await page.getByRole('textbox', { name: 'ID token' }).fill(token!);
    await page.getByRole('button', { name: 'Authenticate' }).click();
  }
  if (startPath === '/c/main/nodes') {
    await expect(page.getByText('kwok-worker', { exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'AI Assistant', exact: true }).click();
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
]) {
  test.describe(`Proactive diagnosis at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, reducedMotion: 'reduce' });

    test('keeps long results, recovery actions, and the conversation reachable', async ({
      page,
    }) => {
      await configure(page);
      let failedInventory = false;
      await page.route('**/ux-model/v1/chat/completions', async route => {
        const request: { messages: Array<{ content: string }> } = route.request().postDataJSON();
        const prompt = request.messages.map(message => message.content).join('\n');
        if (prompt.includes('ux-inventory-warning') && !failedInventory) {
          failedInventory = true;
          await route.fulfill({
            status: 400,
            json: {
              error: {
                message: 'Fixture analysis unavailable. Retry this item.',
                type: 'invalid_request_error',
              },
            },
          });
          return;
        }
        await route.fulfill({
          json: {
            id: 'ux-fixture',
            object: 'chat.completion',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: longAnswer },
                finish_reason: 'stop',
              },
            ],
          },
        });
      });
      await openAssistant(page);
      const section = page.getByRole('region', { name: 'AI diagnoses', exact: true });
      const log = page.getByRole('log', { name: 'Conversation messages' });
      await expect(section.getByText('3/3 processed', { exact: true })).toBeVisible();
      await expect(section.getByText('2 ready, 1 failed', { exact: true })).toBeVisible();
      await expect(section.getByText('Clusters: main', { exact: true })).toBeVisible();
      await expect(page.locator('#deployment-ai-prompt')).toBeEnabled();
      expect(await log.evaluate(el => el.clientHeight)).toBeGreaterThan(100);
      expect(await log.evaluate(el => Boolean(el.querySelector('section')))).toBe(true);

      const cards = section.getByRole('button', { name: cardName });
      await expect(cards).toHaveCount(3);
      const order = await cards.evaluateAll(elements =>
        elements.map(el => el.getAttribute('aria-controls'))
      );
      for (const card of await cards.all()) {
        await expect(card).toHaveAttribute('aria-expanded', 'false');
      }
      const toolbarGlyph = await page
        .getByRole('button', { name: 'AI Assistant', exact: true })
        .locator('svg path')
        .first()
        .getAttribute('d');
      expect(await section.locator('svg path').first().getAttribute('d')).toBe(toolbarGlyph);
      fs.mkdirSync(screenshotsDir, { recursive: true });
      await page.screenshot({
        path: path.join(screenshotsDir, `13-diagnoses-overview-${viewport.width}.png`),
        animations: 'disabled',
      });

      const backgroundScroll = await page.evaluate(() => window.scrollY);
      await cards.first().click();
      await expect(log.getByText('End of fixture analysis.', { exact: false })).toBeAttached();
      expect(await log.evaluate(el => el.scrollHeight)).toBeGreaterThan(
        await log.evaluate(el => el.clientHeight)
      );
      const box = await log.boundingBox();
      expect(box).toBeTruthy();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      for (let index = 0; index < 8; index++) await page.mouse.wheel(0, 1200);
      await expect(cards.last()).toBeInViewport();
      expect(await log.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(backgroundScroll);
      await page.screenshot({
        path: path.join(
          screenshotsDir,
          `16-diagnoses-conversation-reachable-${viewport.width}.png`
        ),
        animations: 'disabled',
      });
      await log.focus();
      await page.keyboard.press('Home');
      await expect.poll(() => log.evaluate(el => el.scrollTop)).toBe(0);
      await page.keyboard.press('End');
      await expect(cards.last()).toBeInViewport();

      const failed = section.getByRole('button', { name: /^Pod\/inventory-pending/ }).locator('..');
      await failed.getByRole('button', { name: 'Retry analysis', exact: true }).click();
      await expect(section.getByText('3 ready, 0 failed', { exact: true })).toBeVisible();
      expect(
        await cards.evaluateAll(elements => elements.map(el => el.getAttribute('aria-controls')))
      ).toEqual(order);
      await failed.getByRole('button', { name: 'Dismiss', exact: true }).click();
      await expect(cards).toHaveCount(2);
      await expect(section.getByText('2/2 processed', { exact: true })).toBeVisible();

      await cards
        .first()
        .getAttribute('aria-expanded')
        .then(async expanded => {
          if (expanded !== 'true') await cards.first().click();
        });
      const reviewYaml = section.getByRole('button', { name: 'Open In Editor', exact: true });
      await reviewYaml.click();
      const editor = page.getByRole('dialog');
      await expect(editor.getByRole('alert')).toHaveText('Target cluster: main');
      await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(editor).toBeHidden();
      await expect(reviewYaml).toBeFocused();
      await section.getByRole('button', { name: 'Dismiss', exact: true }).first().click();
      await section.getByRole('button', { name: 'Dismiss', exact: true }).click();
      await expect(cards).toHaveCount(0);
      await expect(
        section.locator('p').filter({ hasText: /^No diagnoses to display\.$/ })
      ).toBeVisible();
      await expect(
        section.getByText('No warning events found in this scope.', { exact: true })
      ).toHaveCount(0);

      await page.goto('/c/main');
      const row = page
        .getByRole('row')
        .filter({ hasText: 'Web replicas are waiting for scheduling.' });
      await row.getByRole('button', { name: 'Diagnose with AI', exact: true }).click();
      const target = page
        .getByRole('region', { name: 'AI diagnoses' })
        .getByRole('button', { name: /^Deployment\/web/ });
      await expect(target).toHaveAttribute('aria-expanded', 'true');
      await expect(target).toBeInViewport();
      await expect(target).toBeFocused();
      await page.screenshot({
        path: path.join(screenshotsDir, `14-diagnosis-navigation-${viewport.width}.png`),
        animations: 'disabled',
      });
    });
  });
}

test('keeps event-read permission failures visible, including retries during backoff', async ({
  page,
}) => {
  await configure(page);
  let eventRequests = 0;
  await page.route('**/clusters/main/api/v1/events?*', route => {
    eventRequests++;
    return route.fulfill({
      status: 403,
      json: {
        kind: 'Status',
        apiVersion: 'v1',
        status: 'Failure',
        code: 403,
        reason: 'Forbidden',
        message: 'events is forbidden: cannot list events',
      },
    });
  });
  await openAssistant(page);
  const section = page.getByRole('region', { name: 'AI diagnoses' });
  await expect(section.getByRole('alert')).toContainText(/forbidden/i);
  await expect(section.getByRole('alert')).toContainText('main');
  await expect(section.getByRole('status')).toContainText('Event check failed:');
  await expect(
    section.getByText('No warning events found in this scope.', { exact: true })
  ).toHaveCount(0);
  await section.getByRole('button', { name: 'Check again', exact: true }).click();
  await expect(section.getByRole('alert')).toContainText(/forbidden/i);
  expect(eventRequests).toBe(1);
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`reveals the header of a cached expanded long diagnosis (${reducedMotion})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion });
    await configure(page);
    let modelCalls = 0;
    await page.route('**/ux-model/v1/chat/completions', route => {
      modelCalls++;
      return route.fulfill({
        json: {
          id: 'cached-navigation',
          object: 'chat.completion',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: longAnswer },
              finish_reason: 'stop',
            },
          ],
        },
      });
    });
    await openAssistant(page, '/c/main');
    const section = page.getByRole('region', { name: 'AI diagnoses' });
    const log = page.getByRole('log', { name: 'Conversation messages' });
    await expect(section.getByText('3/3 processed', { exact: true })).toBeVisible();
    const target = section.getByRole('button', { name: /^Pod\/checkout-crashloop/ });
    await target.click();
    await expect
      .poll(() => target.locator('..').evaluate(el => el.getBoundingClientRect().height))
      .toBeGreaterThan(1500);
    const box = await log.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 800);
    await expect.poll(() => log.evaluate(el => el.scrollTop)).toBeGreaterThan(500);
    await expect(target).not.toBeInViewport();
    const row = page.getByRole('row').filter({
      hasText: 'Checkout is restarting; inspect the probe configuration.',
    });
    await row.getByRole('button', { name: 'Diagnose with AI', exact: true }).click();
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport({ ratio: 1 });
    await expect(target).toHaveAttribute('aria-expanded', 'true');
    expect(modelCalls).toBe(3);
  });
}

test('lets users draft, cancel a queued message, and send before remaining background work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await configure(page);
  const firstStarted = deferred();
  const releaseFirst = deferred();
  const requests: string[] = [];
  let active = 0;
  let maxActive = 0;
  await page.route('**/ux-model/v1/chat/completions', async route => {
    const request: { messages: Array<{ content: string }> } = route.request().postDataJSON();
    const diagnosis = request.messages.some(message =>
      message.content.includes('## Event Details')
    );
    requests.push(diagnosis ? 'diagnosis' : 'chat');
    active++;
    maxActive = Math.max(maxActive, active);
    if (requests.length === 1) {
      firstStarted.resolve();
      await releaseFirst.promise;
    }
    await route.fulfill({
      json: {
        id: 'queue-fixture',
        object: 'chat.completion',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: diagnosis
                ? longAnswer
                : 'Your chat request ran before the remaining background analyses.',
            },
            finish_reason: 'stop',
          },
        ],
      },
    });

    active--;
  });
  try {
    await openAssistant(page);
    await firstStarted.promise;
    const input = page.locator('#deployment-ai-prompt');
    await expect(input).toBeEnabled();
    await input.fill('Explain Kubernetes pods.');
    await input.press('Enter');
    await page.getByRole('button', { name: 'Cancel queued message', exact: true }).click();
    await expect(input).toHaveValue('Explain Kubernetes pods.');
    await expect(input).toBeFocused();
    expect(requests).toEqual(['diagnosis']);
    await input.press('Enter');
    await expect(
      page.getByText('Message queued. Sending after the current analysis finishes.', {
        exact: true,
      })
    ).toBeVisible();
    fs.mkdirSync(screenshotsDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotsDir, '15-draft-and-queued-message.png'),
      animations: 'disabled',
    });
    releaseFirst.resolve();
    await expect(
      page.getByText('Your chat request ran before the remaining background analyses.', {
        exact: true,
      })
    ).toBeVisible();
    expect(requests).toEqual(['diagnosis', 'chat']);
    const section = page.getByRole('region', { name: 'AI diagnoses' });
    await section.getByRole('button', { name: 'Resume background analysis', exact: true }).click();
    await expect(section.getByText('3/3 processed', { exact: true })).toBeVisible();
    await expect(section.getByText('3 ready, 0 failed', { exact: true })).toBeVisible();
    expect(requests).toEqual(['diagnosis', 'chat', 'diagnosis', 'diagnosis']);
    expect(maxActive).toBe(1);
  } finally {
    releaseFirst.resolve();
  }
});

test('does not start diagnosis if chat starts during an event read', async ({ page }) => {
  await configure(page);
  const eventsStarted = deferred();
  const releaseEvents = deferred();
  const chatStarted = deferred();
  const releaseChat = deferred();
  const requests: string[] = [];
  let active = 0;
  let maxActive = 0;
  await page.route('**/ux-model/v1/chat/completions', async route => {
    const request: { messages: Array<{ content: string }> } = route.request().postDataJSON();
    const diagnosis = request.messages.some(message =>
      message.content.includes('## Event Details')
    );
    requests.push(diagnosis ? 'diagnosis' : 'chat');
    active++;
    maxActive = Math.max(maxActive, active);
    if (!diagnosis) {
      chatStarted.resolve();
      await releaseChat.promise;
    }
    await route.fulfill({
      json: {
        id: 'event-read-chat-priority',
        object: 'chat.completion',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: diagnosis
                ? 'Analysis complete.'
                : 'Chat completed without overlapping background analysis.',
            },
            finish_reason: 'stop',
          },
        ],
      },
    });
    active--;
  });

  try {
    await openAssistant(page);
    const section = page.getByRole('region', { name: 'AI diagnoses' });
    await expect(section.getByText('3 ready, 0 failed', { exact: true })).toBeVisible();
    const lastChecked = section.getByText(/^Last event check:/);
    const previousCheck = await lastChecked.textContent();
    expect(previousCheck).toBeTruthy();
    await page.route('**/clusters/main/api/v1/events?*', async route => {
      const response = await route.fetch();
      eventsStarted.resolve();
      await releaseEvents.promise;
      await route.fulfill({ response });
    });
    // Expire the event cache without waiting 30 seconds in real time.
    await page.clock.setFixedTime(new Date(Date.now() + 31_000));
    await section.getByRole('button', { name: 'Check again', exact: true }).click();
    await eventsStarted.promise;

    const input = page.locator('#deployment-ai-prompt');
    await input.fill('Explain this workload while the event check finishes.');
    await input.press('Enter');
    await chatStarted.promise;
    expect(requests).toEqual(['diagnosis', 'diagnosis', 'diagnosis', 'chat']);

    releaseEvents.resolve();
    await expect(lastChecked).not.toHaveText(previousCheck!);
    await expect(section.getByText('3 ready, 0 failed', { exact: true })).toBeVisible();
    expect(requests).toEqual(['diagnosis', 'diagnosis', 'diagnosis', 'chat']);
    expect(maxActive).toBe(1);

    releaseChat.resolve();
    await expect(
      page.getByText('Chat completed without overlapping background analysis.', { exact: true })
    ).toBeVisible();
    await section.getByRole('button', { name: 'Check again', exact: true }).click();
    await expect
      .poll(() => requests)
      .toEqual([
        'diagnosis',
        'diagnosis',
        'diagnosis',
        'chat',
        'diagnosis',
        'diagnosis',
        'diagnosis',
      ]);
    await expect(section.getByText('3 ready, 0 failed', { exact: true })).toBeVisible();
    expect(maxActive).toBe(1);
  } finally {
    releaseEvents.resolve();
    releaseChat.resolve();
  }
});

test('shows initial and response suggestions as reviewable drafts while idle', async ({ page }) => {
  await configure(page, { proactiveDiagnosisEnabled: false });
  let calls = 0;
  await page.route('**/ux-model/v1/chat/completions', route => {
    calls++;
    return route.fulfill({
      json: {
        id: 'suggestions',
        object: 'chat.completion',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content:
                'Review the application events.\n\nSUGGESTIONS: Inspect application logs | Explain readiness checks',
            },
            finish_reason: 'stop',
          },
        ],
      },
    });
  });
  await openAssistant(page);
  const panel = page.getByRole('complementary', { name: 'AI Assistant panel' });
  await expect(
    panel.getByRole('button', {
      name: /^(What pods need my attention|What in this list needs my attention)\?$/,
    })
  ).toBeVisible();
  const input = page.locator('#deployment-ai-prompt');
  await input.fill('Help me inspect this workload.');
  await input.press('Enter');
  await expect(page.getByText('Review the application events.', { exact: true })).toBeVisible();
  const followUp = panel.getByRole('button', { name: 'Inspect application logs', exact: true });
  await expect(followUp).toBeVisible();
  await followUp.click();
  await expect(input).toHaveValue('Inspect application logs');
  expect(calls).toBe(1);
});

test('restores a queued message for review when its provider or model changes', async ({
  page,
}) => {
  await configure(page, { additionalProvider: true });
  const started = deferred();
  const release = deferred();
  const requests: Array<{ provider: string; diagnosis: boolean }> = [];
  await page.route('**/ux-model*/v1/chat/completions', async route => {
    const request: { messages: Array<{ content: string }> } = route.request().postDataJSON();
    const diagnosis = request.messages.some(message =>
      message.content.includes('## Event Details')
    );
    const provider = route.request().url().includes('/ux-model-second/') ? 'second' : 'first';
    requests.push({ provider, diagnosis });
    if (requests.length === 1) {
      started.resolve();
      await release.promise;
    }
    await route.fulfill({
      json: {
        id: 'configuration',
        object: 'chat.completion',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: diagnosis
                ? 'Analysis complete.'
                : 'Second provider received your reviewed message.',
            },
            finish_reason: 'stop',
          },
        ],
      },
    });
  });
  try {
    await openAssistant(page);
    await started.promise;
    const input = page.locator('#deployment-ai-prompt');
    await input.fill('Explain this workload.');
    await input.press('Enter');
    await expect(page.getByRole('button', { name: 'Cancel queued message' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Provider and model' }).click();
    await page.getByRole('option', { name: 'second-model', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Provider and model' })).toContainText(
      'second-model'
    );
    release.resolve();
    await expect(
      page.getByRole('alert').filter({
        hasText: 'Assistant configuration changed. Review and resend your message.',
      })
    ).toBeVisible();
    await expect(input).toHaveValue('Explain this workload.');
    expect(requests).toEqual([{ provider: 'first', diagnosis: true }]);
    await input.press('Enter');
    await expect(
      page.getByText('Second provider received your reviewed message.', { exact: true })
    ).toBeVisible();
    expect(requests).toEqual([
      { provider: 'first', diagnosis: true },
      { provider: 'second', diagnosis: false },
    ]);
  } finally {
    release.resolve();
  }
});

test('sends chat before an already-queued batch of manual retries', async ({ page }) => {
  await configure(page);
  const retryStarted = deferred();
  const releaseRetry = deferred();
  const requests: string[] = [];
  let diagnoses = 0;
  await page.route('**/ux-model/v1/chat/completions', async route => {
    const request: { messages: Array<{ content: string }> } = route.request().postDataJSON();
    const diagnosis = request.messages.some(message =>
      message.content.includes('## Event Details')
    );
    requests.push(diagnosis ? 'diagnosis' : 'chat');
    if (diagnosis && ++diagnoses <= 3) {
      await route.fulfill({
        status: 400,
        json: {
          error: {
            message: 'Fixture analysis failed. Retry this item.',
            type: 'invalid_request_error',
          },
        },
      });
      return;
    }
    if (diagnosis && diagnoses === 4) {
      retryStarted.resolve();
      await releaseRetry.promise;
    }
    await route.fulfill({
      json: {
        id: 'retry-priority',
        object: 'chat.completion',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: diagnosis
                ? 'Retry analysis complete.'
                : 'Chat ran before the queued retry batch.',
            },
            finish_reason: 'stop',
          },
        ],
      },
    });
  });
  try {
    await openAssistant(page);
    const section = page.getByRole('region', { name: 'AI diagnoses' });
    await expect(section.getByText('0 ready, 3 failed', { exact: true })).toBeVisible();
    await section.getByRole('button', { name: 'Retry failed analyses', exact: true }).click();
    await retryStarted.promise;
    const input = page.locator('#deployment-ai-prompt');
    await input.fill('Pause retries and answer this question.');
    await input.press('Enter');
    await expect(page.getByRole('button', { name: 'Cancel queued message' })).toBeVisible();
    releaseRetry.resolve();
    await expect(
      page.getByText('Chat ran before the queued retry batch.', { exact: true })
    ).toBeVisible();
    expect(requests).toEqual(['diagnosis', 'diagnosis', 'diagnosis', 'diagnosis', 'chat']);
    await section.getByRole('button', { name: 'Resume background analysis', exact: true }).click();
    await expect(section.getByText('3 ready, 0 failed', { exact: true })).toBeVisible();
    expect(requests).toEqual([
      'diagnosis',
      'diagnosis',
      'diagnosis',
      'diagnosis',
      'chat',
      'diagnosis',
      'diagnosis',
    ]);
  } finally {
    releaseRetry.resolve();
  }
});

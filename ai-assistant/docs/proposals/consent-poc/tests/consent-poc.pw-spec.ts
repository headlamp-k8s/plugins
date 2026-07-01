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

import { APIRequestContext, expect, test } from '@playwright/test';

async function requestConsent(
  req: APIRequestContext,
  command = 'minikube status'
): Promise<{ consentId: string }> {
  const res = await req.post('/api/request-consent', { data: { command } });
  expect(res.status()).toBe(200);
  return res.json();
}

async function getConsentPageAsNavigation(
  req: APIRequestContext,
  consentId: string
) {
  return req.get(`/consent/${consentId}`, {
    headers: {
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    },
  });
}

test.describe('consent-poc — HTTP security model', () => {
  test('main page loads without COOP (simulates plugin host)', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    // Main page must NOT set COOP — it simulates the untrusted host.
    expect(res.headers()['cross-origin-opener-policy']).toBeUndefined();
    expect(await res.text()).toContain('COOP Popup Consent');
  });

  test('request-consent returns a hex consentId', async ({ request }) => {
    const { consentId } = await requestConsent(request);
    expect(consentId).toMatch(/^[a-f0-9]{32}$/);
  });

  test('top-level navigation to consent page allowed + sets COOP', async ({ request }) => {
    const { consentId } = await requestConsent(request);
    const res = await getConsentPageAsNavigation(request, consentId);
    expect(res.status()).toBe(200);
    // KEY: COOP header severs opener relationship with untrusted parent.
    expect(res.headers()['cross-origin-opener-policy']).toBe('same-origin');
    const html = await res.text();
    expect(html).toContain('Approve Command');
    expect(html).toMatch(/name="nonce" value="[a-f0-9]{32}"/);
  });

  test('fetch() to consent page blocked (Sec-Fetch-Dest: empty)', async ({ request }) => {
    const { consentId } = await requestConsent(request);
    const res = await request.get(`/consent/${consentId}`, {
      headers: { 'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Mode': 'cors' },
    });
    expect(res.status()).toBe(403);
    const body = await res.text();
    expect(body).toContain('Only top-level navigation allowed');
    // Crucially, the nonce must NOT leak in the 403 body.
    expect(body).not.toMatch(/[a-f0-9]{32}/);
  });

  test('iframe to consent page blocked (Sec-Fetch-Dest: iframe)', async ({ request }) => {
    const { consentId } = await requestConsent(request);
    const res = await request.get(`/consent/${consentId}`, {
      headers: { 'Sec-Fetch-Dest': 'iframe', 'Sec-Fetch-Mode': 'navigate' },
    });
    expect(res.status()).toBe(403);
  });

  test('object embed blocked (Sec-Fetch-Dest: object)', async ({ request }) => {
    const { consentId } = await requestConsent(request);
    const res = await request.get(`/consent/${consentId}`, {
      headers: { 'Sec-Fetch-Dest': 'object', 'Sec-Fetch-Mode': 'no-cors' },
    });
    expect(res.status()).toBe(403);
  });

  test('approve with invalid nonce rejected', async ({ request }) => {
    const { consentId } = await requestConsent(request);
    const res = await request.post(`/consent/${consentId}/approve`, {
      form: { nonce: 'deadbeef' },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: 'invalid nonce', approved: false });

    // And the consent status is still not approved.
    const status = await request.get(`/api/consent-status/${consentId}`);
    expect(await status.json()).toEqual({ approved: false });
  });

  test('approve with correct nonce succeeds and status flips to approved', async ({
    request,
  }) => {
    const { consentId } = await requestConsent(request);
    const pageRes = await getConsentPageAsNavigation(request, consentId);
    const html = await pageRes.text();
    const nonce = html.match(/name="nonce" value="([a-f0-9]+)"/)![1];

    const approve = await request.post(`/consent/${consentId}/approve`, {
      form: { nonce },
    });
    expect(approve.status()).toBe(200);
    expect(approve.headers()['cross-origin-opener-policy']).toBe('same-origin');

    const status = await request.get(`/api/consent-status/${consentId}`);
    expect(await status.json()).toEqual({ approved: true });
  });

  test('nonce replay rejected (409) after first use', async ({ request }) => {
    const { consentId } = await requestConsent(request);
    const pageRes = await getConsentPageAsNavigation(request, consentId);
    const nonce = (await pageRes.text()).match(/name="nonce" value="([a-f0-9]+)"/)![1];

    const first = await request.post(`/consent/${consentId}/approve`, { form: { nonce } });
    expect(first.status()).toBe(200);

    const replay = await request.post(`/consent/${consentId}/approve`, { form: { nonce } });
    expect(replay.status()).toBe(409);
    const body = await replay.json();
    expect(body).toEqual({ error: 'already used', approved: false });
  });

  test('Service Worker registration blocked by server policy', async ({ request }) => {
    const res = await request.get('/sw.js', {
      headers: { 'Service-Worker': 'script' },
    });
    expect(res.status()).toBe(403);
    expect(await res.text()).toContain('Service Worker registration blocked');
  });

  test('Service Worker header blocks even the main page', async ({ request }) => {
    // The block is global — a malicious plugin cannot register a SW
    // scoped to any path on the origin.
    const res = await request.get('/', {
      headers: { 'Service-Worker': 'script' },
    });
    expect(res.status()).toBe(403);
  });

  test('status endpoint returns 404 for unknown consentId', async ({ request }) => {
    const res = await request.get('/api/consent-status/0000000000000000');
    expect(res.status()).toBe(404);
  });

  test('approve endpoint returns 404 for unknown consentId', async ({ request }) => {
    const res = await request.post('/consent/0000000000000000/approve', {
      form: { nonce: 'whatever' },
    });
    expect(res.status()).toBe(404);
  });
});

test.describe('consent-poc — browser flow', () => {
  test('legitimate flow: popup opens, user approves, status polls to approved', async ({
    page,
    context,
  }) => {
    await page.goto('/');

    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: /Open consent popup/i }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');

    await expect(popup).toHaveTitle('Approve Command');
    await expect(popup.getByText('minikube status')).toBeVisible();

    await popup.getByRole('button', { name: /Approve/i }).click();

    // Poller on main page should detect approval within 30s (checks every 1s).
    await expect(page.locator('#log')).toContainText(
      'Command approved by user',
      { timeout: 10_000 }
    );
    await expect(page.locator('#log')).not.toContainText('VULNERABILITY');
  });

  test('COOP severs opener: main page cannot read popup DOM or location', async ({ page, browserName }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Attack 5:/i }).click();

    // Cross-browser semantics differ for a COOP-severed opener:
    //   - Chromium: accessing popup.document / popup.location throws SecurityError.
    //   - Firefox:  returns a cross-origin WindowProxy; title === '', location.href === ''.
    //   - WebKit:   returns empty title and location.href === 'about:blank'.
    // In every case the browser prevents the real title ("Approve Command") and
    // the real URL (which contains the consentId) from leaking. The PoC's attack
    // code distinguishes "throw", "no real data", and "real data leaked"; we only
    // accept the first two and forbid anything resembling a real leak.
    await expect(page.locator('#log')).toContainText(
      /popup title access (blocked|yielded no real data)/,
      { timeout: 5000 }
    );
    await expect(page.locator('#log')).toContainText(
      /popup location access (blocked|yielded no real data)/,
      { timeout: 5000 }
    );
    const logText = await page.locator('#log').innerText();
    expect(logText, `browser=${browserName}`).not.toContain('VULNERABILITY');
  });

  test('attack 1 (fetch) blocked from the page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Attack 1:/i }).click();
    await expect(page.locator('#log')).toContainText('fetch() blocked by server', {
      timeout: 5000,
    });
    await expect(page.locator('#log')).not.toContainText('VULNERABILITY');
  });

  test('attack 2 (XHR) blocked from the page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Attack 2:/i }).click();
    await expect(page.locator('#log')).toContainText(/XHR blocked by server|XHR error/, {
      timeout: 5000,
    });
    await expect(page.locator('#log')).not.toContainText('VULNERABILITY');
  });

  test('attack 3 (iframe) blocked from the page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Attack 3:/i }).click();
    // Either the iframe fails to load (403) or its document is empty/inaccessible.
    await expect(page.locator('#log')).toContainText(
      /iframe load blocked|iframe .* blocked or empty|iframe DOM access blocked/,
      { timeout: 5000 }
    );
    await expect(page.locator('#log')).not.toContainText('VULNERABILITY');
  });

  test('attack 4 (wrong nonce) rejected from the page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Attack 4:/i }).click();
    await expect(page.locator('#log')).toContainText('approve rejected: invalid nonce', {
      timeout: 5000,
    });
    await expect(page.locator('#log')).not.toContainText('VULNERABILITY');
  });
});

/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

// Adversarial / negative-control tests for the consent-poc.
//
// Rationale: the positive tests in consent-poc.spec.ts could theoretically
// pass for the wrong reason (e.g. a 403 that comes from an unrelated bug,
// or a `null` we always see regardless of COOP). These tests attack the
// same vectors from different angles AND pair each protection with a
// negative control against a deliberately-vulnerable twin server
// (vulnerable-server.cjs on :4467) where the SAME attack MUST succeed.
//
// If the tests here pass against the main server AND the paired attack
// succeeds against the twin, we know:
//   (a) the protection is actually doing the blocking (not a test bug); and
//   (b) the tests would catch a real regression that removed the protection.

import net from 'net';
import { expect, request as pwRequest, test } from '@playwright/test';

const MAIN_URL = 'http://localhost:4466';
const VULN_URL = 'http://localhost:4467';

// ─── Raw TCP request so we can see the exact bytes on the wire ─────────
function rawHttp(host: string, port: number, request: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host, port }, () => sock.write(request));
    const chunks: Buffer[] = [];
    sock.on('data', c => chunks.push(c));
    sock.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    sock.on('error', reject);
    // Safety timeout.
    setTimeout(() => {
      sock.destroy();
      resolve(Buffer.concat(chunks).toString('utf8'));
    }, 3000);
  });
}

async function newConsent(base: string): Promise<string> {
  const req = await pwRequest.newContext({ baseURL: base });
  try {
    const res = await req.post('/api/request-consent', {
      data: { command: 'minikube status' },
    });
    expect(res.status()).toBe(200);
    const { consentId } = await res.json();
    return consentId;
  } finally {
    await req.dispose();
  }
}

// ─── NEGATIVE CONTROL: the twin must actually be vulnerable ────────────
test.describe('negative control — vulnerable twin really is vulnerable', () => {
  test('twin serves /consent with NO COOP header', async () => {
    const consentId = await newConsent(VULN_URL);
    const req = await pwRequest.newContext({ baseURL: VULN_URL });
    const res = await req.get(`/consent/${consentId}`);
    expect(res.status()).toBe(200);
    expect(res.headers()['cross-origin-opener-policy']).toBeUndefined();
    await req.dispose();
  });

  test('twin leaks nonce to fetch() (Sec-Fetch-Dest: empty)', async () => {
    const consentId = await newConsent(VULN_URL);
    const req = await pwRequest.newContext({ baseURL: VULN_URL });
    const res = await req.get(`/consent/${consentId}`, {
      headers: { 'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Mode': 'cors' },
    });
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/name="nonce" value="[a-f0-9]{32}"/);
    await req.dispose();
  });

  test('twin serves /sw.js even with Service-Worker: script header', async () => {
    const req = await pwRequest.newContext({ baseURL: VULN_URL });
    const res = await req.get('/sw.js', { headers: { 'Service-Worker': 'script' } });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('javascript');
    await req.dispose();
  });
});

// ─── Raw-socket header verification ────────────────────────────────────
test.describe('raw-socket header verification', () => {
  test('protected /consent response literally contains "Cross-Origin-Opener-Policy: same-origin"', async () => {
    const consentId = await newConsent(MAIN_URL);
    const raw = await rawHttp(
      'localhost',
      4466,
      `GET /consent/${consentId} HTTP/1.1\r\nHost: localhost:4466\r\nSec-Fetch-Dest: document\r\nSec-Fetch-Mode: navigate\r\nConnection: close\r\n\r\n`
    );
    const [headerBlock] = raw.split('\r\n\r\n', 1);
    expect(headerBlock).toMatch(/^HTTP\/1\.1 200 /);
    // Case-insensitive search; Node may emit headers in various cases.
    expect(headerBlock.toLowerCase()).toContain(
      'cross-origin-opener-policy: same-origin'
    );
  });

  test('twin /consent response has NO Cross-Origin-Opener-Policy header on the wire', async () => {
    const consentId = await newConsent(VULN_URL);
    const raw = await rawHttp(
      'localhost',
      4467,
      `GET /consent/${consentId} HTTP/1.1\r\nHost: localhost:4467\r\nConnection: close\r\n\r\n`
    );
    const [headerBlock] = raw.split('\r\n\r\n', 1);
    expect(headerBlock).toMatch(/^HTTP\/1\.1 200 /);
    expect(headerBlock.toLowerCase()).not.toContain('cross-origin-opener-policy');
  });

  test('protected 403 body does NOT contain any 32-hex string (no nonce leak)', async () => {
    const consentId = await newConsent(MAIN_URL);
    const raw = await rawHttp(
      'localhost',
      4466,
      `GET /consent/${consentId} HTTP/1.1\r\nHost: localhost:4466\r\nSec-Fetch-Dest: empty\r\nSec-Fetch-Mode: cors\r\nConnection: close\r\n\r\n`
    );
    expect(raw).toMatch(/^HTTP\/1\.1 403 /);
    // Split header/body then assert nonce shape is absent from the whole response.
    expect(raw).not.toMatch(/[a-f0-9]{32}/);
  });
});

// ─── Sec-Fetch-Dest fuzz (many destinations, all should be blocked) ────
const FUZZ_DESTS = [
  { dest: 'empty', mode: 'cors' },
  { dest: 'empty', mode: 'no-cors' },
  { dest: 'audio', mode: 'no-cors' },
  { dest: 'video', mode: 'no-cors' },
  { dest: 'worker', mode: 'same-origin' },
  { dest: 'sharedworker', mode: 'same-origin' },
  { dest: 'serviceworker', mode: 'same-origin' },
  { dest: 'image', mode: 'no-cors' },
  { dest: 'script', mode: 'no-cors' },
  { dest: 'font', mode: 'no-cors' },
  { dest: 'style', mode: 'no-cors' },
  { dest: 'manifest', mode: 'cors' },
  { dest: 'embed', mode: 'no-cors' },
  { dest: 'track', mode: 'no-cors' },
  { dest: 'iframe', mode: 'navigate' },
  { dest: 'object', mode: 'no-cors' },
  { dest: 'report', mode: 'no-cors' },
];

test.describe('Sec-Fetch-Dest fuzz — every non-navigation destination rejected', () => {
  for (const { dest, mode } of FUZZ_DESTS) {
    test(`dest=${dest} mode=${mode} → 403 on protected server, 200+nonce on twin`, async () => {
      const protectedId = await newConsent(MAIN_URL);
      const vulnId = await newConsent(VULN_URL);

      const good = await pwRequest.newContext({ baseURL: MAIN_URL });
      const bad = await pwRequest.newContext({ baseURL: VULN_URL });
      try {
        const p = await good.get(`/consent/${protectedId}`, {
          headers: { 'Sec-Fetch-Dest': dest, 'Sec-Fetch-Mode': mode },
        });
        expect(p.status(), `protected server should block dest=${dest}`).toBe(403);
        expect(await p.text()).not.toMatch(/[a-f0-9]{32}/);

        // The twin has no Sec-Fetch filter, so it leaks the nonce.
        const v = await bad.get(`/consent/${vulnId}`, {
          headers: { 'Sec-Fetch-Dest': dest, 'Sec-Fetch-Mode': mode },
        });
        expect(v.status(), `twin server should NOT block dest=${dest}`).toBe(200);
        expect(await v.text()).toMatch(/name="nonce" value="[a-f0-9]{32}"/);
      } finally {
        await good.dispose();
        await bad.dispose();
      }
    });
  }
});

// ─── Service-Worker header block: case + path variations ───────────────
test.describe('Service-Worker header block is broad', () => {
  const SW_PATHS = ['/sw.js', '/service-worker.js', '/consent/abc/sw.js', '/', '/api/request-consent'];

  for (const path of SW_PATHS) {
    test(`SW header → 403 at ${path}`, async () => {
      const req = await pwRequest.newContext({ baseURL: MAIN_URL });
      const res = await req.get(path, { headers: { 'Service-Worker': 'script' } });
      expect(res.status()).toBe(403);
      expect(await res.text()).toContain('Service Worker registration blocked');
      await req.dispose();
    });
  }

  test('lowercase service-worker header is also blocked (HTTP is case-insensitive)', async () => {
    const req = await pwRequest.newContext({ baseURL: MAIN_URL });
    const res = await req.get('/sw.js', { headers: { 'service-worker': 'script' } });
    expect(res.status()).toBe(403);
    await req.dispose();
  });

  test('without SW header, same path is NOT blocked (proves header is the trigger)', async () => {
    const req = await pwRequest.newContext({ baseURL: MAIN_URL });
    // No Service-Worker header. /sw.js is not served, so expect 404, NOT 403.
    const res = await req.get('/sw.js');
    expect(res.status()).toBe(404);
    await req.dispose();
  });
});

// ─── Inside-the-popup assertions ───────────────────────────────────────
test.describe('browser: inside the popup after COOP isolation', () => {
  test('window.opener is null inside the consent popup', async ({ page, context, browserName }) => {
    await page.goto(MAIN_URL);
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: /Open consent popup/i }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');

    const opener = await popup.evaluate(() => (window.opener === null ? 'null' : typeof window.opener));
    // In all three browsers, COOP: same-origin on the popup + no COOP on the
    // opener puts them in different browsing-context groups, so opener is null.
    // If a browser ever deviates, this assertion localises the incompatibility.
    expect(opener, `window.opener in popup (${browserName})`).toBe('null');
  });

  test('postMessage from opener to popup does NOT arrive (COOP isolation)', async ({ page, context, browserName }) => {
    await page.goto(MAIN_URL);
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: /Open consent popup/i }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');

    // Install a receiver in the popup that records any message it gets.
    await popup.evaluate(() => {
      (window as unknown as { __received: unknown[] }).__received = [];
      window.addEventListener('message', e => {
        (window as unknown as { __received: unknown[] }).__received.push(e.data);
      });
    });

    // From the opener, attempt postMessage on the popup handle.
    // With a severed opener the browser should either throw or silently drop.
    const senderResult = await page.evaluate(() => {
      try {
        // `popupRef` is defined in mainPage().
        const ref = (window as unknown as { popupRef: Window | null }).popupRef;
        if (!ref) return 'no-ref';
        ref.postMessage('HELLO_FROM_OPENER', '*');
        return 'sent';
      } catch (e) {
        return 'threw:' + (e as Error).message;
      }
    });

    // Give the message event loop a moment.
    await popup.waitForTimeout(500);
    const received = await popup.evaluate(
      () => (window as unknown as { __received: unknown[] }).__received
    );

    expect(
      received,
      `popup should NOT receive message from COOP-severed opener (${browserName}, sender=${senderResult})`
    ).toEqual([]);
  });
});

// ─── Nonce entropy: many consents yield many distinct nonces ───────────
test('nonce entropy: 20 consents have 20 distinct 32-hex nonces', async () => {
  const req = await pwRequest.newContext({ baseURL: MAIN_URL });
  try {
    const nonces = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const r = await req.post('/api/request-consent', { data: { command: 'x' } });
      const { consentId } = await r.json();
      const page = await req.get(`/consent/${consentId}`, {
        headers: {
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        },
      });
      const m = (await page.text()).match(/name="nonce" value="([a-f0-9]{32})"/);
      expect(m, 'nonce must be present and 32 hex chars').not.toBeNull();
      nonces.add(m![1]);
    }
    expect(nonces.size).toBe(20);
  } finally {
    await req.dispose();
  }
});

// ─── Paired browser-flow negative control ──────────────────────────────
test.describe('browser negative control — attacks succeed on vulnerable twin', () => {
  test('twin: fetch() in-page DOES return the nonce (proves the block on main is meaningful)', async ({
    page,
  }) => {
    await page.goto(VULN_URL);
    // Twin main page has no attack UI; drive it directly.
    const leaked = await page.evaluate(async () => {
      const r = await fetch('/api/request-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'x' }),
      });
      const { consentId } = await r.json();
      const page = await fetch('/consent/' + consentId);
      const text = await page.text();
      return /name="nonce" value="[a-f0-9]{32}"/.test(text);
    });
    expect(leaked, 'on the vulnerable twin, fetch() must leak the nonce').toBe(true);
  });
});

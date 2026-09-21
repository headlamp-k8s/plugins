# COOP Popup Consent — Proof of Concept

Minimal proof of concept for the same-port consent popup security model described in
[`backend-and-mcp.md`](../backend-and-mcp.md).

**No third-party dependencies.** Pure Node.js + minimal HTML/JS.

## Quick start

```bash
cd docs/proposals/consent-poc
node server.cjs
# Open http://localhost:4466
```

## What it proves

The PoC demonstrates that a **same-port popup** can be securely isolated from the
page that opens it, using three coordinated browser mechanisms:

| Layer | Mechanism | What it stops |
|-------|-----------|---------------|
| 1 | **Sec-Fetch filtering** | `fetch()`, XHR, `<iframe>`, `<object>` — server only responds to top-level navigation |
| 2 | **COOP** (`Cross-Origin-Opener-Policy: same-origin`) | Parent page reading popup DOM or extracting the nonce via `window.opener` |
| 3 | **Server-side nonce** | Approval requires a one-time nonce embedded in the consent page HTML |
| 4 | **SW registration blocking** | Server rejects requests with `Service-Worker: script` header |

## How it works

1. **Main page** (`/`) — simulates Headlamp with a plugin. No COOP header (defaults to `unsafe-none`).
2. Plugin calls `POST /api/request-consent` → server generates `consentId` + cryptographic `nonce`.
3. Headlamp opens `window.open('/consent/{consentId}')` via user gesture (click).
4. Server serves consent page **only** when `Sec-Fetch-Dest: document` + `Sec-Fetch-Mode: navigate`.
   Response includes `Cross-Origin-Opener-Policy: same-origin` → COOP mismatch with parent → opener severed.
5. User clicks "Approve" → form POSTs nonce to `/consent/{id}/approve`.
6. Server validates nonce (one-time), records approval. Plugin polls `/api/consent-status/{id}`.

## Attack tests

Click each attack button on the main page to verify:

| # | Attack | Expected result |
|---|--------|----------------|
| 1 | `fetch('/consent/{id}')` | HTTP 403 — `Sec-Fetch-Dest: empty` rejected |
| 2 | XHR to consent page | HTTP 403 — same reason |
| 3 | `<iframe>` consent page | HTTP 403 — `Sec-Fetch-Dest: iframe` rejected |
| 4 | POST approve with wrong nonce | HTTP 403 — invalid nonce |
| 5 | Read popup DOM via `window.open()` ref | `SecurityError` — COOP severed the relationship |
| 6 | Register Service Worker | Rejected — server blocks `Service-Worker: script` |

## Browser requirements

- **COOP**: Chrome 83+, Firefox 79+, Safari 15.2+
- **Sec-Fetch-\***: Chrome 76+, Firefox 90+, Safari 16.1+

For older browsers without `Sec-Fetch-*` headers, the server allows the request
(headers are absent), but COOP + nonce still provide protection. The consent page
would be visible to `fetch()` but the nonce can't be replayed after use.

## E2E tests (Playwright)

The attack table above is verified by a comprehensive Playwright suite that
runs across **Chromium, Firefox, and WebKit** — 53 tests per browser
(**159 total**).

```bash
cd docs/proposals/consent-poc
npm install
npm run test:install   # downloads chromium + firefox + webkit
npm test
```

The Playwright config auto-starts **two** servers as `webServer`:

- `server.cjs` on port `4466` — the protected server under test.
- `vulnerable-server.cjs` on port `4467` — a deliberately-vulnerable twin with
  the three server-side protections (Sec-Fetch, COOP, Service-Worker block)
  removed.

The twin is used as a **negative control**: every protection test is paired
with the same attack against the twin, which must succeed there. This proves
the positive tests aren't tautological false positives — they would genuinely
catch a regression that removed the protection.

### Test suites

- `tests/consent-poc.spec.ts` — 19 tests covering the attack table above
  (HTTP-level Sec-Fetch filtering, COOP header, nonce validation, nonce
  replay, Service Worker blocking) and browser-level attack buttons.
- `tests/consent-poc-adversarial.spec.ts` — 34 additional tests that attack
  from different angles:
  - **Negative-control twin**: twin serves `/consent` without COOP, leaks
    nonce to `fetch()`, serves `/sw.js` despite `Service-Worker: script`.
  - **Raw-socket header verification**: Node `net.Socket` sends hand-crafted
    HTTP/1.1 and asserts on literal response bytes
    (`Cross-Origin-Opener-Policy: same-origin` present on main, absent on twin;
    403 body contains no 32-hex string).
  - **`Sec-Fetch-Dest` fuzz**: 17 destinations × (main blocked, twin leaks).
  - **`Service-Worker` header block**: across 5 paths + lowercase variant +
    without-header control.
  - **Inside the popup**: `window.opener === null` (cross-browser-portable
    COOP assertion).
  - **`postMessage` isolation**: opener → popup `postMessage` does not arrive.
  - **Nonce entropy**: 20 consents yield 20 distinct 32-hex nonces.
  - **Browser negative control**: the twin's main page actually leaks the
    nonce via `fetch()` from a real page context.

### Browser compatibility notes

All 159 tests pass on Chromium, Firefox, and WebKit. A few mechanisms differ
in *how* they block — but in every case they block, and the tests are written
to accept the different legitimate outcomes:

| Aspect | Chromium | Firefox | WebKit |
|--------|----------|---------|--------|
| `popup.document.title` on COOP-severed popup | throws `SecurityError` | returns `''` (WindowProxy) | returns `''` (WindowProxy) |
| `popup.location.href` on COOP-severed popup | throws `SecurityError` | returns `''` | returns `'about:blank'` |
| `window.opener` inside the popup | `null` | `null` | `null` |
| `postMessage` from opener → COOP-severed popup | not delivered | not delivered | not delivered |

In all three browsers the attacker cannot read the real title
("Approve Command") or the real URL (which contains the `consentId`), so the
security property holds. `window.opener === null` inside the popup is the
cross-browser-portable primitive and is asserted by
`consent-poc-adversarial.spec.ts`.

## Files

- `server.cjs` — Node.js HTTP server (no dependencies). Implements all endpoints,
  security checks, and serves HTML inline. Uses `.cjs` extension because the parent
  `ai/package.json` has `"type": "module"`.
- `vulnerable-server.cjs` — deliberately-vulnerable twin (port 4467) used as a
  negative control by the adversarial tests.
- `playwright.config.ts` — Playwright config; auto-starts both servers and
  runs the suite on chromium, firefox, and webkit.
- `tests/consent-poc.spec.ts` — 19 e2e tests covering the attack table above.
- `tests/consent-poc-adversarial.spec.ts` — 34 adversarial / negative-control
  tests.
- `package.json` — only `@playwright/test` as a dev dependency.

#!/usr/bin/env node
// COOP Popup Consent — Proof of Concept
// No third-party dependencies. Run: node server.cjs
// Then open http://localhost:4466 in your browser.

const http = require('http');
const crypto = require('crypto');

const PORT = 4466;

// ── Server-side state ───────────────────────────────────────────────
// Map<consentId, { nonce, command, approved, used }>
const consents = new Map();

// ── Helpers ─────────────────────────────────────────────────────────
function randomId() {
  return crypto.randomBytes(16).toString('hex');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

// ── Security check: reject Service Worker registration ──────────────
function blockServiceWorker(req, res) {
  if (req.headers['service-worker'] === 'script') {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Service Worker registration blocked by server policy');
    return true;
  }
  return false;
}

// ── Security check: Sec-Fetch-* filtering for consent pages ─────────
// Only allow top-level navigation (popup/tab). Reject fetch(), XHR,
// iframe, object, embed, prefetch, etc.
function requireNavigation(req, res) {
  const dest = req.headers['sec-fetch-dest'];
  const mode = req.headers['sec-fetch-mode'];

  // Sec-Fetch headers are only sent by browsers (Chrome 76+, Firefox 90+).
  // If missing (curl, older browser), allow — console users are trusted.
  if (!dest && !mode) return true;

  if (dest === 'document' && mode === 'navigate') return true;

  res.writeHead(403, { 'Content-Type': 'text/plain' });
  res.end(
    `Blocked: Sec-Fetch-Dest=${dest}, Sec-Fetch-Mode=${mode}. ` +
      'Only top-level navigation allowed.'
  );
  return false;
}

// ── Pages ───────────────────────────────────────────────────────────

// Main page — simulates Headlamp with a "plugin" that tries attacks
function mainPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Headlamp — COOP Consent PoC (main page)</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; }
    h1 { color: #333; }
    button { padding: 8px 16px; margin: 4px; cursor: pointer; }
    .ok { color: green; } .fail { color: red; }
    #log { background: #f5f5f5; padding: 1rem; font-family: monospace;
           font-size: 13px; white-space: pre-wrap; max-height: 600px; overflow-y: auto; }
  </style>
</head>
<body>
  <h1>COOP Popup Consent — Proof of Concept</h1>
  <p>This page simulates the Headlamp main page (where plugins run).
     Click buttons to test each attack vector.</p>

  <h2>Legitimate flow</h2>
  <button onclick="legitimateFlow()">✅ Open consent popup (user gesture)</button>

  <h2>Attack simulations (all should fail)</h2>
  <button onclick="attackFetch()">🔒 Attack 1: fetch() consent page</button>
  <button onclick="attackXHR()">🔒 Attack 2: XHR consent page</button>
  <button onclick="attackIframe()">🔒 Attack 3: iframe consent page</button>
  <button onclick="attackApproveNoNonce()">🔒 Attack 4: POST approve (no nonce)</button>
  <button onclick="attackReadPopup()">🔒 Attack 5: read popup DOM via opener</button>
  <button onclick="attackSW()">🔒 Attack 6: register Service Worker</button>

  <h2>Log</h2>
  <div id="log"></div>

  <script>
    let currentConsentId = null;
    let popupRef = null;

    function log(msg, ok) {
      const el = document.getElementById('log');
      const cls = ok === true ? 'ok' : ok === false ? 'fail' : '';
      el.innerHTML += '<span class="' + cls + '">' +
        new Date().toISOString().slice(11, 19) + ' ' + msg + '</span>\\n';
      el.scrollTop = el.scrollHeight;
    }

    // ── Step 1: request a command consent from the backend ──────────
    async function requestConsent() {
      const res = await fetch('/api/request-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'minikube status' })
      });
      const data = await res.json();
      currentConsentId = data.consentId;
      log('Consent requested: ' + data.consentId);
      return data.consentId;
    }

    // ── Legitimate flow ─────────────────────────────────────────────
    async function legitimateFlow() {
      const id = await requestConsent();
      log('Opening popup via user gesture...');
      popupRef = window.open('/consent/' + id, 'consent', 'width=500,height=400');
      if (!popupRef || popupRef.closed) {
        log('Popup blocked — falling back to full-page navigation', false);
        return;
      }
      log('Popup opened. Polling for approval...');
      pollApproval(id);
    }

    async function pollApproval(id) {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const res = await fetch('/api/consent-status/' + id);
        const data = await res.json();
        if (data.approved) {
          log('✅ Command approved by user!', true);
          return;
        }
      }
      log('Timed out waiting for approval', false);
    }

    // ── Attack 1: fetch() the consent page to read nonce ────────────
    async function attackFetch() {
      const id = await requestConsent();
      try {
        const res = await fetch('/consent/' + id);
        if (res.ok) {
          const text = await res.text();
          if (text.includes('nonce')) {
            log('❌ VULNERABILITY: fetch() returned consent page with nonce!', false);
          } else {
            log('fetch() got response but no nonce visible', false);
          }
        } else {
          log('✅ fetch() blocked by server (HTTP ' + res.status + ')', true);
        }
      } catch (e) {
        log('✅ fetch() error: ' + e.message, true);
      }
    }

    // ── Attack 2: XHR the consent page ──────────────────────────────
    async function attackXHR() {
      const id = await requestConsent();
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/consent/' + id);
      xhr.onload = () => {
        if (xhr.status === 200 && xhr.responseText.includes('nonce')) {
          log('❌ VULNERABILITY: XHR returned consent page with nonce!', false);
        } else {
          log('✅ XHR blocked by server (HTTP ' + xhr.status + ')', true);
        }
      };
      xhr.onerror = () => log('✅ XHR error (blocked)', true);
      xhr.send();
    }

    // ── Attack 3: iframe the consent page ───────────────────────────
    async function attackIframe() {
      const id = await requestConsent();
      const iframe = document.createElement('iframe');
      iframe.src = '/consent/' + id;
      iframe.style.display = 'none';
      iframe.onload = () => {
        try {
          const doc = iframe.contentDocument;
          const nonce = doc ? doc.querySelector('[name=nonce]') : null;
          if (nonce) {
            log('❌ VULNERABILITY: read nonce from iframe!', false);
          } else {
            log('✅ iframe loaded but content blocked or empty', true);
          }
        } catch (e) {
          log('✅ iframe DOM access blocked: ' + e.message, true);
        }
        iframe.remove();
      };
      iframe.onerror = () => {
        log('✅ iframe load blocked', true);
        iframe.remove();
      };
      document.body.appendChild(iframe);
    }

    // ── Attack 4: POST approve without nonce ────────────────────────
    async function attackApproveNoNonce() {
      const id = await requestConsent();
      try {
        const res = await fetch('/consent/' + id + '/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'nonce=guess123'
        });
        const data = await res.json();
        if (data.approved) {
          log('❌ VULNERABILITY: approved with guessed nonce!', false);
        } else {
          log('✅ approve rejected: ' + data.error, true);
        }
      } catch (e) {
        log('✅ approve blocked: ' + e.message, true);
      }
    }

    // ── Attack 5: read popup DOM via opener reference ────────────────
    async function attackReadPopup() {
      const id = await requestConsent();
      popupRef = window.open('/consent/' + id, 'consent', 'width=500,height=400');
      if (!popupRef) {
        log('Popup blocked (can\\'t test opener access)', false);
        return;
      }
      // Wait for popup to load
      await new Promise(r => setTimeout(r, 1500));

      // Semantic check: the attacker has leaked real data only if they can
      // observe the real title ("Approve Command") or the real URL that
      // contains the consentId. Empty strings / "about:blank" / throws all
      // mean the browser kept the opener severed.
      let title = null, locHref = null, titleErr = null, locErr = null;
      try { title = popupRef.document.title; } catch (e) { titleErr = e.message; }
      try { locHref = popupRef.location.href; } catch (e) { locErr = e.message; }

      const realTitleLeaked = title && title.includes('Approve Command');
      const realUrlLeaked = locHref && /\\/consent\\/[a-f0-9]/.test(locHref);

      if (realTitleLeaked) {
        log('❌ VULNERABILITY: read real popup title: ' + title, false);
      } else if (titleErr) {
        log('✅ popup title access blocked (throw): ' + titleErr, true);
      } else {
        log('✅ popup title access yielded no real data: "' + (title || '') + '"', true);
      }

      if (realUrlLeaked) {
        log('❌ VULNERABILITY: read real popup location: ' + locHref, false);
      } else if (locErr) {
        log('✅ popup location access blocked (throw): ' + locErr, true);
      } else {
        log('✅ popup location access yielded no real data: "' + (locHref || '') + '"', true);
      }
    }

    // ── Attack 6: register Service Worker ───────────────────────────
    async function attackSW() {
      if (!navigator.serviceWorker) {
        log('ServiceWorker API not available (non-HTTPS?)', false);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        log('❌ VULNERABILITY: Service Worker registered!', false);
        await reg.unregister();
      } catch (e) {
        log('✅ Service Worker registration blocked: ' + e.message, true);
      }
    }
  </script>
</body>
</html>`;
}

// Consent page — served with COOP + nonce
function consentPage(consentId, nonce, command) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Approve Command</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 500px; margin: 2rem auto;
           background: #f9f9f9; }
    .card { background: white; border: 1px solid #ddd; border-radius: 8px;
            padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; font-size: 1.3rem; }
    .command { background: #1a1a1a; color: #4caf50; padding: 1rem;
               border-radius: 4px; font-family: monospace; font-size: 1rem; }
    button { padding: 10px 24px; font-size: 1rem; cursor: pointer;
             border: none; border-radius: 4px; margin-right: 8px; }
    .approve { background: #4caf50; color: white; }
    .deny { background: #ccc; color: #333; }
    .info { color: #666; font-size: 0.85rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔒 Command Approval Required</h1>
    <p>A plugin wants to run this command:</p>
    <div class="command">${command}</div>
    <form method="POST" action="/consent/${consentId}/approve" style="margin-top: 1.5rem;">
      <input type="hidden" name="nonce" value="${nonce}">
      <button type="submit" class="approve" autofocus>✅ Approve</button>
      <button type="button" class="deny" onclick="window.close()">❌ Deny</button>
    </form>
    <p class="info">
      This popup is protected by COOP — the page that opened it cannot read
      its content or auto-approve the command.
    </p>
  </div>
</body>
</html>`;
}

// ── HTTP server ─────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // ── Global: block Service Worker registration ─────────────────────
  if (blockServiceWorker(req, res)) return;

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  // ── Main page (no COOP — simulates Headlamp app) ─────────────────
  if (url.pathname === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(mainPage());
    return;
  }

  // ── API: request consent ──────────────────────────────────────────
  if (url.pathname === '/api/request-consent' && method === 'POST') {
    const body = await parseBody(req);
    const { command } = JSON.parse(body);
    const consentId = randomId();
    const nonce = randomId();
    consents.set(consentId, { nonce, command, approved: false, used: false });
    json(res, 200, { consentId });
    return;
  }

  // ── API: poll consent status ──────────────────────────────────────
  const statusMatch = url.pathname.match(/^\/api\/consent-status\/([a-f0-9]+)$/);
  if (statusMatch && method === 'GET') {
    const entry = consents.get(statusMatch[1]);
    if (!entry) return json(res, 404, { error: 'not found' });
    json(res, 200, { approved: entry.approved });
    return;
  }

  // ── Consent page (COOP + Sec-Fetch protected) ─────────────────────
  const consentMatch = url.pathname.match(/^\/consent\/([a-f0-9]+)$/);
  if (consentMatch && method === 'GET') {
    // Sec-Fetch filter: only top-level navigation allowed
    if (!requireNavigation(req, res)) return;

    const entry = consents.get(consentMatch[1]);
    if (!entry) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Consent not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      // KEY: COOP severs the opener relationship with the main page
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
    res.end(consentPage(consentMatch[1], entry.nonce, entry.command));
    return;
  }

  // ── Consent approve (POST with nonce) ─────────────────────────────
  const approveMatch = url.pathname.match(/^\/consent\/([a-f0-9]+)\/approve$/);
  if (approveMatch && method === 'POST') {
    const body = await parseBody(req);
    const params = new URLSearchParams(body);
    const submittedNonce = params.get('nonce');
    const entry = consents.get(approveMatch[1]);

    if (!entry) return json(res, 404, { error: 'not found' });
    if (entry.used) return json(res, 409, { error: 'already used', approved: false });
    if (submittedNonce !== entry.nonce) {
      return json(res, 403, { error: 'invalid nonce', approved: false });
    }

    entry.approved = true;
    entry.used = true;

    // Respond with a page that closes the popup
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
    res.end(`<!DOCTYPE html>
<html><head><title>Approved</title></head>
<body style="font-family: system-ui; text-align: center; padding: 2rem;">
  <h2>✅ Command approved</h2>
  <p>You can close this window.</p>
  <script>setTimeout(() => window.close(), 1500);</script>
</body></html>`);
    return;
  }

  // ── Catch-all 404 ─────────────────────────────────────────────────
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  COOP Popup Consent — Proof of Concept                      ║
║  Open http://localhost:${PORT} in your browser              ║
║                                                              ║
║  Click "Open consent popup" for the legitimate flow.         ║
║  Click attack buttons to verify each vector is blocked.      ║
╚══════════════════════════════════════════════════════════════╝
`);
});

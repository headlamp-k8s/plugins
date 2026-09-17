#!/usr/bin/env node
/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

// Vulnerable TWIN of server.cjs used as a NEGATIVE CONTROL for the
// consent-poc tests. It exposes the same API and HTML, but
// deliberately removes the 3 server-side protections:
//
//   1. No Sec-Fetch-Dest/Mode filtering on /consent/:id
//   2. No `Cross-Origin-Opener-Policy` header on the consent page
//   3. No `Service-Worker: script` block
//
// Adversarial tests run each attack against BOTH servers:
//   - Against server.cjs       → attack MUST fail (protection works)
//   - Against this twin server → attack MUST succeed (without the
//                                protection the attack really works)
//
// This proves the positive tests aren't tautological false positives.

const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.VULN_PORT) || 4467;

const consents = new Map();

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

function consentPage(consentId, nonce, command) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Approve Command</title></head>
<body>
  <form method="POST" action="/consent/${consentId}/approve">
    <input type="hidden" name="nonce" value="${nonce}">
    <button type="submit" autofocus>Approve</button>
  </form>
  <p>Command: ${command}</p>
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  // NOTE: intentionally no `Service-Worker: script` block.
  // NOTE: intentionally no Sec-Fetch filtering.
  // NOTE: intentionally no COOP header.

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  if (url.pathname === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!DOCTYPE html><title>vulnerable twin</title><body>twin</body>');
    return;
  }

  if (url.pathname === '/api/request-consent' && method === 'POST') {
    const body = await parseBody(req);
    const { command } = JSON.parse(body);
    const consentId = randomId();
    const nonce = randomId();
    consents.set(consentId, { nonce, command, approved: false, used: false });
    json(res, 200, { consentId });
    return;
  }

  const statusMatch = url.pathname.match(/^\/api\/consent-status\/([a-f0-9]+)$/);
  if (statusMatch && method === 'GET') {
    const entry = consents.get(statusMatch[1]);
    if (!entry) return json(res, 404, { error: 'not found' });
    json(res, 200, { approved: entry.approved });
    return;
  }

  const consentMatch = url.pathname.match(/^\/consent\/([a-f0-9]+)$/);
  if (consentMatch && method === 'GET') {
    const entry = consents.get(consentMatch[1]);
    if (!entry) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Consent not found');
      return;
    }
    // No Sec-Fetch filter, no COOP header — deliberately vulnerable.
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(consentPage(consentMatch[1], entry.nonce, entry.command));
    return;
  }

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
    json(res, 200, { approved: true });
    return;
  }

  // Return a minimal valid Service Worker for registration attempts.
  if (url.pathname === '/sw.js' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end('// vulnerable twin service worker\nself.addEventListener("install",()=>{});');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[vulnerable-twin] listening on http://localhost:${PORT}`);
});

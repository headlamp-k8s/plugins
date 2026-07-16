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

import { tool } from '@langchain/core/tools';
import { execFileSync } from 'child_process';
import { z } from 'zod';

/** Allowed HTTP methods for read-only mode. */
const READ_ONLY_METHODS = new Set(['GET']);
/** All allowed HTTP methods when write access is enabled. */
const ALL_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

export interface KubectlToolOptions {
  /**
   * When true (the default), only GET requests are permitted.
   * POST, PUT, PATCH, and DELETE are rejected before reaching kubectl.
   */
  readOnly?: boolean;
}

/**
 * Creates a LangChain tool that executes kubectl commands.
 * Uses the Kubernetes API request interface (url + method) for compatibility
 * with the same tool name used in the Headlamp UI, so the LLM's tool-calling
 * behaviour is identical.
 *
 * By default the tool is **read-only** — only GET requests are allowed.
 * Pass `{ readOnly: false }` to enable mutating operations.
 */
export function createKubectlTool(options: KubectlToolOptions = {}) {
  const { readOnly = true } = options;
  const allowedMethods = readOnly ? READ_ONLY_METHODS : ALL_METHODS;

  const methodList = [...allowedMethods].join(', ');
  const description = readOnly
    ? `Make read-only GET requests to the Kubernetes API server to inspect resources.
Use standard Kubernetes API URL paths like /api/v1/pods or /api/v1/namespaces/default/pods/my-pod.
Only GET is supported. Mutating operations are not permitted.`
    : `Make requests to the Kubernetes API server to fetch, create, update or delete resources.
Use standard Kubernetes API URL paths like /api/v1/pods or /api/v1/namespaces/default/pods/my-pod.
Supported methods: ${methodList}.`;

  return tool(
    async ({ url, method, body }) => {
      try {
        const { args, input } = buildKubectlArgs(url, method, body, allowedMethods);
        const output = execFileSync('kubectl', args, {
          encoding: 'utf-8',
          timeout: 30_000,
          maxBuffer: 4 * 1024 * 1024,
          input,
        });
        return output;
      } catch (err: unknown) {
        const commandError = err as Error & { stderr?: unknown; stdout?: unknown };
        const stderr = commandError.stderr ? String(commandError.stderr).trim() : '';
        const stdout = commandError.stdout ? String(commandError.stdout).trim() : '';
        return JSON.stringify({
          error: true,
          message: stderr || commandError.message,
          output: stdout,
        });
      }
    },
    {
      name: 'kubernetes_api_request',
      description,
      schema: z.object({
        url: z
          .string()
          .describe(
            'Kubernetes API URL path, e.g. /api/v1/pods or /api/v1/namespaces/default/pods/my-pod'
          ),
        method: z.string().describe(`HTTP method: ${methodList}`),
        body: z.string().optional().describe('Optional JSON request body for POST/PUT/PATCH'),
      }),
    }
  );
}

/**
 * Converts a Kubernetes API URL + method into kubectl arguments.
 * Uses `kubectl get --raw` for GET and the appropriate raw verb for mutations.
 */
export function buildKubectlArgs(
  url: string,
  method: string,
  body?: string,
  allowedMethods: Set<string> = ALL_METHODS
): { args: string[]; input?: string } {
  // Validate the URL is a Kubernetes API path, not a flag injection attempt.
  // kubectl --raw expects a path like /api/v1/pods — reject anything that
  // doesn't start with "/" to prevent argument injection (e.g. "--kubeconfig=...").
  if (!url.startsWith('/')) {
    throw new Error(`Invalid API path: must start with "/", got "${url}"`);
  }
  // Reject paths with characters that could be used for injection or path traversal.
  if (!/^\/[a-zA-Z0-9\/_.:@%~-]+$/.test(url)) {
    throw new Error(
      `Invalid API path: contains disallowed characters. Path must match /[a-zA-Z0-9/_.:@%~-]+`
    );
  }

  const m = method.toUpperCase();

  if (!allowedMethods.has(m)) {
    throw new Error(
      `Method ${m} is not allowed. Permitted methods: ${[...allowedMethods].join(', ')}`
    );
  }

  if (m === 'GET') {
    return { args: ['get', '--raw', url] };
  }

  if (m === 'POST') {
    return { args: ['create', '--raw', url, '-f', '-'], input: body };
  }

  if (m === 'PUT') {
    return { args: ['replace', '--raw', url, '-f', '-'], input: body };
  }

  if (m === 'DELETE') {
    return { args: ['delete', '--raw', url] };
  }

  if (m === 'PATCH') {
    return { args: ['patch', '--raw', url, '-f', '-'], input: body };
  }

  throw new Error(`Unsupported HTTP method: ${method}`);
}

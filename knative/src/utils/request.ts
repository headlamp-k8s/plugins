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

export const REQUEST_TIMEOUT_MS = 120_000;

/**
 * Waits for a request, but no longer than {@link REQUEST_TIMEOUT_MS}.
 *
 * @param request - The request to wait for.
 * @param what - What the request does, for the timeout error: `Timed out ${what}`.
 * @returns The request's result.
 * @throws The request's own error, or a timeout error.
 */
export function withTimeout<T>(request: Promise<T>, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out ${what}`)), REQUEST_TIMEOUT_MS);
    request.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

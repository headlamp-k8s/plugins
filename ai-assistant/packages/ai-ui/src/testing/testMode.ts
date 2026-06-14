/// <reference path="../vite-env.d.ts" />

/** @returns Whether the test-mode flag is exactly the string `true`. */
export function isTestModeCheck(): boolean {
  return import.meta.env?.VITE_HEADLAMP_AI_TEST === 'true';
}

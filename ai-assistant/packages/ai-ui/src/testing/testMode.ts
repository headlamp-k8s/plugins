export function isTestModeCheck() {
  // @ts-ignore
  return import.meta.env.VITE_HEADLAMP_AI_TEST === 'true';
}

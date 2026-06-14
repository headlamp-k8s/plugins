import axe, { type Result } from 'axe-core';

/**
 * Runs axe against rendered UI and returns all DOM-verifiable accessibility violations.
 *
 * Color contrast is disabled because jsdom does not implement the canvas API
 * axe uses for contrast calculations. Browser and Storybook audits must cover it.
 *
 * @param container - Rendered DOM subtree to audit.
 * @returns Accessibility violations detected by axe.
 */
export async function runAxe(container: Element = document.body): Promise<Result[]> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
    },
  });
  return results.violations;
}

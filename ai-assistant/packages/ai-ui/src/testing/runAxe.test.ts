import { afterEach, describe, expect, it } from 'vitest';
import { runAxe } from './runAxe';

describe('runAxe', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('returns no violations for accessible controls', async () => {
    document.body.innerHTML = '<main><button type="button">Save</button></main>';

    await expect(runAxe()).resolves.toEqual([]);
  });

  it('reports accessibility violations within the requested container', async () => {
    const container = document.createElement('main');
    container.innerHTML = '<img src="cluster.svg">';
    document.body.append(container);

    const violations = await runAxe(container);

    expect(violations.map(violation => violation.id)).toContain('image-alt');
  });
});

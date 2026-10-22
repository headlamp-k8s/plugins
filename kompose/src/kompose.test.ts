import { describe, expect, it } from 'vitest';
import { komposePod } from './kompose';

describe('komposePod', () => {
  it('does not throw on a compose file with non-ASCII characters', () => {
    const compose = 'services:\n  web:\n    # café ☕\n    image: nginx';
    expect(() => komposePod(compose)).not.toThrow();
  });

  it('embeds a script that decodes back to the original content', () => {
    const compose = 'services:\n  café:\n    image: nginx “latest”';
    const job = komposePod(compose) as any;
    const script: string = job.spec.template.spec.containers[0].args[0];
    const encoded = script.match(/^echo "([^"]+)"/)?.[1];
    expect(encoded).toBeTruthy();
    const decoded = decodeURIComponent(escape(atob(encoded as string)));
    expect(decoded).toBe(compose);
  });
});

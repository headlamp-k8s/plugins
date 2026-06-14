import { Icon } from '@iconify/react';
import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';

const iconifyMocks = vi.hoisted(() => ({
  addCollection: vi.fn(),
}));

vi.mock('@iconify/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@iconify/react')>();
  iconifyMocks.addCollection.mockImplementation(actual.addCollection);
  return { ...actual, addCollection: iconifyMocks.addCollection };
});

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

it('registers provider and assistant icon collections for offline use', async () => {
  const module = await import('./iconBundles');

  expect(iconifyMocks.addCollection).toHaveBeenCalledTimes(2);
  const providerCollection = iconifyMocks.addCollection.mock.calls[0][0];
  const assistantCollection = iconifyMocks.addCollection.mock.calls[1][0];

  expect(providerCollection.prefix).toBe('ai-providers');
  expect(Object.keys(providerCollection.icons)).toEqual([
    'anthropic',
    'mistral',
    'google',
    'deepseek',
    'azure',
    'openai',
    'copilot',
    'local',
  ]);
  expect(providerCollection.width).toBe(24);
  expect(providerCollection.height).toBe(24);
  expect(
    Object.values<{ body: string }>(providerCollection.icons).every(icon =>
      icon.body.startsWith('<path')
    )
  ).toBe(true);

  expect(assistantCollection).toMatchObject({
    prefix: 'ai-assistant',
    width: 24,
    height: 24,
  });
  expect(assistantCollection.icons.logo.body).toContain('fill="currentColor"');
  expect(module.default).toBe(providerCollection);

  const { container } = render(
    React.createElement(Icon, { icon: 'ai-providers:openai', 'aria-label': 'OpenAI' })
  );
  expect(container.querySelector('svg[aria-label="OpenAI"] path')).not.toBeNull();
});

it('registers collections only once when the module is imported repeatedly', async () => {
  await import('./iconBundles');
  await import('./iconBundles');

  expect(iconifyMocks.addCollection).toHaveBeenCalledTimes(2);
});

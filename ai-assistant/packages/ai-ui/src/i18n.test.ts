import { createInstance } from 'i18next';
import { beforeEach, expect, it, vi } from 'vitest';

interface I18nMock {
  isInitialized: boolean;
  use: ReturnType<typeof vi.fn>;
  init: ReturnType<typeof vi.fn>;
}

async function loadInitializer(mock: I18nMock) {
  vi.doMock('i18next', () => ({ default: mock }));
  vi.doMock('react-i18next', () => ({ initReactI18next: { type: '3rdParty' } }));
  return import('./i18n');
}

function createI18nMock(isInitialized = false): I18nMock {
  const mock: I18nMock = {
    isInitialized,
    use: vi.fn(),
    init: vi.fn(async () => undefined),
  };
  mock.use.mockReturnValue(mock);
  return mock;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

it('resolves immediately when i18next is already initialized', async () => {
  const i18n = createI18nMock(true);
  const { initAiUiI18n } = await loadInitializer(i18n);

  await expect(initAiUiI18n()).resolves.toBeUndefined();
  expect(i18n.use).not.toHaveBeenCalled();
  expect(i18n.init).not.toHaveBeenCalled();
});

it('shares one correctly configured initialization across concurrent callers', async () => {
  let finishInitialization: () => void = () => undefined;
  const i18n = createI18nMock();
  i18n.init.mockImplementation(
    () =>
      new Promise<void>(resolve => {
        finishInitialization = resolve;
      })
  );
  const { initAiUiI18n } = await loadInitializer(i18n);

  const first = initAiUiI18n();
  const second = initAiUiI18n();

  expect(first).toBe(second);
  expect(i18n.use).toHaveBeenCalledOnce();
  expect(i18n.init).toHaveBeenCalledWith({
    initImmediate: false,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    defaultNS: 'translation',
    resources: {},
  });

  finishInitialization();
  await expect(first).resolves.toBeUndefined();

  i18n.isInitialized = true;
  await expect(initAiUiI18n()).resolves.toBeUndefined();
  expect(i18n.use).toHaveBeenCalledOnce();
});

it('allows initialization to retry after a failure', async () => {
  const failure = new Error('initialization failed');
  const i18n = createI18nMock();
  i18n.init.mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
  const { initAiUiI18n } = await loadInitializer(i18n);

  await expect(initAiUiI18n()).rejects.toBe(failure);
  await expect(initAiUiI18n()).resolves.toBeUndefined();

  expect(i18n.use).toHaveBeenCalledTimes(2);
  expect(i18n.init).toHaveBeenCalledTimes(2);
});

it('configures real i18next interpolation', async () => {
  const instance = createInstance();
  vi.doMock('i18next', () => ({ default: instance }));
  vi.doMock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: vi.fn() } }));
  const { initAiUiI18n } = await import('./i18n');

  const initialization = initAiUiI18n();

  expect(instance.t('Configure {{provider}}', { provider: 'GitHub Copilot' })).toBe(
    'Configure GitHub Copilot'
  );
  await initialization;
});

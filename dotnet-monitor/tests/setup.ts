class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

const windowShim = globalThis as any;
const documentShim = {
  head: {
    appendChild: () => {},
    removeChild: () => {},
  },
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {},
    remove: () => {},
    click: () => {},
    style: {},
  }),
  querySelector: () => null,
  addEventListener: () => {},
  removeEventListener: () => {},
};

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});

windowShim.window = windowShim as typeof windowShim;
windowShim.addEventListener = () => {};
windowShim.removeEventListener = () => {};
windowShim.document = documentShim;
windowShim.headlampBaseUrl = '';
windowShim.location = {
  pathname: '/c/default',
  hash: '',
};

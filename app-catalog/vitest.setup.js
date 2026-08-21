import '@testing-library/jest-dom/vitest';

Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null,
    clear: () => null,
  },
  writable: true,
});

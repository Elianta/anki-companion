import { beforeEach, describe, expect, it, vi } from 'vitest';

let useSessionStore: (typeof import('./session'))['useSessionStore'];

describe('session store', () => {
  const storage = new Map<string, string>();

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });
    storage.clear();
    vi.resetModules();
    ({ useSessionStore } = await import('./session'));
  });

  it('defaults language to EN when there is no saved selection', () => {
    expect(useSessionStore.getState().language).toBe('EN');
  });

  it('restores saved language from localStorage', async () => {
    localStorage.setItem('anki-session-language', 'PL');

    vi.resetModules();
    const { useSessionStore: restoredStore } = await import('./session');
    expect(restoredStore.getState().language).toBe('PL');
  });

  it('persists language changes', () => {
    useSessionStore.getState().setLanguage('PL');

    expect(localStorage.getItem('anki-session-language')).toBe('PL');
    expect(useSessionStore.getState().language).toBe('PL');
  });

  it('defaults to EN when the saved language is unsupported', async () => {
    localStorage.setItem('anki-session-language', 'DE');
    vi.resetModules();
    const { useSessionStore: restoredStore } = await import('./session');

    expect(restoredStore.getState().language).toBe('EN');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { createSessionSnapshot, useSessionStore } from './session';

describe('session store', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
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
    useSessionStore.setState(createSessionSnapshot());
  });

  it('defaults language to EN when there is no saved selection', () => {
    expect(createSessionSnapshot().language).toBe('EN');
  });

  it('restores saved language from localStorage', () => {
    localStorage.setItem('anki-session-language', 'PL');

    expect(createSessionSnapshot().language).toBe('PL');
  });

  it('persists language changes', () => {
    useSessionStore.getState().setLanguage('PL');

    expect(localStorage.getItem('anki-session-language')).toBe('PL');
    expect(useSessionStore.getState().language).toBe('PL');
  });

  it('reset clears term and senses but keeps the saved language', () => {
    useSessionStore.setState({
      term: 'focus',
      language: 'PL',
      senses: [{ id: 'sense-1', translationRU: 'fokus' }],
    });
    localStorage.setItem('anki-session-language', 'PL');

    useSessionStore.getState().reset();

    expect(useSessionStore.getState()).toMatchObject({
      term: '',
      language: 'PL',
      senses: [],
    });
  });
});

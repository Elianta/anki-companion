import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { afterEach } from 'vitest';

if (!globalThis.indexedDB) {
  globalThis.indexedDB = indexedDB as unknown as IDBFactory;
}

if (!globalThis.IDBKeyRange) {
  globalThis.IDBKeyRange = IDBKeyRange as unknown as typeof globalThis.IDBKeyRange;
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}

if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

configure({ testIdAttribute: 'data-test-id' });

afterEach(() => {
  cleanup();
});

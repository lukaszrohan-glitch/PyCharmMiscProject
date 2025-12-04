import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// jest-axe matchers are only required in accessibility suites; guard optional load
if (import.meta.env?.VITE_ENABLE_AXE === 'true') {
  import('jest-axe').then(({ toHaveNoViolations }) => {
    expect.extend({ toHaveNoViolations })
  }).catch((err) => {
    if (import.meta.env?.MODE === 'development') {
      console.warn('jest-axe matchers unavailable, skipping', err)
    }
  })
}

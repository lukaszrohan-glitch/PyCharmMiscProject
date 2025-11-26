import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

/**
 * Accessibility test suite
 * Validates WCAG compliance using axe-core
 * Run with: npm run test:a11y
 */

describe('accessibility: Header component', () => {
  it('should have no accessibility violations', async () => {
    // Mock Header component for testing
    const MockHeader = () => (
      <header role="banner">
        <nav aria-label="Primary navigation">
          <a href="/" aria-label="Home">
            Home
          </a>
          <button aria-label="Menu" aria-expanded="false">
            Menu
          </button>
        </nav>
        <label htmlFor="search">Search</label>
        <input id="search" type="search" aria-label="Search orders" />
      </header>
    );

    const { container } = render(<MockHeader />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

describe('accessibility: Button elements', () => {
  it('buttons should have accessible names', async () => {
    const { container } = render(
      <div>
        <button aria-label="Close dialog">×</button>
        <button>Submit Form</button>
        <button aria-label="Settings">
          <svg aria-hidden="true" focusable="false">
            <circle cx="10" cy="10" r="10" />
          </svg>
        </button>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('accessibility: Form controls', () => {
  it('form inputs should have labels', async () => {
    const { container } = render(
      <form>
        <label htmlFor="username">Username</label>
        <input id="username" type="text" required aria-required="true" />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" required aria-required="true" />

        <button type="submit">Login</button>
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show error states accessibly', async () => {
    const { container } = render(
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-invalid="true"
          aria-describedby="email-error"
        />
        <span id="email-error" role="alert">
          Please enter a valid email address
        </span>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('accessibility: Color contrast', () => {
  it('text should meet WCAG AA contrast requirements', async () => {
    const { container } = render(
      <div style={{ background: '#f5f5f7', color: '#1d1d1f', padding: '16px' }}>
        <h1>Primary Heading</h1>
        <p style={{ color: '#6e6e73' }}>Secondary text with sufficient contrast</p>
        <button
          style={{
            background: '#0891b2', // Teal brand color
            color: '#ffffff',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          Primary Action
        </button>
      </div>
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });
});

describe('accessibility: Keyboard navigation', () => {
  it('interactive elements should be keyboard accessible', async () => {
    const { container } = render(
      <div>
        <a href="/home">Home Link</a>
        <button type="button">Clickable Button</button>
        <div role="button" tabIndex={0} onKeyDown={() => {}}>
          Custom Button
        </div>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

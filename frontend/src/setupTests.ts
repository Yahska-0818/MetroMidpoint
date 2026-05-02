import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as React from 'react';


Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});


vi.mock('web-haptics/react', () => ({
  useWebHaptics: () => ({ trigger: vi.fn() })
}));


Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  geolocation: {
    getCurrentPosition: vi.fn(),
  }
});


vi.mock("framer-motion", () => {
  const customMotion = new Proxy({}, {
    get: (_, domElement) => {
      return React.forwardRef((props: Record<string, unknown>, ref) => {
        const rest = { ...props };
        delete rest.initial;
        delete rest.animate;
        delete rest.exit;
        delete rest.transition;
        delete rest.variants;
        delete rest.whileHover;
        delete rest.whileTap;
        delete rest.layoutId;
        delete rest.layout;
        return React.createElement(domElement as string, { ref, ...rest });
      });
    }
  });

  return {
    motion: customMotion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

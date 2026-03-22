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
      return React.forwardRef((props: any, ref) => {
        const {
          initial, animate, exit, transition, variants, whileHover, whileTap, layoutId, layout,
          ...rest
        } = props;
        return React.createElement(domElement as string, { ref, ...rest });
      });
    }
  });

  return {
    motion: customMotion,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

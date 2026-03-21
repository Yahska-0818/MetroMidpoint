# Frontend Code Architecture & Deep Dive

This directory contains the React SPA frontend for MetroMidpoint. It manages complex user interactions, handles asynchronous parallel queries against the backend API, and delivers a stunning "liquid glass" visual experience.

## 1. Technologies & Build System

- **Bun & Vite**: The project uses Bun as its package manager and runtime, achieving lightning-fast dependency resolution. Vite provides instantaneous Hot Module Replacement (HMR) and bundles the app for production.
- **Language**: TypeScript (`.tsx`).
- **Styling**: **Tailwind CSS v4** provides utility classes. The design heavily relies on the `backdrop-blur` utilities to achieve a translucent "frosted glass" look over an animated background.
- **State & Data Fetching**: `@tanstack/react-query` is the core mechanism for handling asynchronous state. It abstracts away loading states, error handling, caching, and retries.
- **Animations**: `framer-motion` handles spring physics for component enter/exit animations, as well as complex shared-layout animations (like the floating tab selector pill).
- **Haptics**: `web-haptics/react` is used to trigger satisfying device vibrations on user interactions, giving tactile feedback analogous to a native mobile app.

## 2. API Integration (`requests.ts`)

All communication with the Python backend is abstracted into typed asynchronous functions in `requests.ts`:
- **`getStations`**: Fetches the global list of valid DMRC stations.
- **`findMeetupInfo`**: Takes an array of strings (the N starting stations) and POSTs to `/find-midpoint` to calculate the fairest middle ground.
- **`fetchRouteInfo`**: Calls `/route` with a `source`, `destination`, and an `optimize` parameter (`fastest` vs `fewest_interchanges`).
- **`getNearestStation`**: Calls the backend Haversine endpoint using coords from the browser's Geolocation API.

## 3. Core Component Architecture

The application is structured into clearly separated React components handling distinct parts of the UX flow.

### `App.tsx` (The Application Shell)
The root file acts as the primary layout and view router.
- **Background Orbs**: Manages three absolutely-positioned `<div className="orb ...">` elements. In CSS, these orbs have infinite `keyframes` animating their translation and scaling to create an atmospheric, shifting gradient background.
- **Glassmorphism Base**: Main content is wrapped in a large `<main className="glassCard">`. Because the orbs move underneath, the `backdrop-blur-3xl` class mathematically diffuses the light through the div, simulating frosted glass.
- **View Toggling**: A floating pill `<nav>` toggles `activeTab` between `'meetup'` and `'route'`. It uses Framer Motion's `layoutId="bubble"` on an absolute 100% layer inside the selected button to create a fluid, sliding active-state highlight. This mimics Apple's signature native segment controls.
- **Theme Handling**: Renders a global sun/moon icon floating at the top-right to toggle a `.dark` class on the `<html>` root natively.

### `StationInput.tsx` (Multi-user Meetup Inputs)
This component dynamically renders a list of `source` inputs for a group of commuters.
- **Geolocation Integration**: On the very first input (index 0), focusing the field surfaces an animated "Nearest" button.
  - Clicking this triggers `navigator.geolocation.getCurrentPosition`.
  - While fetching coords, a mini tailwind-CSS spinner runs inside the button.
  - Once coords are retrieved, `getNearestStation` is called, and the input auto-fills with the DMRC name.
- **Dynamic Fields**: Users can add or remove station inputs up to an arbitrary limit. All lists are bound to a `<datalist>` populated by the `stations` array, giving native predictive autocomplete typing.
  - The submit button handles an array filtering step (`filter(s => s.trim())`) to discard empty fields before calling `mutate()`.

### `RouteVisualizer.tsx` (Advanced Route Planner)
The dual-route A-to-B planner component.
- **Parallel Mutations**: When the user clicks "Find Route", we trigger two React Query mutations simultaneously:
  - `fastestMutation.mutate()`
  - `leastInterchangeMutation.mutate()`
- **Dual-View Toggle**: If both queries succeed, the component checks if the paths are mathematically identical.
  - If identical: Renders a "Both routes are identical for this journey" message overlay.
  - If different: Plugs a nested Apple-style glass pill specifically into the results header to let the user swipe between "Fastest" and "Fewest Changes".
- **Dynamic Badges**: The toggle buttons run inline delta calculations. If the fewest-changes route has -1 interchange compared to the fastest, it renders a bold green `-1` badge. If the fastest route is 8 minutes quicker, it renders a blue `-8m` badge.
- **Haptic Sequencing**: The success callback of the API queries uses `trigger([{duration: 30}, {delay: 60, duration: 40}])` to fire a double-tap vibration natively.

### `RouteDisplay.tsx` (Midpoint Result Visualizer)
Renders the output of `findMeetupInfo`.
- **Staggered Animations**: Uses a `variants` object mapping `{ hidden, show }` states fed into Framer Motion. The parent container uses `staggerChildren: 0.1` so that each person's specific journey to the midpoint fades and springs up sequentially.

### `TransitTimeline.tsx` (Journey Grapher)
Receives an array of `RouteStep` items (station names and line identifiers).
- **Line Colors (`utils/colors.ts`)**: The DMRC has complex line structures (e.g., "Pink Branch", "Magenta", "Airport Express"). The mapper in `colors.ts` exposes raw hex strings.
- **Rendering Logic**: Maps over the array. Between $Node^i$ and $Node^{i+1}$, it looks at the `line` property and assigns that hex color to a fixed-width `div`. If the line changes (i.e. an interchange occurs), it renders an open circle. If it's a straight travel path, it renders a colored connecting line. The final stop is explicitly branded with a green pin icon.

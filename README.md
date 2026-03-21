# MetroMidpoint 

Try it out [here](https://metromidpoint-production.up.railway.app/)

MetroMidpoint is an intelligent transit application for the Delhi Metro ecosystem. It solves the common problem of friends or colleagues spread across the city trying to find the "fairest" meeting point. By leveraging graph mathematics and a custom Machine Learning model trained on real-time DMRC data, MetroMidpoint calculates the optimal intersection station that minimizes the maximum travel time for everyone involved.

In addition to the meetup finder, the app includes a robust dual-mode Route Planner (fastest vs. fewest interchanges) with an Apple-inspired "liquid glass" UI.

---

## Features Highlight

- **Optimal Meetup Finder:** Enter 2 to *N* starting stations, and the app calculates the optimal midpoint minimizing maximum travel time, overall travel time, and total interchanges.
- **Advanced Route Planner:** Compare the *Fastest* route against the *Fewest Interchanges* route tailored to your journey.
- **Machine Learning Predictions:** A `VotingRegressor` ensemble model (Gradient Boosting, Random Forest) predicts accurate travel times using 17 engineered features (interchange densities, long-route flags, centrality).
- **Geolocation-aware:** A "Nearest" station button instantly fills in your source station based on your GPS coordinates.
- **Liquid Glass Interface:** A stunning translucent UI featuring animated atmospheric orbs, backdrop-blur frosting, and layout-animated glass pills running on Framer Motion.
- **Dark & Light Mode:** Fully adaptive theming with carefully polished contrast ratios.
- **Haptic Feedback:** Tactile experiences powered by `web-haptics` on supported devices.

---

## System Architecture

The project is split into a robust **Python (FastAPI)** backend and a blazing-fast **React + Vite** frontend, built using **Bun**.

### Frontend Details (`/frontend`)

The frontend is a React SPA completely styled from scratch using Tailwind CSS v4 and Framer Motion.

**Core Libraries:**
- **Vite & Bun:** Blazing fast development server and package management.
- **React & `@tanstack/react-query`:** For declarative UI components, powerful data fetching, caching, parallel queries, and loading state management.
- **Framer Motion:** For layout animations (e.g., the liquid floating tab bubble) and enter/exit spring animations.
- **Web-Haptics:** To trigger distinct device vibrations for interaction success, error, and navigation.

**Key Components:**
- **`App.tsx`:** The root layout shell. Renders the animated `Orbs`, the global dark/light mode toggle, the dynamic root `glassCard`, and the floating `tab-indicator` pill to switch between "Find Meetup" and "Route Planner".
- **`StationInput.tsx`:** Handles dynamic additions and removals of station inputs for the Meetup Finder. Integrates the Geolocation "Nearest" pill using `AnimatePresence`.
- **`RouteDisplay.tsx`:** Presents the calculated midpoint results from the ML backend. Displays each person's route and fare in a staggered animation grid.
- **`RouteVisualizer.tsx`:** The dual-route planner. Dispatches parallel mutations to the backend and elegantly toggles between the Fastest route and Fewest Interchanges route using a nested layout-animated bubble.
- **`TransitTimeline.tsx`:** Visually renders the step-by-step metro journey. Employs inline hex colors fetched from `utils/colors.ts` to guarantee accurate line badge rendering avoiding Tailwind purging conflicts.

---

## Backend Details (`/backend`)

The Python backend is powered by FastAPI and combines network graph intelligence with Machine Learning.

**Core Modules:**
- **`main.py`:** The FastAPI entry point. Dispatches routes (`/route?optimize=fastest`, `/find-midpoint`, `/nearest-station`) to the algorithm service and mounts the compiled frontend static files for production delivery.
- **`algorithm_service.py`:** The brain of the API.
  - Generates the 17-feature vector for inferences via `_build_features`.
  - Runs on-demand `nx.dijkstra_path` with an interchange penalty weight (+10,000) for the *Fewest Interchanges* route.
  - Iterates over the precomputed all-pairs-shortest-paths to test potential midpoints against start stations, balancing `centrality` and ML-predicted time combinations.
- **`graph_loader.py`:** Loads the `metro_data.csv` dataset, parsing stations, lines, and physical distances to build the `networkx` graph. Uses MD5 hashing to cache the `graph.pkl` for instant server reboots.
- **`fare_service.py`:** Calculates dynamic DMRC tier-based pricing based on precise travel distances across edges.
- **`train_model.py`:** The ML pipeline script. Ingests raw trip data, cleans outliers using quartile-cutoff rules, engineers 17 features, and trains a `VotingRegressor` (encapsulating `HistGradientBoosting`, `RandomForest`, and standard `GradientBoosting`). Outputs `model.pkl` and a strict 5-Fold Cross Validated MAE score.
- **`gtfs_parser.py`:** A dynamic GTFS ingestion tool to calculate accurate historical section travel weights if a GTFS data directory is supplied to the `GraphLoader`.
- **`dmrc_data_collector.py` & `station_code_builder.py`:** Scrapers to query the official DMRC API using randomized Monte-Carlo station pairing approaches. This builds the foundational `dmrc_training_data.csv` mapping distance/interchange combinations to real-world minutes.

---

## Getting Started

### Prerequisites
- Python 3.10+
- [Bun](https://bun.sh/) (Frontend runtime and package manager)

### 1. Start the Backend
```bash
cd backend

# Create a virtual environment & install requirements
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start the FastAPI Server
fastapi dev main.py
```
> The API will be running on `http://127.0.0.1:8000`

### 2. Start the Frontend
```bash
cd frontend

# Install all dependencies with Bun
bun install

# Run the Vite Dev Server
bun run dev
```
> The UI will instantly boot up at `http://localhost:5173`

---

## Project Structure

```text
MetroMidpoint/
├── frontend/
│   ├── index.html                 # Vite entrypoint with injected fonts
│   ├── package.json               # Bun dependencies (Tailwind, Framer Motion)
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx               # React root renderer
│       ├── App.tsx                # Shell, theming, glass UI architecture
│       ├── index.css              # Global styles & Orb keyframes
│       ├── requests.ts            # Fetch abstractions mapping to API endpoints
│       ├── types.ts               # Shared TypeScript schemas
│       ├── components/            # Visual react elements:
│       │   ├── RouteDisplay.tsx   # Midpoint results UI
│       │   ├── RouteVisualizer.tsx# Dual-route comparison UI
│       │   ├── StationInput.tsx   # Multi-user GPS-inferred input UI
│       │   └── TransitTimeline    # Colored journey visualisation
│       └── utils/
│           └── colors.ts          # DMRC hex color map registry
│
└── backend/
    ├── requirements.txt           # Python dependencies
    ├── main.py                    # FastApi core router
    ├── models.py                  # Pydantic validation shapes
    ├── algorithm_service.py       # ML inferences & nx pathfinding
    ├── graph_loader.py            # Initial network topology grapher
    ├── fare_service.py            # Travel ticketing slab engine
    ├── train_model.py             # Feature engineering & VotingRegressor generator
    └── Scraper Utils:
        ├── dmrc_data_collector.py     # Training data fetcher
        ├── gtfs_parser.py             # Optional transit timing ingestion
        └── station_code_builder.py    # DMRC id normalization
```

---

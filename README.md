---

# MetroMidpoint

**MetroMidpoint** is a high-performance, graph-based transit optimization engine that computes the optimal meeting point for multiple participants across a subway network.

It formalizes a real-world coordination problem as a **minimax optimization problem on weighted graphs**, delivering instant results through aggressive precomputation and deterministic decision strategies.

This project demonstrates applied system design, graph theory, and full-stack engineering at scale.

---

## Problem Statement

Given *N participants* located at different transit stations:

> Find a meeting station that minimizes the **maximum travel time** for any participant.

This is a **minimax optimization problem**, commonly seen in distributed systems, networking, and load balancing.

---

## Key Highlights

* **Minimax Optimization Engine** for multi-user coordination
* **O(1) query resolution** via precomputation
* **Deterministic tie-breaking** for consistent outputs
* **Service-Oriented Architecture (SOA)**
* **Production-ready deployment with Docker**
* **GTFS-compatible for real-world transit data**

---

## Features

### Multi-Participant Meetup Optimization

* Computes optimal meeting node using:

  * Minimize maximum travel time (primary objective)
  * Tie-breaking via:

    * Degree centrality (network importance)
    * Total travel time (efficiency)
    * Interchange count (user comfort)
* Scales from **2 to N participants**

---

### Point-to-Point Routing

* Shortest path computation using precomputed results
* Returns:

  * Step-by-step route
  * Travel time
  * Interchange breakdown
  * Fare estimation

---

### O(1) Query Performance

* Precomputes **all-pairs shortest paths** using repeated Dijkstra
* Stores results in memory
* Eliminates runtime graph traversal

**Trade-off:**

* Higher memory usage
* Near-instant response latency

---

### Geolocation Mapping

* Converts GPS coordinates → nearest station
* Uses **Haversine distance calculation**

---

### Progressive Web App (PWA)

* Installable on mobile
* Offline support
* Native-like UX
* Haptic feedback integration

---

### GTFS Compatibility

* Plug-and-play support for official transit datasets
* Enables:

  * Real train schedules
  * Accurate dwell times
  * Realistic edge weights

---

## Tech Stack

### Frontend

* React 18 (TypeScript)
* Vite + Bun
* Tailwind CSS
* TanStack Query
* Web Haptics API

### Backend

* Python 3.12
* FastAPI
* NetworkX
* Pandas
* Uvicorn

### Infrastructure

* Docker (multi-stage build)
* Single-container deployment

---

## System Design

### High-Level Architecture

```
                ┌──────────────────────┐
                │      Frontend        │
                │  React + TanStack    │
                └─────────┬────────────┘
                          │ HTTP API
                          ▼
                ┌──────────────────────┐
                │      FastAPI         │
                │   (API Gateway)      │
                └─────────┬────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Graph Loader │  │ Algorithm    │  │ Fare Service │
│              │  │ Service      │  │              │
│ CSV / GTFS   │  │ Minimax +    │  │ Distance →   │
│ → Graph      │  │ Lookup       │  │ Fare Mapping │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                          ▼
                ┌──────────────────────┐
                │ Precomputed Store    │
                │ (In-Memory Dicts)    │
                └──────────────────────┘
```

---

### Data Flow

1. **Startup Phase**

   * Load CSV / GTFS data
   * Build graph
   * Inject interchange edges
   * Run Dijkstra from all nodes
   * Store results in memory

2. **Query Phase**

   * API receives request
   * Direct dictionary lookup
   * Apply minimax + tie-breaking
   * Return response

---

### Core Algorithm

#### Objective Function

Minimize:

```
max(distance(user_i → candidate_station))
```

#### Tie-Breaking Priority

1. Degree centrality (higher is better)
2. Total travel time (lower is better)
3. Interchange count (lower is better)

---

### Complexity

| Operation              | Time Complexity  |
| ---------------------- | ---------------- |
| Precomputation         | O(V * (E log V)) |
| Query (midpoint/route) | O(1)             |
| Memory Usage           | O(V²)            |

---

## Why This Design Matters

* Converts a traditionally expensive graph problem into **constant-time queries**
* Demonstrates **precomputation vs runtime trade-offs**
* Mimics real-world systems like:

  * Google Maps routing caches
  * CDN edge precomputation
  * Ride-sharing optimization engines

---

## Installation

### Prerequisites

* Docker

### Run Locally

```bash
git clone https://github.com/yourusername/metromidpoint.git
cd metromidpoint

docker build -t metromidpoint .
docker run -p 8000:8000 metromidpoint
```

---

## API Reference

### POST `/find-midpoint`

```json
{
  "stations": ["Station A", "Station B", "Station C"]
}
```

Returns:

* Optimal meeting station
* Individual routes
* Travel times

---

### POST `/route`

```json
{
  "source": "Station A",
  "destination": "Station B"
}
```

Returns:

* Shortest path
* Travel time
* Fare estimate
* Interchanges

---

### GET `/nearest-station`

```
/nearest-station?lat=28.61&lon=77.23
```

Returns:

* Closest station node

---

## Roadmap

### Multi-City Support

* Plug-and-play datasets
* Runtime city switching

### Real-Time Updates

* Integrate delay APIs
* Dynamic edge weight adjustment

### Interactive Maps

* Leaflet / MapLibre integration
* Route visualization with polylines

### Scalability Enhancements

* Redis caching layer
* Graph partitioning for large cities
* Microservice separation

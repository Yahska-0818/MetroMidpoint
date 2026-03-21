# Backend Code Architecture & Deep Dive

This directory contains the FastAPI backend that powers MetroMidpoint. It handles graph traversal, machine learning-based time predictions, and dynamic routing calculations.

## 1. Bootstrapping & Graph Initialization

The core of the system relies on a mathematical graph representation of the Delhi Metro network.

- **`graph_loader.py`**: Reads `metro_data.csv` to build a `networkx.Graph`. Nodes represent stations, and edges represent either physical travel (`type="travel"`) between adjacent stations or walking paths between line changes (`type="interchange"`).
- **Caching Mechanism**: Constructing the graph and (optional) parsing GTFS data is slow. The `GraphLoader` calculates an MD5 hash of the CSV file. If the hash matches `graph_hash.txt`, it loads the binary graph from `graph.pkl` instead of rebuilding it, drastically reducing backend startup time.

## 2. API Endpoints (`main.py`)

The `main.py` entry point defines the REST API:
- `GET /stations`: Returns an alphabetical list of all nodes.
- `GET /nearest-station?lat=&lng=`: Uses the Haversine formula against `metro_data.csv` lat/lng columns to return the closest station to the user's GPS coordinates.
- `POST /route`: Computes point-to-point routing. Accepts an `optimize` query parameter (`fastest` or `fewest_interchanges`).
- `POST /find-midpoint`: Calculates the optimal meeting point for a list of starting stations.

## 3. The Algorithm Service (`algorithm_service.py`)

This class holds the primary business logic. On initialization, it runs a heavy computation: `self._precompute_all_paths()`. It uses `nx.all_pairs_dijkstra_path` so that shortest path lookups later are $O(1)$ operations in memory, avoiding redundant shortest-path calculations.

### Meetup Calculation (`find_best_midpoint`)
To find the fairest midpoint for $N$ users:
1. Identify all reachable nodes from all people's starting stations.
2. For every valid station $x$:
   - Calculate the paths from all users' starting stations to $x$.
   - Feed the path details (distance, station count, interchange count) into the ML model (`_build_features` to `_predict_time`) to get accurate travel times.
   - Calculate metrics for $x$:
     - `max_time`: The maximum time anyone has to travel (Minimizing this is the primary goal; it ensures fairness).
     - `total_time`: The sum of everyone's travel time (Tie-breaker 1).
     - `max_interchanges`: The maximum line changes anyone has to make (Tie-breaker 2).
     - `centrality`: The network degree centrality of station $x$. Highly connected hub stations are favored slightly over end-of-line stations.
3. Sort all nodes by a composite scoring tuple and return the best one.

### Routing Options
- **Fastest Route (`get_route_details`)**: Reads from the precomputed $O(1)$ all-pairs shortest path dictionary.
- **Fewest Interchanges (`get_route_details_least_interchanges`)**: Runs Dijkstra's algorithm *on demand*. It uses a custom `weight` function that returns `10_000 + data["weight"]` if an edge is an interchange. This aggressively forces the pathfinder to minimize line changes, breaking ties with normal travel time.

## 4. Machine Learning & Time Prediction

Static distance mathematics don't accurately model how long metro rides take (due to dwell times, walking time between different interchange complexities, etc).

- **`train_model.py`**: The training script.
  - Cleans outliers using Interquartile Range (IQR) on `distance / stations` ratios.
  - Engineers 17 advanced features from raw trip data: `log_distance`, `interchange_density`, polynomial cross features (`distance * interchanges`), and route length classification flags (`is_very_long_route`).
  - Implements a scikit-learn `VotingRegressor` ensemble averaging a `HistGradientBoostingRegressor` (weight 3), `GradientBoostingRegressor` (weight 2), and `RandomForestRegressor` (weight 1).
  - Evaluates via 5-Fold Cross Validation (delivering ~3.5 min MAE accuracy).
  - Outputs `model.pkl` and `feature_names.pkl`.
- **`algorithm_service.py` (`_predict_time`)**: Loads the pickled model into memory and constructs the exact 17-feature vector to infer true travel duration for constructed paths in real time.

## 5. Data Collection Utilities

The backend contains scrapers used to build the training dataset (`dmrc_training_data.csv`).
- **`station_code_builder.py`**: Scrapes internal numeric IDs from the DMRC website forms, mapping node names to API codes.
- **`dmrc_data_collector.py`**: Randomly samples station pairs and fires requests to DMRC's internal routing API. It extracts true predicted travel times and merges them against the graph's physical distance to generate ML training rows.
- **`gtfs_parser.py`**: Functionality that can ingest standard GTFS transit zips to extract time deltas between `stop_times.txt` rows, refining the static graph edge weights with real timetable data.

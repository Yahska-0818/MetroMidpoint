import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import (
    HistGradientBoostingRegressor,
    RandomForestRegressor,
    VotingRegressor,
    GradientBoostingRegressor,
)
from sklearn.model_selection import KFold, cross_val_score, GridSearchCV
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import RobustScaler
from sklearn.pipeline import Pipeline

df = pd.read_csv("dmrc_training_data.csv")

df = df.dropna()

km_per_station_ratio = df["distance"] / df["stations"]
q_low = km_per_station_ratio.quantile(0.01)
q_high = km_per_station_ratio.quantile(0.99)
df = df[(km_per_station_ratio >= q_low) & (km_per_station_ratio <= q_high)]

df = df[df["time"] > 0]
df = df.reset_index(drop=True)

df["log_distance"] = np.log1p(df["distance"])
df["log_stations"] = np.log1p(df["stations"])
df["avg_station_dist"] = df["distance"] / df["stations"]
df["interchange_ratio"] = df["interchanges"] / df["stations"]
df["interchange_density"] = df["interchanges"] / np.maximum(df["distance"], 0.1)
df["distance_sq"] = df["distance"] ** 2
df["stations_sq"] = df["stations"] ** 2
df["dist_x_interchanges"] = df["distance"] * df["interchanges"]
df["stations_x_interchanges"] = df["stations"] * df["interchanges"]
df["is_short_route"] = (df["distance"] <= 5).astype(int)
df["is_long_route"] = (df["distance"] > 12).astype(int)
df["is_very_long_route"] = (df["distance"] > 30).astype(int)
df["graph_weight"] = (df["distance"] * 1.7) + (df["interchanges"] * 5.0)
df["effective_stations"] = df["stations"] + (df["interchanges"] * 1.5)

features = [
    "stations",
    "distance",
    "interchanges",
    "log_distance",
    "log_stations",
    "avg_station_dist",
    "interchange_ratio",
    "interchange_density",
    "distance_sq",
    "stations_sq",
    "dist_x_interchanges",
    "stations_x_interchanges",
    "is_short_route",
    "is_long_route",
    "is_very_long_route",
    "graph_weight",
    "effective_stations",
]

X = df[features]
y = df["time"]

hgb = HistGradientBoostingRegressor(
    max_iter=800,
    max_depth=8,
    learning_rate=0.04,
    min_samples_leaf=3,
    l2_regularization=0.1,
    random_state=42,
)

rf = RandomForestRegressor(
    n_estimators=400,
    max_depth=12,
    min_samples_leaf=2,
    max_features=0.6,
    random_state=42,
    n_jobs=-1,
)

gb = GradientBoostingRegressor(
    n_estimators=400,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.85,
    min_samples_leaf=3,
    random_state=42,
)

ensemble = VotingRegressor(
    estimators=[("hgb", hgb), ("rf", rf), ("gb", gb)],
    weights=[3, 1, 2],
    n_jobs=-1,
)

cv = KFold(n_splits=5, shuffle=True, random_state=42)
cv_maes = cross_val_score(ensemble, X, y, cv=cv, scoring="neg_mean_absolute_error", n_jobs=-1)
cv_r2s = cross_val_score(ensemble, X, y, cv=cv, scoring="r2", n_jobs=-1)

print(f"5-Fold CV MAE:  {-cv_maes.mean():.3f} ± {cv_maes.std():.3f} minutes")
print(f"5-Fold CV R²:   {cv_r2s.mean():.4f} ± {cv_r2s.std():.4f}")

ensemble.fit(X, y)

print(f"\nTraining samples used: {len(df)}")
train_preds = ensemble.predict(X)
print(f"Train MAE: {mean_absolute_error(y, train_preds):.3f} minutes")
print(f"Train R²:  {r2_score(y, train_preds):.4f}")

with open("model.pkl", "wb") as f:
    pickle.dump(ensemble, f)

with open("feature_names.pkl", "wb") as f:
    pickle.dump(features, f)

print("\nModel saved to model.pkl")
print("Feature names saved to feature_names.pkl")

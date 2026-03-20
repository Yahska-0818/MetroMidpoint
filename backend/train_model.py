import pandas as pd
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import pickle

timeData = pd.read_csv("dmrc_training_data.csv")

timeData["log_distance"] = np.log1p(timeData["distance"])
timeData["avg_station_dist"] = timeData["distance"] / timeData["stations"]
timeData["interchange_ratio"] = timeData["interchanges"] / timeData["stations"]

timeData["is_long_route"] = (timeData["distance"] > 12).astype(int)

timeData["graph_weight"] = (timeData["distance"] * 1.7) + (
    timeData["interchanges"] * 5.0
)

timeData = timeData.drop(["destination", "source", "distance"], axis=1)

features = [
    "stations",
    "log_distance",
    "interchanges",
    "avg_station_dist",
    "interchange_ratio",
    "is_long_route",
    "graph_weight",
]
X = timeData[features]
y = timeData["time"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = HistGradientBoostingRegressor(
    max_iter=500, max_depth=10, learning_rate=0.05, min_samples_leaf=4, random_state=42
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print(f"Mean Absolute Error: {mae:.2f} minutes")
print(f"R2 Score: {r2:.4f}")

with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

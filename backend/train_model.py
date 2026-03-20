import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import pickle

timeData = pd.read_csv("dmrc_training_data.csv")
timeData["log_distance"] = np.log1p(timeData["distance"])
timeData = timeData.drop("destination", axis=1)
timeData = timeData.drop("source", axis=1)
timeData = timeData.drop("distance", axis=1)

features = ["stations", "log_distance", "interchanges"]
X = timeData[features]
y = timeData["time"]

model = LinearRegression()
model.fit(X, y)

print("Coefficients:", model.coef_)
print("Intercept:", model.intercept_)

with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

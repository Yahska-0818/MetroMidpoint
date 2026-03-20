import pandas as pd
from sklearn.linear_model import LinearRegression
import pickle

df = pd.read_csv("dmrc_training_data.csv")

X = df[["distance", "stations", "interchanges"]]
y = df["time"]

model = LinearRegression()
model.fit(X, y)

print("Coefficients:", model.coef_)
print("Intercept:", model.intercept_)

with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

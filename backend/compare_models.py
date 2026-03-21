import pandas as pd
import numpy as np
import pickle
from sklearn.metrics import mean_absolute_error, r2_score

def evaluate_predictions(y_true, y_pred, name):
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    errors = np.abs(y_true - y_pred)
    mean_error_pct = np.mean(errors / y_true) * 100
    
    print(f"--- {name} ---")
    print(f"Mean Absolute Error (MAE): {mae:.2f} minutes")
    print(f"Average Error Percentage:  {mean_error_pct:.1f}%")
    print(f"R² Score:                  {r2:.4f}")
    print()
    return mae, r2

def main():
    print("Loading test data...")
    df = pd.read_csv("dmrc_training_data.csv")
    df = df.dropna()
    df = df[df["time"] > 0].reset_index(drop=True)
    
    y_true = df["time"]

    df["heuristic_stations"] = (df["stations"] * 2.5) + (df["interchanges"] * 5.0)
    
    df["heuristic_distance"] = (df["distance"] * 1.7) + (df["interchanges"] * 5.0)
    
    print("Loading ML Model...")
    with open("model.pkl", "rb") as f:
        model = pickle.load(f)
    with open("feature_names.pkl", "rb") as f:
        feature_names = pickle.load(f)
    
    df["log_distance"] = np.log1p(df["distance"])
    df["log_stations"] = np.log1p(df["stations"])
    df["avg_station_dist"] = df["distance"] / np.maximum(df["stations"], 1)
    df["interchange_ratio"] = df["interchanges"] / np.maximum(df["stations"], 1)
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
    
    X = df[feature_names]
    df["ml_predictions"] = model.predict(X)

    print("\n" + "="*40)
    print("EVALUATION RESULTS (On 1000 routes)")
    print("="*40 + "\n")
    
    evaluate_predictions(y_true, df["heuristic_stations"], "Heuristic: 2.5 min/station + 5 min/interchange")
    evaluate_predictions(y_true, df["heuristic_distance"], "Heuristic: 1.7 min/km + 5 min/interchange")
    evaluate_predictions(y_true, df["ml_predictions"], "ML Model: 17-feature VotingRegressor")

    print("="*40)
    print("EDGE CASE COMPARISON (Long vs Short Routes)")
    print("="*40)
    
    short = df[(df["distance"] < 5) & (df["interchanges"] == 0)].iloc[0]
    print(f"\nShort route ({short['stations']} stations, {short['distance']} km):")
    print(f"Ground Truth Time: {short['time']:.1f} min")
    print(f"Heuristic (Dist):  {short['heuristic_distance']:.1f} min")
    print(f"ML Model:          {short['ml_predictions']:.1f} min")
    
    complex_route = df[df["interchanges"] >= 2].iloc[0]
    print(f"\nComplex route ({complex_route['stations']} stations, {complex_route['interchanges']} interchanges):")
    print(f"Ground Truth Time: {complex_route['time']:.1f} min")
    print(f"Heuristic (Dist):  {complex_route['heuristic_distance']:.1f} min")
    print(f"ML Model:          {complex_route['ml_predictions']:.1f} min")

if __name__ == "__main__":
    main()

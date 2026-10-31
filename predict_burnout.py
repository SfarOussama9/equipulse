import pandas as pd
import numpy as np
import joblib
from data1 import generate_clean_burnout_data

# 1. Generate "Live" Data (New Employees)
print("Generating 2000 new employee records (Live Data)...")
# We use the same generation logic, but we will DROP the target variable
# to simulate "We don't know their burnout yet"
df_new = generate_clean_burnout_data(2000, seed=None) # Use random seed for variety

# Keep the "Truth" for comparison later if we want, but for the 'app' we drop it
true_scores = df_new["Burnout_Score"].copy()
df_input = df_new.drop(columns=["Burnout_Score", "Attrition_Risk_Flag"], errors='ignore')

# 2. Load the Brain (Trained Model)
print("Loading AI Model...")
model = joblib.load("burnout_predictor_model.pkl")

# 3. Predict
print("Predicting Burnout Scores...")
# The model pipeline handles all the preprocessing (OneHotEncoding etc) automatically
predicted_scores = model.predict(df_input.drop(columns=["Employee_ID"]))

# 4. Create Final Dataset
df_final = df_input.copy()
df_final["Formula_Burnout_Score"] = true_scores # The "Ground Truth" from the script logic
df_final["Predicted_Burnout_Score"] = predicted_scores.round(2)

# Calculate the difference (Error)
df_final["Prediction_Error"] = (df_final["Predicted_Burnout_Score"] - df_final["Formula_Burnout_Score"]).round(2)

# Add a "Risk Level" based on prediction
df_final["Risk_Category"] = pd.cut(
    df_final["Predicted_Burnout_Score"], 
    bins=[0, 4, 7, 10], 
    labels=["Low", "Medium", "High"]
)

# 5. Save
filename = "live_employee_data_with_predictions_v2.csv"
df_final.to_csv(filename, index=False)

print(f"\nSuccess! Processed {len(df_final)} employees.")
print(f"Saved results to: {filename}")

# Show a sneak peek
print("\n--- PREDICTION VS FORMULA COMPARISON ---")
cols = ["Employee_ID", "Role", "Formula_Burnout_Score", "Predicted_Burnout_Score", "Prediction_Error"]
print(df_final[cols].head(15).to_string(index=False))

# Stats
mae = np.mean(np.abs(df_final["Prediction_Error"]))
print(f"\nMean Absolute Error: {mae:.3f}")
print("Note: Small errors are expected because the AI cannot see the random 'Manager Quality' or 'Daily Noise' variables.")

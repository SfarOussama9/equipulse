import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# 1. Load Data
print("Loading historical data...")
# Find the latest CSV file automatically
import glob
import os
list_of_files = glob.glob('burnout_data_clean_*.csv') 

if not list_of_files:
    print("❌ Error: No 'burnout_data_clean_*.csv' files found.")
    print("   Please run 'python data1.py' first to generate the dataset.")
    exit()
else:
    # Use the most recently created file
    latest_file = max(list_of_files, key=os.path.getctime)
    print(f"✅ Using latest dataset: {latest_file}")
    df = pd.read_csv(latest_file)

# 2. Preprocessing
# Define features and target
X = df.drop(columns=["Employee_ID", "Burnout_Score"])
y = df["Burnout_Score"]

# Identify categorical and numerical columns
categorical_cols = ["Department", "Role"]
numerical_cols = [col for col in X.columns if col not in categorical_cols]

print(f"Training on {len(df)} records...")

# Create a preprocessing pipeline
# OneHotEncode categorical variables, pass through numerical ones
preprocessor = ColumnTransformer(
    transformers=[
        ('num', 'passthrough', numerical_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
    ])

# 3. Define Model
# Random Forest is robust and good for this type of tabular data
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
])

# 4. Train & Validate
# Split for validation (80% train, 20% test) to check accuracy
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training validation model (80% of data)...")
model.fit(X_train, y_train)

# 5. Validate
preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)
r2 = r2_score(y_test, preds)

print(f"\nModel Performance:")
print(f"Mean Absolute Error: {mae:.3f} (On a 1-10 scale)")
print(f"R2 Score: {r2:.3f}")

# 6. Final Training (Scan ALL rows)
print("\nRetraining on FULL dataset (100% of records)...")
model.fit(X, y)

# 7. Save Model
joblib.dump(model, "burnout_predictor_model.pkl")
print("Model saved to 'burnout_predictor_model.pkl'")

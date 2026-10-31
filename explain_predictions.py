import pandas as pd
import numpy as np
import joblib
import shap
import matplotlib.pyplot as plt

# 1. Load Data and Model
print("Loading data and model...")
df = pd.read_csv("live_employee_data_with_predictions_v2.csv")
model = joblib.load("burnout_predictor_model.pkl")

# Prepare input data (drop non-feature columns)
X = df.drop(columns=["Employee_ID", "Burnout_Score", "Attrition_Risk_Flag", 
                     "Formula_Burnout_Score", "Predicted_Burnout_Score", 
                     "Prediction_Error", "Risk_Category"], errors='ignore')

# 2. Prepare SHAP Explainer
# SHAP needs the *transformed* data because our model has a pipeline (OneHotEncoder)
print("Preparing SHAP explainer...")

# Extract steps
preprocessor = model.named_steps['preprocessor']
regressor = model.named_steps['regressor']

# 3. Filter for High-Risk Employees FIRST (Optimization)
print("\n--- FILTERING FOR HIGH-RISK EMPLOYEES ---")
high_risk_df = df[df["Predicted_Burnout_Score"] > 7.5].copy()
print(f"Found {len(high_risk_df)} high-risk employees to explain.")

if len(high_risk_df) == 0:
    print("No high-risk employees found. Exiting.")
    exit()

# Prepare input data for ONLY high-risk employees
X_high_risk = high_risk_df.drop(columns=["Employee_ID", "Burnout_Score", "Attrition_Risk_Flag", 
                     "Formula_Burnout_Score", "Predicted_Burnout_Score", 
                     "Prediction_Error", "Risk_Category"], errors='ignore')

# Transform ONLY the high-risk data
print("Transforming data for high-risk group...")
X_transformed_subset = preprocessor.transform(X_high_risk)

# Get feature names
cat_names = preprocessor.named_transformers_['cat'].get_feature_names_out()
num_names = preprocessor.named_transformers_['num'].feature_names_in_
feature_names = np.r_[num_names, cat_names]

# Create Explainer (TreeExplainer is optimized for Random Forest)
# We use a subset of data (100 rows) to speed up the initialization if needed, 
# but for TreeExplainer with RF, we just pass the model.
print("Calculating SHAP values (this might still take a moment, but much faster)...")
explainer = shap.TreeExplainer(regressor)
shap_values = explainer.shap_values(X_transformed_subset)

results = []

# Iterate through the HIGH RISK subset
for i in range(len(high_risk_df)):
    emp_id = high_risk_df.iloc[i]["Employee_ID"]
    score = high_risk_df.iloc[i]["Predicted_Burnout_Score"]
    
    # Get SHAP values for this person (index i in the subset)
    emp_shap = shap_values[i]
    
    # Create a mini-dataframe to sort features by impact
    contribs = pd.DataFrame({
        'Feature': feature_names,
        'Impact': emp_shap
    })
    
    # Get Top 3 POSITIVE contributors (things increasing burnout)
    top_3 = contribs.sort_values('Impact', ascending=False).head(3)
    
    # Format the reason string
    reasons = []
    for _, row in top_3.iterrows():
        reasons.append(f"{row['Feature']} (+{row['Impact']:.2f})")
    
    results.append({
        "Employee_ID": emp_id,
        "Predicted_Burnout_Score": score,
        "Primary_Driver": reasons[0],
        "Secondary_Driver": reasons[1],
        "Tertiary_Driver": reasons[2]
    })

# Convert to DataFrame and Save
explanations_df = pd.DataFrame(results)
filename = "high_risk_burnout_explanations.csv"
explanations_df.to_csv(filename, index=False)

print(f"Saved explanations to: {filename}")
print("\n--- PREVIEW ---")
print(explanations_df.head(10).to_string(index=False))


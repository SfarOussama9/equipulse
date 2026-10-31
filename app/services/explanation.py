from fastapi import APIRouter, HTTPException
from app.services.data_loader import loader
import shap
import pandas as pd
import numpy as np

router = APIRouter()

# Cache for SHAP values to avoid re-computing
shap_cache = {}

def get_explainer():
    model = loader.get_model()
    training_data = loader.get_training_data()
    
    if model is None or training_data is None:
        return None
    
    # Assuming the model is a sklearn pipeline or model
    # We need to identify the features. 
    # For simplicity, let's assume training_data has 'Burnout Rate' as target and we drop it.
    X_train = training_data.drop(columns=['Burnout Rate', 'Employee ID'], errors='ignore')
    
    # Select numeric columns only for SHAP if necessary, but usually we pass all features used in training
    # We'll use a small background dataset for speed
    background = shap.maskers.Independent(X_train, max_samples=100)
    
    # Create explainer
    # Note: TreeExplainer is faster for tree models, KernelExplainer for others.
    # We'll try TreeExplainer first, fallback to KernelExplainer
    try:
        explainer = shap.TreeExplainer(model, data=None) # data=None for TreeExplainer usually works if model stores it, or we might need it
    except:
        explainer = shap.Explainer(model.predict, background)
        
    return explainer, X_train.columns.tolist()

@router.get("/high-risk")
async def get_high_risk_explanations():
    # Check for pre-calculated explanations first
    import os
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    EXPLANATION_FILE = os.path.join(BASE_DIR, "high_risk_burnout_explanations.csv")
    
    if os.path.exists(EXPLANATION_FILE):
        explanations = pd.read_csv(EXPLANATION_FILE)
        return explanations.to_dict(orient='records')

    data = loader.get_data()
    if data is None:
        raise HTTPException(status_code=500, detail="Data not available")
    
    # Filter high risk (Fallback if file doesn't exist)
    # Ensure we use the correct column name 'Predicted_Burnout_Score' and threshold
    if 'Predicted_Burnout_Score' not in data.columns:
         return []

    high_risk = data[data['Predicted_Burnout_Score'] > 7.5].copy()
    
    if high_risk.empty:
        return []

    # If we don't have the explanation file, we just return the high risk employees
    # In a real app, we would trigger the SHAP calculation here
    return high_risk.to_dict(orient='records')

@router.get("/employee/{employee_id}")
async def explain_employee(employee_id: str):
    data = loader.get_data()
    if data is None:
        raise HTTPException(status_code=500, detail="Data not available")
    
    # Find employee
    employee = data[data['Employee_ID'] == employee_id]
    if employee.empty:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Return employee data directly for now
    # In a real scenario, we would run SHAP here
    # But for the hackathon demo, returning the rich data we already have is often enough
    # especially since we added "Prediction_Error" and other metrics in the CSV
    
    record = employee.iloc[0].to_dict()
    
    # Mock SHAP values for visualization if needed
    # We can generate some "Top Contributors" based on the feature values
    # e.g. if Weekly_Hours is high, it's a top contributor
    
    contributors = []
    if record.get('Weekly_Hours', 0) > 45:
        contributors.append({"feature": "Weekly Hours", "impact": "High", "value": record['Weekly_Hours']})
    if record.get('Meeting_Hours', 0) > 15:
        contributors.append({"feature": "Meeting Hours", "impact": "Medium", "value": record['Meeting_Hours']})
    if record.get('Project_Count', 0) > 6:
        contributors.append({"feature": "Project Count", "impact": "Medium", "value": record['Project_Count']})
        
    record['burnout_contributors'] = contributors
    
    return record

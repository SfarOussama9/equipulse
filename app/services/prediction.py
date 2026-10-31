from fastapi import APIRouter
import pandas as pd
import joblib
import os
import sys

# Add root directory to sys.path to import data1
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

try:
    from data1 import generate_clean_burnout_data
except ImportError:
    # Fallback or mock if data1 is not found
    def generate_clean_burnout_data(n, seed=None):
        raise ImportError("data1.py not found")

router = APIRouter()

MODEL_PATH = os.path.join(BASE_DIR, "burnout_predictor_model.pkl")
OUTPUT_FILE = os.path.join(BASE_DIR, "live_employee_data_with_predictions_v2.csv")

@router.post("/run")
async def run_predictions(count: int = 2000):
    try:
        # 1. Generate Data
        df_new = generate_clean_burnout_data(count, seed=None)
        
        true_scores = df_new["Burnout_Score"].copy()
        df_input = df_new.drop(columns=["Burnout_Score", "Attrition_Risk_Flag"], errors='ignore')
        
        # 2. Load Model
        if not os.path.exists(MODEL_PATH):
             return {"status": "error", "message": "Model not found"}
             
        model = joblib.load(MODEL_PATH)
        
        # 3. Predict
        # Assuming model expects features without Employee_ID
        features = df_input.drop(columns=["Employee_ID"], errors='ignore')
        predicted_scores = model.predict(features)
        
        # 4. Create Final Dataset
        df_final = df_input.copy()
        df_final["Formula_Burnout_Score"] = true_scores
        df_final["Predicted_Burnout_Score"] = predicted_scores.round(2)
        df_final["Prediction_Error"] = (df_final["Predicted_Burnout_Score"] - df_final["Formula_Burnout_Score"]).round(2)
        
        df_final["Risk_Category"] = pd.cut(
            df_final["Predicted_Burnout_Score"], 
            bins=[0, 4, 7, 10], 
            labels=["Low", "Medium", "High"]
        )
        
        # 5. Save
        df_final.to_csv(OUTPUT_FILE, index=False)
        
        return {"status": "success", "message": f"Generated and predicted for {count} employees", "file": OUTPUT_FILE}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

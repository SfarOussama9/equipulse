import pandas as pd
import joblib
import os
import time
import glob

# Paths to resources
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "burnout_predictor_model.pkl")
DATA_PATH = os.path.join(BASE_DIR, "live_employee_data_with_predictions_v2.csv")
# Newest dataset written by data1.py (burnout_data_clean_HHMM.csv)
_training_files = glob.glob(os.path.join(BASE_DIR, "burnout_data_clean_*.csv"))
TRAINING_DATA_PATH = max(_training_files, key=os.path.getmtime) if _training_files else os.path.join(BASE_DIR, "burnout_data_clean.csv")

class DataLoader:
    def __init__(self):
        self.model = None
        self.data = None
        self.training_data = None
        self.last_data_mtime = 0
        self.load_resources()

    def load_resources(self):
        print("Loading resources...")
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                print("Model loaded.")
            else:
                print(f"Warning: Model not found at {MODEL_PATH}")

            if os.path.exists(DATA_PATH):
                self.data = pd.read_csv(DATA_PATH)
                self.last_data_mtime = os.path.getmtime(DATA_PATH)
                print(f"Data loaded. Shape: {self.data.shape}")
            else:
                print(f"Warning: Data file not found at {DATA_PATH}")

            if os.path.exists(TRAINING_DATA_PATH):
                self.training_data = pd.read_csv(TRAINING_DATA_PATH)
                print(f"Training data loaded. Shape: {self.training_data.shape}")
            else:
                print(f"Warning: Training data file not found at {TRAINING_DATA_PATH}")

        except Exception as e:
            print(f"Error loading resources: {e}")

    def get_data(self):
        # Check if file has changed
        if os.path.exists(DATA_PATH):
            current_mtime = os.path.getmtime(DATA_PATH)
            if current_mtime > self.last_data_mtime:
                print("Data file changed, reloading...")
                self.data = pd.read_csv(DATA_PATH)
                self.last_data_mtime = current_mtime
        return self.data

    def get_model(self):
        return self.model
    
    def get_training_data(self):
        return self.training_data

loader = DataLoader()

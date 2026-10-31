from fastapi import APIRouter, HTTPException
from app.services.data_loader import loader
import pandas as pd
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INEQUITY_FILE = os.path.join(BASE_DIR, "inequity_analysis.csv")

@router.get("/analysis")
async def get_inequity_analysis():
    if os.path.exists(INEQUITY_FILE):
        df = pd.read_csv(INEQUITY_FILE)
        return df.to_dict(orient='records')
    
    # If file doesn't exist, we should trigger the calculation
    # For now, return empty or error
    raise HTTPException(status_code=404, detail="Inequity analysis not found. Please run the analysis script.")

@router.get("/hidden-heroes")
async def get_hidden_heroes():
    if os.path.exists(INEQUITY_FILE):
        df = pd.read_csv(INEQUITY_FILE)
        # Filter by Inequity_Flag
        heroes = df[df['Inequity_Flag'] == 'Hidden Hero (Overworked)']
        return heroes.to_dict(orient='records')
    return []

@router.get("/coasters")
async def get_coasters():
    if os.path.exists(INEQUITY_FILE):
        df = pd.read_csv(INEQUITY_FILE)
        coasters = df[df['Inequity_Flag'] == 'Coaster (Underutilized)']
        return coasters.to_dict(orient='records')
    return []

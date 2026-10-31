from fastapi import APIRouter, HTTPException, Query
from app.services.data_loader import loader
import pandas as pd

router = APIRouter()

@router.get("/")
async def get_employees(limit: int = Query(100, ge=1), offset: int = Query(0, ge=0)):
    data = loader.get_data()
    if data is None:
        raise HTTPException(status_code=500, detail="Data not available")
    
    # Convert to list of dicts
    # Handle NaN values for JSON serialization
    data = data.fillna(0) # Or handle appropriately
    
    # Pagination
    total = len(data)
    employees = data.iloc[offset : offset + limit].to_dict(orient='records')
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "data": employees
    }

@router.get("/all")
async def get_all_employees():
    data = loader.get_data()
    if data is None:
        raise HTTPException(status_code=500, detail="Data not available")
    
    data = data.fillna(0)
    return data.to_dict(orient='records')

@router.get("/{employee_id}")
async def get_employee(employee_id: str):
    data = loader.get_data()
    if data is None:
        raise HTTPException(status_code=500, detail="Data not available")
    
    employee = data[data['Employee_ID'] == employee_id]
    if employee.empty:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return employee.iloc[0].fillna(0).to_dict()

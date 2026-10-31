from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services import explanation, inequity, manager, prediction, employees

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Burnout Analysis API is running"}

app.include_router(explanation.router, prefix="/explain", tags=["Explanation"])
app.include_router(inequity.router, prefix="/inequity", tags=["Inequity"])
app.include_router(manager.router, prefix="/manager", tags=["Manager"])
app.include_router(prediction.router, prefix="/predict", tags=["Prediction"])
app.include_router(employees.router, prefix="/employees", tags=["Employees"])

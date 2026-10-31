from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.data_loader import loader
import pandas as pd
import os
import google.generativeai as genai

router = APIRouter()

# --- CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

try:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set")
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    USE_REAL_LLM = True
except Exception as e:
    print(f"Gemini API not configured ({e}); using fallback templates.")
    USE_REAL_LLM = False

class RecognitionRequest(BaseModel):
    employee_id: str
    name: str
    role: str
    points: int
    burnout_score: float
    weekly_hours: float

class ReportRequest(BaseModel):
    department: str
    n_recommendations: int = 5

@router.post("/recognize")
async def generate_recognition_message(request: RecognitionRequest):
    if not USE_REAL_LLM:
        return {
            "ai_score": request.points + 10,
            "message": f"Outstanding work, {request.name}! Your balance of {request.weekly_hours}h/week and low burnout ({request.burnout_score}) is inspiring."
        }

    prompt = f"""
    You are an expert AI HR Analyst.
    
    TASK:
    1. Analyze the employee's metrics to calculate a "Holistic Wellness Score" (0-100).
       - High Score (>90) = High Performance + Low Burnout (<3) + Sustainable Hours (35-45).
       - Penalize for overwork (>45h) or high burnout (>4).
       - Be generous but fair.
    2. Write a short, inspiring kudos message (max 2 sentences).

    EMPLOYEE:
    - Name: {request.name}
    - Role: {request.role}
    - Burnout Score: {request.burnout_score}/10
    - Weekly Hours: {request.weekly_hours}
    
    OUTPUT FORMAT (JSON ONLY):
    {{
        "ai_score": <int>,
        "message": "<string>"
    }}
    """
    
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        import json
        return json.loads(response.text)
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "ai_score": request.points, 
            "message": f"Congratulations {request.name}! You are a true role model for sustainable high performance."
        }

@router.post("/report")
async def generate_manager_report(request: ReportRequest):
    # 1. Load Data
    # We need the inequity analysis data. 
    # If it's not in the loader, we read the CSV directly as per the script.
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    INEQUITY_FILE = os.path.join(BASE_DIR, "inequity_analysis.csv")
    
    if not os.path.exists(INEQUITY_FILE):
        raise HTTPException(status_code=404, detail="Inequity analysis data not found. Please run the analysis first.")
        
    df = pd.read_csv(INEQUITY_FILE)
    
    department = request.department
    n_recommendations = request.n_recommendations
    
    # Filter for this department
    dept_df = df[df["Department"] == department]
    
    if dept_df.empty:
        return {"reports": []}

    # A. Find the "Crisis" Employees (High Burnout + Overloaded)
    if "Inequity_Flag" in dept_df.columns:
        crisis_candidates = dept_df[dept_df["Inequity_Flag"] == "Hidden Hero (Overworked)"].sort_values("Predicted_Burnout_Score", ascending=False)
        if crisis_candidates.empty:
             crisis_candidates = dept_df.sort_values("Predicted_Burnout_Score", ascending=False)
    else:
        crisis_candidates = dept_df.sort_values("Predicted_Burnout_Score", ascending=False)
        
    victims = crisis_candidates.head(n_recommendations)
    
    # B. Find "Savior" Employees (Low Burnout + Underutilized)
    all_saviors = dept_df[
        (dept_df["Risk_Category"] == "Low") & 
        (dept_df["Workload_Profile"] == "Underutilized")
    ].sort_values("Weekly_Hours")
    
    used_saviors = []
    reports = []

    for i, (_, victim) in enumerate(victims.iterrows()):
        
        # --- STRATEGY 1: PEER SUPPORT (Same Role) ---
        same_role_saviors = all_saviors[
            (all_saviors["Role"] == victim["Role"]) & 
            (~all_saviors["Employee_ID"].isin(used_saviors))
        ]
        
        peer_action = ""
        if not same_role_saviors.empty:
            savior = same_role_saviors.iloc[0]
            used_saviors.append(savior["Employee_ID"])
            peer_action = f"""
    ✅ OPTION A: WORKLOAD REBALANCING (Preferred)
    We identified {savior['Employee_ID']} ({savior['Role']}) as a perfect match for support.
    - Why: Same Role, Low Utilization ({savior['Weekly_Hours']} hrs/week).
    👉 Action: Reassign 1-2 active projects from {victim['Employee_ID']} to {savior['Employee_ID']}."""
        else:
            peer_action = f"""
    ⚠️ OPTION A: WORKLOAD REBALANCING
    No direct peer ({victim['Role']}) with capacity was found in the department.
    👉 Action: Consider cross-training a lower-level employee or opening a contractor requisition."""

        # --- STRATEGY 2: ALTERNATIVE SOLUTIONS ---
        alt_actions = []
        if victim["Meeting_Hours"] > 15:
            alt_actions.append(f"- 📅 Meeting Detox: {victim['Employee_ID']} spends {victim['Meeting_Hours']}h in meetings. Audit recurring invites.")
        if victim["Vacation_Days_Taken"] < 5:
            alt_actions.append(f"- 🏖️ Mandatory Leave: Employee has taken only {victim['Vacation_Days_Taken']} days off. Mandate a 3-day recharge break.")
            
        alt_text = "\n".join(alt_actions)

        # --- CONSTRUCT PROMPT ---
        prompt = f"""
        You are an expert HR Analytics Consultant. Write a concise, empathetic, but action-oriented email to the manager of {victim['Employee_ID']}.
        
        CONTEXT:
        - Employee: {victim['Employee_ID']} ({victim['Role']})
        - Status: HIGH BURNOUT RISK (Score: {victim['Predicted_Burnout_Score']:.1f}/10)
        - Workload: {victim['Weekly_Hours']} hrs/week (vs 40h norm)
        - Projects: {victim['Project_Count']} active projects
        
        PROPOSED INTERVENTIONS (Use these facts):
        {peer_action}
        
        OPTION B: IMMEDIATE RELIEF
        {alt_text}
        
        INSTRUCTIONS:
        - Subject Line: Urgent: Wellness Plan for {victim['Employee_ID']}
        - Tone: Professional, Data-Driven, Supportive.
        - Keep it under 150 words.
        - Do not use placeholders like [Manager Name].
        """

        report_content = ""
        if USE_REAL_LLM:
            try:
                response = model.generate_content(prompt)
                report_content = response.text
            except Exception as e:
                report_content = f"Error generating AI report: {e}\n\nFallback:\n{prompt}"
        else:
            report_content = f"AI Generation Unavailable. Raw Data:\n{prompt}"
            
        reports.append({
            "employee_id": victim['Employee_ID'],
            "report": report_content
        })
        
    return {"reports": reports}

@router.get("/leaderboard")
async def generate_ai_leaderboard():
    df = loader.get_data()
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="No employee data found")

    # 1. Filter for Candidates (Heuristic Pre-selection)
    # We want employees with low burnout and reasonable hours to be candidates for "Wellness Champions"
    candidates = df[
        (df["Predicted_Burnout_Score"] < 4) & 
        (df["Weekly_Hours"] < 50)
    ].copy()
    
    # If too few, relax constraints
    if len(candidates) < 10:
        candidates = df[df["Predicted_Burnout_Score"] < 6].copy()

    # Take top 20 candidates based on a simple heuristic to send to AI
    # Heuristic: Low Burnout is good, Hours closer to 40 is good (not too low, not too high)
    candidates["Heuristic_Score"] = (10 - candidates["Predicted_Burnout_Score"]) * 10
    top_candidates = candidates.sort_values("Heuristic_Score", ascending=False).head(20)
    
    # Prepare data for AI
    candidates_list = []
    for _, row in top_candidates.iterrows():
        candidates_list.append({
            "id": row["Employee_ID"],
            "role": row["Role"],
            "burnout": row["Predicted_Burnout_Score"],
            "hours": row["Weekly_Hours"],
            "wfh": row.get("WFH_Days_Per_Week", 0),
            "vacation": row.get("Vacation_Days_Taken", 0)
        })

    if not USE_REAL_LLM:
        # Fallback: Return top 10 sorted by heuristic
        return {
            "leaderboard": [
                {
                    "employee_id": c["id"],
                    "ai_score": int(95 - i),
                    "message": "Great work-life balance!"
                } for i, c in enumerate(candidates_list[:10])
            ]
        }

    # 2. AI Ranking
    prompt = f"""
    You are an expert AI HR Analyst.
    
    TASK:
    I have a list of {len(candidates_list)} high-potential employees for the "Wellness Champions" leaderboard.
    Select the TOP 10 employees who best exemplify "Holistic Wellness" (High performance implied, Low Burnout, Sustainable Habits).
    
    CRITERIA:
    - Low Burnout Score is best.
    - Weekly Hours should be balanced (around 35-45 is ideal).
    - High Vacation days and WFH usage are pluses for sustainability.
    
    CANDIDATES:
    {candidates_list}
    
    OUTPUT FORMAT (JSON ONLY):
    {{
        "leaderboard": [
            {{
                "employee_id": "ID_HERE",
                "ai_score": <int 80-100>,
                "message": "<Short, specific kudos message about their balance>",
                "reasoning": "<Concise reason for the score, e.g. 'Perfect 40h work week with minimal burnout'>"
            }},
            ... (10 items)
        ]
    }}
    """
    
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        import json
        return json.loads(response.text)
    except Exception as e:
        print(f"AI Leaderboard Error: {e}")
        # Fallback
        return {
            "leaderboard": [
                {
                    "employee_id": c["id"],
                    "ai_score": int(95 - i),
                    "message": "Outstanding wellness metrics.",
                    "reasoning": "High performance with sustainable habits."
                } for i, c in enumerate(candidates_list[:10])
            ]
        }


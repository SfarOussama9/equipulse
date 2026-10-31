import pandas as pd
import numpy as np
from datetime import datetime

def generate_clean_burnout_data(n_rows=10_000, seed=None):
    # If seed is None, numpy uses the system clock/entropy
    rng = np.random.default_rng(seed)

    # --- 1. STRUCTURE ---
    # Departments with specific work cultures
    depts = ["Engineering", "Sales", "Marketing", "Product", "HR", "Finance"]
    dept_probs = [0.30, 0.25, 0.15, 0.10, 0.05, 0.15]
    
    # Levels: Junior to VP
    levels = ["L1_Junior", "L2_Mid", "L3_Senior", "L4_Lead", "L5_Manager", "L6_Director"]
    level_probs = [0.25, 0.35, 0.20, 0.10, 0.07, 0.03]

    department = rng.choice(depts, n_rows, p=dept_probs)
    level = rng.choice(levels, n_rows, p=level_probs)

    # --- 2. WORKLOAD METRICS (The Inputs) ---
    
    # Base expected hours per department
    base_hours_map = {
        "Engineering": 40, "Sales": 42, "Marketing": 38, 
        "Product": 40, "HR": 38, "Finance": 45
    }
    base_h = np.vectorize(base_hours_map.get)(department)

    # Add noise: Some weeks are harder (+/- 5 hours standard deviation)
    actual_hours = rng.normal(base_h, 5, n_rows)

    # Logic: Directors work more hours, but Juniors do more "grunt work"
    # Add 5 hours for every level above L3
    level_bump = np.select(
        [level == "L4_Lead", level == "L5_Manager", level == "L6_Director"],
        [3, 5, 8], default=0
    )
    actual_hours += level_bump
    actual_hours = np.clip(actual_hours, 30, 75).round(1)

    # Metric: Meeting Hours per Week (Crucial burnout driver)
    # Managers/Directors have WAY more meetings
    meeting_hours = rng.normal(5, 2, n_rows) # Base
    meeting_hours += np.select(
        [level == "L1_Junior", level == "L3_Senior", level == "L5_Manager", level == "L6_Director"],
        [-2, 3, 12, 18], default=0
    )
    # Marketing/Product have more meetings than Eng
    meeting_hours += np.where(np.isin(department, ["Product", "Marketing"]), 5, 0)
    meeting_hours = np.clip(meeting_hours, 2, 40).round(1)

    # Metric: Project Count (Mental Load)
    # Engineers have few deep projects; Managers juggle many small ones
    project_count = rng.poisson(3, n_rows)
    
    # Adjustments for realism
    # Juniors typically handle fewer, defined tasks
    project_count = np.where(level == "L1_Junior", np.clip(project_count, 1, 4), project_count)
    # Directors oversee many
    project_count = np.where(level == "L6_Director", project_count * 2, project_count)
    
    project_count = np.clip(project_count, 1, 12)

    # --- 3. ENVIRONMENT (The Context) ---
    
    # Work from home status
    wfh_days = rng.choice([0, 2, 3, 5], n_rows, p=[0.4, 0.3, 0.2, 0.1])
    
    # Tenure (Years) - Correlated with level
    # We use specific ranges per level to ensure realism (no Juniors with 10 years)
    # Ranges: (Min, Max)
    tenure_min_max = [
        (0.5, 2.5),   # L1_Junior
        (2.0, 6.0),   # L2_Mid
        (5.0, 10.0),  # L3_Senior
        (7.0, 12.0),  # L4_Lead
        (8.0, 15.0),  # L5_Manager
        (10.0, 20.0)  # L6_Director
    ]
    
    conditions = [level == l for l in levels]
    min_vals = [r[0] for r in tenure_min_max]
    max_vals = [r[1] for r in tenure_min_max]
    
    t_min = np.select(conditions, min_vals)
    t_max = np.select(conditions, max_vals)
    
    tenure = t_min + (t_max - t_min) * rng.random(n_rows)
    tenure = tenure.round(1)

    # --- 3b. NEW FACTORS (The "Human" Elements) ---
    
    # 1. Vacation Days Taken (0-30)
    # Logic: High workload often prevents taking leave.
    vacation_days = rng.normal(15, 5, n_rows)
    # If working > 55 hours, likely taking fewer days off
    vacation_days -= np.where(actual_hours > 55, 5, 0)
    vacation_days = np.clip(vacation_days, 0, 30).astype(int)

    # 2. Peer Support Score (1-10)
    # Logic: Fully remote employees might feel slightly more isolated
    peer_support = rng.normal(7, 2, n_rows)
    peer_support -= np.where(wfh_days == 5, 1.5, 0)
    peer_support = np.clip(peer_support, 1, 10).astype(int)

    # 3. Professional Growth Rating (1-5)
    # Logic: Stagnation check. If tenure is near the max for the role, growth feels low.
    growth_rating = rng.choice([1, 2, 3, 4, 5], n_rows, p=[0.1, 0.2, 0.3, 0.3, 0.1])
    
    # Calculate "Relative Tenure" (0.0 to 1.0 within their band)
    # If relative tenure > 0.8 (stagnating), reduce growth rating
    relative_tenure = (tenure - t_min) / (t_max - t_min)
    growth_rating = np.where(relative_tenure > 0.8, growth_rating - 1, growth_rating)
    growth_rating = np.clip(growth_rating, 1, 5)

    # 4. Commute Time (Minutes)
    # Logic: Random distribution, but irrelevant for stress if WFH=5
    commute_time = rng.gamma(shape=2, scale=20, size=n_rows) # Skewed right
    commute_time = np.clip(commute_time, 10, 120).astype(int)

    # 7. Salary Satisfaction (1-10)
    # Logic: Higher roles and specific depts tend to be more satisfied
    salary_sat = rng.normal(6, 2, n_rows)
    salary_sat += np.where(np.isin(department, ["Engineering", "Sales", "Finance"]), 1, 0)
    salary_sat += np.where(np.isin(level, ["L5_Manager", "L6_Director"]), 2, 0)
    salary_sat = np.clip(salary_sat, 1, 10).astype(int)

    # --- 4. BURNOUT CALCULATION (The "Realism" Fix) ---
    
    # Factor 1: Overwork (Hours > 38 is bad)
    # INCREASED WEIGHT: 0.15 -> 0.25 to punish overwork more heavily
    stress_hours = (actual_hours - 38) * 0.25
    
    # Factor 2: "Zoom Fatigue" (Meeting density)
    # INCREASED WEIGHT: Max impact 3.0 -> 4.5
    stress_meetings = (meeting_hours / 40) * 4.5 
    
    # Factor 3: Tenure fatigue ("The 4-year itch")
    # People often burnout around year 4-5, then recover or leave
    stress_tenure = np.where((tenure > 3) & (tenure < 6), 0.8, 0)

    # Factor 4: The "Manager Buffer" (Random Luck)
    # A good manager (-1 burnout) vs bad manager (+1 burnout)
    manager_quality = rng.normal(0, 0.8, n_rows) 

    # Factor 5: WLB Benefit (WFH days reduce stress slightly, unless 0)
    # REDUCED BENEFIT: -0.3 -> -0.2 (WFH helps, but doesn't cure 60h weeks)
    stress_wlb = -0.2 * wfh_days

    # --- NEW FACTORS IMPACT ---
    
    # Impact 1: Vacation (Protective)
    # Taking < 5 days is bad (+Stress), Taking > 20 is good (-Stress)
    stress_vacation = np.select(
        [vacation_days < 5, vacation_days > 20],
        [1.5, -1.0], default=0
    )

    # Impact 2: Peer Support (Protective)
    # Low support is a major stressor
    stress_support = np.select(
        [peer_support <= 3, peer_support >= 8],
        [2.0, -1.5], default=0
    )

    # Impact 3: Growth (Protective)
    # Feeling stuck (Rating 1-2) adds burnout
    stress_growth = np.where(growth_rating <= 2, 1.5, -0.5)

    # Impact 4: Commute (Risk)
    # Only adds stress if they actually go to the office (WFH < 5)
    # Commute > 60 mins is draining
    days_in_office = 5 - wfh_days
    commute_stress_factor = np.where((commute_time > 60) & (days_in_office > 2), 1.0, 0)
    
    # Impact 7: Salary (Contextual)
    # Low salary satisfaction creates resentment
    stress_salary = np.where(salary_sat <= 3, 1.5, -0.5)

    # Calculate Raw Score
    base_score = 3.0  # Lowered baseline to account for new additive stressors
    raw_burnout = (base_score + 
                   stress_hours + 
                   stress_meetings + 
                   stress_tenure - 
                   manager_quality + 
                   stress_wlb +
                   stress_vacation +
                   stress_support +
                   stress_growth +
                   commute_stress_factor +
                   stress_salary)
    
    # Add random daily life noise
    raw_burnout += rng.normal(0, 0.3, n_rows)

    # --- 5. SCALING ---
    # Instead of hard clipping, we use soft capping for extremes to avoid the "Wall of 10s"
    # This ensures a Bell Curve distribution centered around 4.5 - 5.5
    burnout_score = np.clip(raw_burnout, 1.0, 10.0).round(2)

    # --- 6. OUTPUT ---
    df = pd.DataFrame({
        "Employee_ID": [f"EMP-{i:05d}" for i in range(1, n_rows + 1)],
        "Department": department,
        "Role": level,
        "Tenure_Years": tenure,
        "Weekly_Hours": actual_hours,
        "Meeting_Hours": meeting_hours,
        "Project_Count": project_count,
        "WFH_Days_Per_Week": wfh_days,
        "Vacation_Days_Taken": vacation_days,
        "Peer_Support_Score": peer_support,
        "Professional_Growth_Rating": growth_rating,
        "Commute_Time_Mins": commute_time,
        "Salary_Satisfaction": salary_sat,
        "Burnout_Score": burnout_score
    })

    # Add logic check: If someone has < 35 hours and Low Meetings, force Burnout down
    # (Fixes logic gaps where lazy people got high burnout scores by random chance)
    mask_easy_life = (df["Weekly_Hours"] < 35) & (df["Meeting_Hours"] < 10)
    df.loc[mask_easy_life, "Burnout_Score"] = df.loc[mask_easy_life, "Burnout_Score"] * 0.7

    # Add logic check: If someone works > 55 hours, force Burnout up significantly
    mask_hard_life = (df["Weekly_Hours"] > 55)
    # Ensure score is at least 7.0 for extreme workers
    df.loc[mask_hard_life, "Burnout_Score"] = np.maximum(df.loc[mask_hard_life, "Burnout_Score"] * 1.1, 7.0)
    df.loc[mask_hard_life, "Burnout_Score"] = np.clip(df.loc[mask_hard_life, "Burnout_Score"], 7.0, 10.0)

    # Round final scores
    df["Burnout_Score"] = df["Burnout_Score"].round(1)

    return df

if __name__ == "__main__":
    # INCREASED DATASET SIZE: 5,000 -> 20,000
    df = generate_clean_burnout_data(20_000)
    
    # Save
    filename = f"burnout_data_clean_{datetime.now().strftime('%H%M')}.csv"
    df.to_csv(filename, index=False)
    
    print(f"Generated {len(df)} rows.")
    print(f"Saved to: {filename}\n")
    
    # VALIDATION CHECKS
    print("--- DATA REALISM CHECK ---")
    
    # 1. Check Score Distribution (Should not be many 10s)
    dist = df['Burnout_Score'].value_counts(bins=[0, 2, 4, 6, 8, 9, 10]).sort_index()
    print("\nBurnout Score Distribution (Bell Curve):")
    print(dist)

    # 2. Check Correlation (Hours vs Burnout)
    print("\nAvg Burnout by Work Hours:")
    print(df.groupby(pd.cut(df["Weekly_Hours"], [30, 40, 50, 60, 80]))["Burnout_Score"].mean())

    # 3. Check Logic (Do Managers meet more?)
    print("\nAvg Meeting Hours by Role:")
    print(df.groupby("Role")["Meeting_Hours"].mean().sort_values())

    # 4. Check Tenure Logic (No Juniors with 10 years)
    print("\nTenure Ranges by Role (Min - Max):")
    print(df.groupby("Role")["Tenure_Years"].agg(['min', 'max']))

    # 5. Check New Fields Logic
    print("\nAvg Burnout by Peer Support (Should decrease):")
    print(df.groupby("Peer_Support_Score")["Burnout_Score"].mean())
    
    print("\nAvg Burnout by Commute (High commute + Low WFH should be higher):")
    # Filter for people with long commutes (>60 mins)
    long_commuters = df[df["Commute_Time_Mins"] > 60]
    print(long_commuters.groupby("WFH_Days_Per_Week")["Burnout_Score"].mean())
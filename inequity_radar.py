import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 1. Load Data
print("Loading employee data...")
df = pd.read_csv("live_employee_data_with_predictions_v2.csv")

# 2. Select Features for Clustering
# We want to cluster based on WORKLOAD, not demographics
features = ["Weekly_Hours", "Meeting_Hours", "Project_Count"]
X = df[features]

# 3. Normalize Data
# K-Means is sensitive to scale (Hours=40 vs Projects=3), so we scale them
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 4. Apply K-Means Clustering
# We assume 3 natural groups: "Underutilized", "Balanced", "Overloaded"
print("Clustering employees by workload profile...")
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
df["Cluster_ID"] = kmeans.fit_predict(X_scaled)

# 5. Interpret Clusters
# We need to figure out which ID (0, 1, 2) corresponds to "Overloaded"
# We do this by looking at the average Weekly_Hours for each cluster
cluster_summary = df.groupby("Cluster_ID")[features].mean()
print("\n--- CLUSTER PROFILES ---")
print(cluster_summary)

# Map IDs to Names automatically
# Sort clusters by Weekly_Hours
sorted_clusters = cluster_summary.sort_values("Weekly_Hours")
# The one with lowest hours is "Underutilized", highest is "Overloaded"
id_map = {
    sorted_clusters.index[0]: "Underutilized",
    sorted_clusters.index[1]: "Balanced",
    sorted_clusters.index[2]: "Overloaded"
}
df["Workload_Profile"] = df["Cluster_ID"].map(id_map)

print("\nMapped Clusters:")
print(df["Workload_Profile"].value_counts())

# 6. Detect Inequity (The "Hidden Heroes")
# Logic: If you are a Junior/Mid/Senior (Individual Contributor) 
# BUT you are in the "Overloaded" cluster, you are a Hidden Hero.
print("\n--- DETECTING INEQUITY ---")

# Calculate "Workload Deviation"
# (Your Hours - Dept Avg Hours) / Dept Std Dev
# This is a Z-Score for workload
df["Dept_Avg_Hours"] = df.groupby("Department")["Weekly_Hours"].transform("mean")
df["Dept_Std_Hours"] = df.groupby("Department")["Weekly_Hours"].transform("std")
df["Workload_Deviation_Score"] = ((df["Weekly_Hours"] - df["Dept_Avg_Hours"]) / df["Dept_Std_Hours"]).round(2)

# Flag "Hidden Heroes"
# Criteria: Role is NOT Manager/Director, Profile is "Overloaded", AND Burnout Score >= 7.0
individual_contributors = ["L1_Junior", "L2_Mid", "L3_Senior", "L4_Lead"]
mask_hero = (
    (df["Role"].isin(individual_contributors)) & 
    (df["Workload_Profile"] == "Overloaded") & 
    (df["Predicted_Burnout_Score"] >= 7.0)
)
df["Inequity_Flag"] = np.where(mask_hero, "Hidden Hero (Overworked)", "Normal")

# Flag "Coasters"
# Criteria: Role IS Senior/Lead, but Profile is "Underutilized"
mask_coaster = (df["Role"].isin(["L3_Senior", "L4_Lead"])) & (df["Workload_Profile"] == "Underutilized")
df.loc[mask_coaster, "Inequity_Flag"] = "Coaster (Underutilized)"

# 7. Save Results
filename = "inequity_analysis.csv"
df.to_csv(filename, index=False)
print(f"Saved inequity analysis to: {filename}")

# 8. Show Examples
print("\n--- HIDDEN HEROES (High Performers at Risk of Burnout) ---")
# Filter for Hidden Heroes and sort by Burnout Score to show the correlation
heroes = df[df["Inequity_Flag"] == "Hidden Hero (Overworked)"].sort_values("Predicted_Burnout_Score", ascending=False)
print(heroes[["Employee_ID", "Role", "Department", "Weekly_Hours", "Predicted_Burnout_Score", "Workload_Deviation_Score"]].head(10).to_string(index=False))

print("\n--- COASTERS (Seniors doing Junior work) ---")
coasters = df[df["Inequity_Flag"] == "Coaster (Underutilized)"].sort_values("Predicted_Burnout_Score", ascending=True)
print(coasters[["Employee_ID", "Role", "Department", "Weekly_Hours", "Predicted_Burnout_Score", "Workload_Deviation_Score"]].head(5).to_string(index=False))

// Generate employees from CSV data structure
// This matches the format from burnout_data_clean_2037.csv
export function generateEmployeesFromCSV() {
  const employees = [];
  
  // We'll generate a representative sample based on the CSV structure
  // In a real app, you would parse the actual CSV file
  // For now, creating employees that match the CSV schema
  
  const departments = ['Product', 'Sales', 'Finance', 'Marketing', 'Engineering', 'HR'];
  const roles = ['L1_Junior', 'L2_Mid', 'L3_Senior', 'L4_Lead', 'L5_Manager', 'L6_Director'];
  
  // Generate employees matching the CSV structure
  for (let i = 1; i <= 5001; i++) {
    const empNum = String(i).padStart(5, '0');
    const dept = departments[i % departments.length];
    const role = roles[Math.floor(Math.random() * roles.length)];
    
    // Vary the metrics to create realistic distribution
    const weeklyHours = 30 + Math.random() * 50; // 30-80 hours
    const burnout = Math.random() * 10; // 0-10 burnout score
    const stress = burnout * 10; // Convert to percentage
    
    const employee = {
      id: `EMP-${empNum}`,
      Employee_ID: `EMP-${empNum}`,
      department: dept,
      Department: dept,
      role: role,
      Role: role,
      Tenure_Years: Math.random() * 15,
      Weekly_Hours: weeklyHours,
      hoursWorked: weeklyHours,
      Meeting_Hours: Math.random() * 25,
      Project_Count: Math.floor(Math.random() * 8) + 1,
      tasksIndividual: Math.floor(Math.random() * 30) + 5,
      WFH_Days_Per_Week: Math.floor(Math.random() * 6),
      remoteHours: Math.floor(Math.random() * 6) * 8,
      Vacation_Days_Taken: Math.floor(Math.random() * 25),
      holidaysTaken: Math.floor(Math.random() * 25),
      Peer_Support_Score: Math.floor(Math.random() * 10) + 1,
      Professional_Growth_Rating: Math.floor(Math.random() * 5) + 1,
      Commute_Time_Mins: Math.floor(Math.random() * 90),
      Salary_Satisfaction: Math.floor(Math.random() * 10) + 1,
      Burnout_Score: burnout,
      stress: stress,
      tasksTeam: Math.floor(Math.random() * 25),
      name: `Employee ${empNum}`,
      email: `employee${empNum}@company.com`,
      phone: `+1-555-${empNum}`,
      gender: Math.random() > 0.5 ? 'f' : 'm'
    };
    
    employees.push(employee);
  }
  
  return employees;
}

export const ALL_EMPLOYEES = generateEmployeesFromCSV();

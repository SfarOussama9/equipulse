export function mapEmployeeData(apiData) {
  return apiData.map(emp => {
    // Deterministic generation based on ID
    const idNum = parseInt(emp.Employee_ID.replace(/\D/g, '')) || 0;
    const gender = idNum % 2 === 0 ? 'f' : 'm';
    const name = `Employee ${emp.Employee_ID}`;
    
    // Map fields
    return {
      ...emp,
      id: emp.Employee_ID,
      name: name,
      gender: gender,
      email: `${emp.Employee_ID.toLowerCase()}@company.com`,
      department: emp.Department || 'Unknown',
      role: emp.Role || 'Unknown',
      
      // Metric mappings
      hoursWorked: emp.Weekly_Hours || 40,
      stress: (emp.Predicted_Burnout_Score || 0) * 10, // Scale 0-10 to 0-100
      
      // Derived metrics for variety
      tasksIndividual: (emp.Project_Count || 2) * 3, 
      tasksTeam: Math.round((emp.Meeting_Hours || 5) * 1.5),
      
      remoteHours: (emp.WFH_Days_Per_Week || 0) * 8,
      holidaysTaken: emp.Vacation_Days_Taken || 0,
      
      // Detailed metrics for analysis
      Meeting_Hours: emp.Meeting_Hours || 0,
      Project_Count: emp.Project_Count || 0,
      WFH_Days_Per_Week: emp.WFH_Days_Per_Week || 0,
      Tenure_Years: emp.Tenure_Years || 0,
      Vacation_Days_Taken: emp.Vacation_Days_Taken || 0,
      Peer_Support_Score: emp.Peer_Support_Score || 5,
      Professional_Growth_Rating: emp.Professional_Growth_Rating || 3,
      Commute_Time_Mins: emp.Commute_Time_Mins || 0,
      Salary_Satisfaction: emp.Salary_Satisfaction || 5,

      // Mock compatibility for now
      compatibility: {},

      // Parse drivers if available
      Top_Drivers: (() => {
        if (emp.Top_Drivers) return emp.Top_Drivers;
        
        const drivers = [];
        const parseDriver = (str) => {
          if (!str) return null;
          const match = str.match(/(.+) \(\+([\d.]+)\)/);
          if (match) return { feature: match[1], impact: match[2] };
          return { feature: str, impact: '?' };
        };

        if (emp.Primary_Driver) drivers.push(parseDriver(emp.Primary_Driver));
        if (emp.Secondary_Driver) drivers.push(parseDriver(emp.Secondary_Driver));
        if (emp.Tertiary_Driver) drivers.push(parseDriver(emp.Tertiary_Driver));
        
        return drivers;
      })()
    };
  });
}

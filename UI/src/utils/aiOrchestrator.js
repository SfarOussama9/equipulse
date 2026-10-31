/**
 * AI Orchestrator - Integrates Gemini AI for deep burnout analysis
 * Uses Google's Gemini API to generate comprehensive insights
 */

import { analyzeWorkforce } from './burnoutAnalysis';

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * Call Gemini API for AI-powered analysis
 */
async function callGeminiAPI(prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.85, // Increased for more diverse, creative analysis
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      jsonText = text.split('```')[1].split('```')[0];
    }
    
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

/**
 * Generate AI Orchestrator Report using Gemini
 */
export async function generateAIOrchestrationReportWithLLM(employees) {
  const workforceAnalysis = analyzeWorkforce(employees);
  
  // Prepare data summaries
  const critical = workforceAnalysis.criticalEmployees.slice(0, 15);
  const overworked = workforceAnalysis.overworkedEmployees.slice(0, 15);
  const underutilized = workforceAnalysis.underutilizedEmployees.slice(0, 15);
  const meetingHeavy = workforceAnalysis.meetingHeavyEmployees.slice(0, 20); // Increased for better meeting optimization
  const highProjectLoad = workforceAnalysis.highProjectLoadEmployees.slice(0, 15);
  
  // Group by department for better context
  const deptStats = {};
  employees.forEach(emp => {
    const dept = emp.Department || emp.department;
    if (!deptStats[dept]) {
      deptStats[dept] = {
        count: 0,
        totalBurnout: 0,
        totalHours: 0,
        totalProjects: 0,
        critical: 0,
        warning: 0,
        healthy: 0
      };
    }
    const stats = deptStats[dept];
    stats.count++;
    stats.totalBurnout += emp.Burnout_Score || emp.stress / 10 || 0;
    stats.totalHours += emp.Weekly_Hours || emp.hoursWorked || 40;
    stats.totalProjects += emp.Project_Count || emp.tasksIndividual || 0;
    
    const burnout = emp.Burnout_Score || emp.stress / 10 || 0;
    if (burnout >= 7) stats.critical++;
    else if (burnout >= 4) stats.warning++;
    else stats.healthy++;
  });
  
  // Calculate additional pattern detection metrics
  let lowVacationCount = 0;
  let extremeMeetingCount = 0;
  let extremeProjectCount = 0;
  let extremeHoursCount = 0;
  
  employees.forEach(emp => {
    const vacation = emp.Vacation_Days_Taken || emp.holidaysTaken || 0;
    const meetings = emp.Meeting_Hours || 0;
    const projects = emp.Project_Count || emp.tasksIndividual || 0;
    const hours = emp.Weekly_Hours || emp.hoursWorked || 40;
    
    if (vacation < 10) lowVacationCount++;
    if (meetings > 20) extremeMeetingCount++;
    if (projects >= 6) extremeProjectCount++;
    if (hours > 55) extremeHoursCount++;
  });

  Object.keys(deptStats).forEach(dept => {
    const stats = deptStats[dept];
    stats.avgBurnout = (stats.totalBurnout / stats.count).toFixed(2);
    stats.avgHours = (stats.totalHours / stats.count).toFixed(1);
    stats.avgProjects = (stats.totalProjects / stats.count).toFixed(1);
  });

  // Format employee data for AI
  const formatEmp = (emp) => {
    const burnout = emp.Burnout_Score || emp.stress / 10 || 0;
    const hours = emp.Weekly_Hours || emp.hoursWorked || 40;
    const meetings = emp.Meeting_Hours || 0;
    const projects = emp.Project_Count || emp.tasksIndividual || 0;
    const vacation = emp.Vacation_Days_Taken || emp.holidaysTaken || 0;
    return `${emp.Employee_ID || emp.id} | ${emp.Department || emp.department} | ${emp.Role || emp.role || 'Staff'} | Burnout:${burnout.toFixed(1)} | Hours:${hours.toFixed(1)} | Meetings:${meetings.toFixed(1)}h | Projects:${projects} | Vacation:${vacation}days`;
  };

  const prompt = `You are an AI Chief Culture Officer analyzing employee wellbeing data for a tech company. Your task is to generate a comprehensive, data-driven burnout management report.

CRITICAL: You MUST generate DIVERSE, SPECIFIC content for each section:
- Meeting Optimization: Generate 8-12 UNIQUE strategies (each employee gets a DIFFERENT approach)
- Early Warning Signals: Identify 4-6 DISTINCT patterns from the data (look for departmental trends, vacation gaps, meeting culture issues, project overload)
- All recommendations must reference ACTUAL employee IDs and numbers from the data below

📊 WORKFORCE DATA:
Total Employees: ${employees.length}
- 🟢 Healthy (Burnout <4): ${workforceAnalysis.healthy}
- 🟡 Warning (Burnout 4-7): ${workforceAnalysis.warning}
- 🔴 Critical (Burnout ≥7): ${workforceAnalysis.critical}

🚨 CRITICAL BURNOUT CASES (${critical.length}):
${critical.map(formatEmp).join('\n')}

⚠️ OVERWORKED (${overworked.length}, >50h/week):
${overworked.map(formatEmp).join('\n')}

💼 UNDERUTILIZED (${underutilized.length}, <35h/week):
${underutilized.map(formatEmp).join('\n')}

📅 MEETING OVERLOAD (${meetingHeavy.length}, >15h/week):
${meetingHeavy.map(formatEmp).join('\n')}

📦 HIGH PROJECT LOAD (${highProjectLoad.length}, ≥5 projects):
${highProjectLoad.map(formatEmp).join('\n')}

🏢 DEPARTMENT SUMMARY:
${Object.entries(deptStats).map(([dept, stats]) => 
  `${dept}: ${stats.count} employees | Avg Burnout:${stats.avgBurnout} | Avg Hours:${stats.avgHours} | Critical:${stats.critical} Warning:${stats.warning} Healthy:${stats.healthy}`
).join('\n')}

🔍 PATTERN DETECTION DATA (for Early Warning Signals):
- ${lowVacationCount} employees with <10 vacation days taken (burnout risk from lack of recovery)
- ${extremeMeetingCount} employees with >20h meetings/week (meeting culture problem)
- ${extremeProjectCount} employees with ≥6 projects (context-switching overload)
- ${extremeHoursCount} employees working >55h/week (systemic overwork)

Generate a JSON report with EXACT Employee_IDs from above data. For workload_redistribution, ONLY match employees within the SAME department.

Return ONLY valid JSON (no markdown):
{
  "executiveSummary": {
    "gardenHealth": "XX%",
    "topPriorities": ["priority1", "priority2", "priority3"],
    "actionRequired": "timeline",
    "keyInsights": ["insight1", "insight2", "insight3"]
  },
  "criticalCases": [
    {
      "employeeId": "EMP-XXXXX",
      "name": "Name if available",
      "department": "Dept",
      "role": "Role",
      "symptoms": "Specific burnout indicators (burnout score, hours, meetings, projects)",
      "rootCause": "Why this happened - be specific about systemic issues",
      "immediateAction": "What to do in next 24-48 hours (be very specific: days off, project offloading)",
      "longTerm": "Sustainable solution (workload review, meeting reforms, support)"
    }
  ],
  "workloadRedistribution": [
    {
      "from": {
        "id": "EMP-XXXXX",
        "department": "Dept",
        "role": "Role", 
        "description": "Current workload (hours, projects, burnout)"
      },
      "to": {
        "id": "EMP-XXXXX (MUST BE SAME DEPARTMENT)",
        "department": "SAME Dept",
        "role": "Role",
        "description": "Capacity available"
      },
      "transfer": "Specific tasks/projects to transfer",
      "impact": "How this helps both employees and department"
    }
  ],
  "vacationRecommendations": [
    {
      "employeeId": "EMP-XXXXX",
      "urgency": "immediate|high|moderate",
      "duration": "X week(s)",
      "rationale": "Why they need time off (burnout level, hours worked, vacation taken)"
    }
  ],
  "meetingOptimization": [
    {
      "employeeId": "EMP-XXXXX (pick from Meeting Overload list >15h/week)",
      "role": "Role",
      "currentMeetings": "XXh/week (use EXACT number from data above)",
      "targetMeetings": "XXh/week (calculate realistic reduction: aim for 40-60% of current)",
      "strategy": "DETAILED strategy based on their role and meeting load. Examples: 'Institute No-Meeting Fridays (save 8h/week)', 'Delegate team standups to senior (save 5h/week)', 'Convert 10 sync meetings to async updates (save 10h/week)', 'Decline non-essential cross-functional meetings (save 6h/week)'"
    }
  ],
  "earlyWarningSignals": [
    {
      "pattern": "SPECIFIC observable pattern from the data. Analyze the workforce data above and identify: 1) Departments with multiple high-burnout employees (cascading burnout), 2) Roles with consistently high hours/projects (systemic overwork), 3) Low vacation utilization trends (<10 days across multiple employees), 4) Meeting creep (multiple employees >20h meetings), 5) Project pile-up (multiple employees ≥6 projects)",
      "affectedEmployees": ["EMP-XXXXX", "EMP-XXXXX", "EMP-XXXXX (list 3-8 specific employee IDs from data)"],
      "riskLevel": "high (if burnout ≥6.5 or critical cases), medium (if burnout 4.5-6.4 or warning zone), low (if burnout <4.5 but concerning trend)",
      "preventiveAction": "ACTIONABLE intervention. Examples: 'Immediately redistribute 2-3 projects from Product dept (6 employees overloaded)', 'Mandate 2-week vacation for all Engineering staff with <8 days taken', 'Cap meeting hours at 15h/week company-wide starting next sprint', 'Hire 2 additional Marketing staff within 30 days'"
    }
  ],
  "departmentInsights": [
    {
      "department": "Department name",
      "healthStatus": "healthy|warning|critical",
      "keyIssues": ["issue1", "issue2"],
      "recommendations": ["action1", "action2"],
      "teamMoraleIndicator": "Description of team dynamics and morale"
    }
  ],
  "predictiveAnalytics": {
    "burnoutTrajectory": "Increasing|Stable|Improving",
    "atRiskEmployees": ["EMP-XXXXX with reason"],
    "successFactors": ["What's working well"],
    "riskFactors": ["What needs attention"]
  },
  "culturalRecommendations": {
    "quickWins": ["Fast actions with immediate impact"],
    "longTermInitiatives": ["Sustainable culture changes"],
    "leadershipActions": ["What managers/directors should do"],
    "teamLevelActions": ["What teams can do themselves"]
  }
}

CRITICAL ANALYSIS REQUIREMENTS:

📅 MEETING OPTIMIZATION (Required: 8-12 employees from "Meeting Overload" list):
- Use EXACT meeting hours from data (e.g., if employee has 23.5h meetings, write "23.5h/week")
- Calculate realistic targets: reduce by 40-60% (e.g., 23.5h → 12h or 23.5h → 9h)
- Make each strategy UNIQUE and role-specific:
  * Engineers: "No-Meeting Wednesdays + async standups via Slack"
  * Managers: "Delegate 1-on-1s to team leads + batch weekly reviews"
  * Directors: "Decline non-critical cross-dept meetings + 2-hour focus blocks daily"
  * Product Managers: "Shorten sprint reviews from 2h to 45min + async roadmap updates"
- NEVER use generic strategies - be specific about what meetings to cut and how

⚠️ EARLY WARNING SIGNALS (Required: 4-6 distinct patterns):
- Analyze the workforce data systematically:
  1. **Departmental Cascading Burnout**: If 3+ employees in same dept have burnout >6.0, flag it
     Example: "Engineering dept: 8 employees with burnout >6.5 (40% of dept in crisis)"
  2. **Vacation Debt Crisis**: If 5+ employees have <10 vacation days taken, flag it
     Example: "15 employees took <8 vacation days (at risk of mandatory burnout leave)"
  3. **Meeting Culture Collapse**: If 6+ employees have >20h meetings, flag it
     Example: "Product team: avg 24h meetings/week (60% of work time in meetings)"
  4. **Project Saturation**: If 5+ employees have ≥6 projects, flag it
     Example: "12 employees juggling 6-8 concurrent projects (context-switching crisis)"
  5. **Workweek Inflation**: If department avg >55h, flag it
     Example: "Data Science: avg 58h/week (16% above healthy limit)"
  6. **Peer Support Drought**: If available, check for low peer support scores
- Each signal MUST include 3-8 specific Employee_IDs from the data
- Risk levels: high (immediate action needed), medium (monitor closely), low (proactive)

🏢 DEPARTMENT INSIGHTS (Required: insights for ALL departments in data):
- Calculate health status based on avg burnout: <4=healthy, 4-7=warning, ≥7=critical
- Identify 2-3 SPECIFIC issues per department using the data (not generic)
- Provide 2-3 ACTIONABLE recommendations per department (with timelines)

📊 PREDICTIVE ANALYTICS:
- burnoutTrajectory: "Increasing" if critical>15%, "Improving" if critical<5%, else "Stable"
- List 5-10 at-risk employees (warning zone employees likely to become critical)
- Success factors: what healthy departments/employees are doing right
- Risk factors: systemic issues causing burnout

🌱 CULTURAL RECOMMENDATIONS:
- Quick wins: 3-5 actions implementable within 1-2 weeks
- Long-term: 3-5 structural changes requiring 3-6 months
- Leadership actions: what C-suite/directors must do
- Team actions: peer-driven initiatives

MANDATORY RULES:
1. Use EXACT Employee_IDs from data above (no invented IDs)
2. Use EXACT numbers from data (burnout scores, hours, meetings, projects)
3. For workload redistribution: from/to employees MUST be in SAME department
4. Meeting optimization: MUST have 8-12 entries with DIFFERENT strategies
5. Early warning signals: MUST have 4-6 entries with DIFFERENT patterns
6. Department insights: MUST cover ALL departments mentioned in data
7. Return ONLY valid JSON (no markdown, no code blocks, no explanatory text)`;

  try {
    console.log('Calling Gemini API for AI analysis...');
    const aiAnalysis = await callGeminiAPI(prompt);
    
    return {
      metadata: {
        title: 'AI Orchestrator Report',
        generatedAt: new Date().toISOString(),
        totalEmployees: employees.length,
        analysisVersion: '3.0 - AI Enhanced',
        aiProvider: 'Google Gemini 2.0 Flash'
      },
      ...aiAnalysis
    };
  } catch (error) {
    console.error('Failed to get AI analysis, using enhanced fallback:', error);
    
    // Enhanced fallback with same-department matching
    const { generateAIOrchestrationReport } = await import('./burnoutAnalysis');
    return generateAIOrchestrationReport(employees);
  }
}

export { callGeminiAPI };

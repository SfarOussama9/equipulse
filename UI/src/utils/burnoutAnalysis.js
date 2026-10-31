/**
 * Burnout Analysis Engine
 * Adapted from burnout-garden-backup-v2 tree visualization system
 * Analyzes employee wellness, workload inequities, and provides data-driven recommendations
 */

// Health status categorization based on burnout score
export function categorizeBurnoutStatus(burnoutScore) {
  if (burnoutScore < 4) return 'healthy';
  if (burnoutScore < 7) return 'warning';
  return 'critical';
}

// Calculate reward points based on positive wellness metrics
export function calculateRewardPoints(employee) {
  let points = 100; // Base points
  
  const burnout = employee.Burnout_Score || employee.stress / 10 || 0;
  const weeklyHours = employee.Weekly_Hours || employee.hoursWorked || 40;
  const wfhDays = employee.WFH_Days_Per_Week || employee.remoteHours / 8 || 0;
  const tenure = employee.Tenure_Years || 1;
  const meetingHours = employee.Meeting_Hours || 0;
  
  // Bonus for low burnout
  if (burnout < 3) {
    points += 50;
  } else if (burnout < 5) {
    points += 25;
  }
  
  // Bonus for good work-life balance
  if (weeklyHours < 45) {
    points += 30;
  }
  
  // Bonus for WFH flexibility usage
  points += Math.floor(wfhDays * 5);
  
  // Bonus for tenure
  points += Math.floor(tenure * 5);
  
  // Penalty for overwork
  if (weeklyHours > 50) {
    points -= 30;
  }
  if (meetingHours > 20) {
    points -= 20;
  }
  
  return Math.max(0, points);
}

// Get comprehensive employee analytics with deep insights
export function analyzeEmployee(employee) {
  const burnout = employee.Burnout_Score || employee.stress / 10 || 0;
  const weeklyHours = employee.Weekly_Hours || employee.hoursWorked || 40;
  const meetingHours = employee.Meeting_Hours || 0;
  const projectCount = employee.Project_Count || employee.tasksIndividual || 0;
  const wfhDays = employee.WFH_Days_Per_Week || employee.remoteHours / 8 || 0;
  const vacationDays = employee.Vacation_Days_Taken || employee.holidaysTaken || 0;
  const peerSupport = employee.Peer_Support_Score || 5;
  const growthRating = employee.Professional_Growth_Rating || 3;
  const salarysatisfaction = employee.Salary_Satisfaction || 5;
  const commuteTime = employee.Commute_Time_Mins || 0;
  const tenure = employee.Tenure_Years || 1;
  
  const status = categorizeBurnoutStatus(burnout);
  const rewardPoints = calculateRewardPoints(employee);
  
  // DEEP ANALYTICAL INSIGHTS
  const issues = [];
  const recommendations = [];
  const riskFactors = [];
  const protectiveFactors = [];
  
  // Calculate composite risk scores for analytical depth
  const workloadRisk = (weeklyHours - 40) / 40 + (meetingHours / 20) + (projectCount / 5);
  const recoveryDeficit = Math.max(0, (10 - vacationDays) / 10) + Math.max(0, (5 - wfhDays) / 5);
  const supportDeficit = Math.max(0, (7 - peerSupport) / 7) + Math.max(0, (7 - salarysatisfaction) / 7);
  const overallRisk = (workloadRisk * 0.4) + (recoveryDeficit * 0.3) + (supportDeficit * 0.3);
  
  // Predictive burnout trajectory
  let burnoutTrajectory = 'stable';
  if (overallRisk > 1.5) burnoutTrajectory = 'increasing';
  if (overallRisk < 0.5) burnoutTrajectory = 'improving';
  
  // CRITICAL BURNOUT ANALYSIS (7-10)
  if (burnout >= 7) {
    issues.push('🚨 CRITICAL: Severe burnout detected - immediate action required');
    
    // Root cause analysis
    if (weeklyHours > 55) {
      issues.push(`⚠️ Chronic overwork: ${weeklyHours.toFixed(1)}h/week (38% above healthy limit)`);
      riskFactors.push({ factor: 'Excessive hours', severity: 'critical', impact: 'high' });
    }
    if (vacationDays < 3) {
      issues.push(`⚠️ Severe recovery deficit: Only ${vacationDays} days off taken this year`);
      riskFactors.push({ factor: 'Insufficient rest', severity: 'critical', impact: 'high' });
    }
    if (peerSupport < 4) {
      issues.push('⚠️ Social isolation: Low peer support network');
      riskFactors.push({ factor: 'Poor peer support', severity: 'high', impact: 'medium' });
    }
    
    // Urgent interventions
    recommendations.push('🔴 URGENT: Schedule emergency wellness intervention within 24-48 hours');
    recommendations.push('🔴 Mandate 1-2 weeks immediate paid leave for mental health recovery');
    recommendations.push('🔴 Reassign all non-critical projects to prevent complete burnout');
    recommendations.push('🔴 Establish daily check-ins with manager for next 2 weeks');
    recommendations.push('🔴 Provide access to professional counseling/EAP services immediately');
    
  // WARNING LEVEL ANALYSIS (4-6.99)
  } else if (burnout >= 4) {
    issues.push('⚠️ WARNING: Moderate burnout risk - proactive intervention needed');
    
    // Detailed risk assessment
    if (weeklyHours > 48) {
      issues.push(`⚠️ Elevated workload: ${weeklyHours.toFixed(1)}h/week (${((weeklyHours-40)/40*100).toFixed(0)}% over baseline)`);
      riskFactors.push({ factor: 'Extended hours', severity: 'medium', impact: 'medium' });
    }
    if (meetingHours > 12) {
      issues.push(`⚠️ Meeting fatigue: ${meetingHours.toFixed(1)}h meetings/week reducing productive time`);
      riskFactors.push({ factor: 'Meeting overload', severity: 'medium', impact: 'medium' });
    }
    if (projectCount >= 4) {
      issues.push(`⚠️ Context switching: Managing ${projectCount} concurrent projects`);
      riskFactors.push({ factor: 'High project count', severity: 'medium', impact: 'medium' });
    }
    
    // Strategic interventions
    recommendations.push('🟡 Schedule bi-weekly wellness check-ins to monitor progression');
    recommendations.push(`🟡 Reduce weekly hours to 42-45h (currently ${weeklyHours.toFixed(1)}h)`);
    recommendations.push('🟡 Implement "No-Meeting Fridays" to create focus time');
    recommendations.push('🟡 Prioritize top 2-3 projects, defer or delegate others');
    
  // HEALTHY RANGE (0-3.99)
  } else {
    protectiveFactors.push({ factor: 'Healthy burnout level', strength: 'high' });
    if (weeklyHours < 45) protectiveFactors.push({ factor: 'Sustainable workload', strength: 'high' });
    if (vacationDays > 5) protectiveFactors.push({ factor: 'Good recovery habits', strength: 'medium' });
  }
  
  // UNIVERSAL RISK FACTORS
  if (commuteTime > 60) {
    issues.push(`⏱️ Long commute: ${commuteTime} min/day adds hidden stress`);
    riskFactors.push({ factor: 'Extended commute', severity: 'medium', impact: 'low' });
    recommendations.push('🟢 Negotiate additional WFH days to reduce commute burden');
  }
  
  if (salarysatisfaction < 5) {
    issues.push('💰 Compensation dissatisfaction may amplify burnout');
    riskFactors.push({ factor: 'Low salary satisfaction', severity: 'medium', impact: 'medium' });
    recommendations.push('🟢 Schedule compensation review or discuss career advancement');
  }
  
  if (growthRating < 3) {
    issues.push('📉 Stagnant growth perception reducing engagement');
    riskFactors.push({ factor: 'Limited growth opportunities', severity: 'medium', impact: 'medium' });
    recommendations.push('🟢 Create personalized development plan with quarterly milestones');
  }
  
  // PROTECTIVE FACTORS
  if (peerSupport >= 7) {
    protectiveFactors.push({ factor: 'Strong peer network', strength: 'high' });
  }
  if (tenure < 2 && burnout < 5) {
    protectiveFactors.push({ factor: 'New employee enthusiasm', strength: 'medium' });
  }
  if (wfhDays >= 3) {
    protectiveFactors.push({ factor: 'Flexible work arrangement', strength: 'medium' });
  }
  
  // Calculate severity score (0-100)
  const severityScore = Math.min(100, 
    (burnout * 10) + 
    (Math.max(0, weeklyHours - 40) * 0.5) + 
    (Math.max(0, meetingHours - 10) * 2) +
    (Math.max(0, projectCount - 3) * 5)
  );
  
  // Generate analytical summary
  const analyticalSummary = {
    overallRiskLevel: overallRisk > 1.5 ? 'high' : overallRisk > 0.8 ? 'medium' : 'low',
    trajectory: burnoutTrajectory,
    primaryConcern: issues.length > 0 ? issues[0] : 'No immediate concerns',
    topRecommendation: recommendations.length > 0 ? recommendations[0] : 'Continue current wellness practices',
    riskScore: overallRisk.toFixed(2),
    workloadPressure: workloadRisk.toFixed(2),
    recoveryIndex: (1 - recoveryDeficit).toFixed(2),
    supportLevel: (1 - supportDeficit).toFixed(2)
  };
  
  return {
    status,
    rewardPoints,
    issues,
    recommendations,
    riskFactors,
    protectiveFactors,
    severityScore,
    analyticalSummary,
    metrics: {
      burnout,
      weeklyHours,
      meetingHours,
      projectCount,
      wfhDays,
      vacationDays,
      peerSupport,
      growthRating,
      salarySatisfaction: salarysatisfaction,
      commuteTime,
      tenure
    }
  };
}

// Analyze entire workforce
export function analyzeWorkforce(employees) {
  const enriched = employees.map(emp => ({
    ...emp,
    analysis: analyzeEmployee(emp)
  }));
  
  const healthy = enriched.filter(e => e.analysis.status === 'healthy');
  const warning = enriched.filter(e => e.analysis.status === 'warning');
  const critical = enriched.filter(e => e.analysis.status === 'critical');
  
  const overworked = enriched.filter(e => 
    (e.Weekly_Hours || e.hoursWorked || 40) > 50
  );
  
  const underutilized = enriched.filter(e => 
    (e.Weekly_Hours || e.hoursWorked || 40) < 35
  );
  
  const meetingHeavy = enriched.filter(e => 
    (e.Meeting_Hours || 0) > 15
  );
  
  const highProjectLoad = enriched.filter(e => 
    (e.Project_Count || e.tasksIndividual || 0) >= 5
  );
  
  // Calculate department statistics
  const departmentStats = {};
  enriched.forEach(emp => {
    const dept = emp.Department || emp.department || 'Unknown';
    if (!departmentStats[dept]) {
      departmentStats[dept] = {
        department: dept,
        count: 0,
        totalBurnout: 0,
        totalHours: 0,
        totalProjects: 0,
        healthy: 0,
        warning: 0,
        critical: 0
      };
    }
    
    const stats = departmentStats[dept];
    stats.count++;
    stats.totalBurnout += emp.Burnout_Score || emp.stress / 10 || 0;
    stats.totalHours += emp.Weekly_Hours || emp.hoursWorked || 40;
    stats.totalProjects += emp.Project_Count || emp.tasksIndividual || 0;
    
    if (emp.analysis.status === 'healthy') stats.healthy++;
    if (emp.analysis.status === 'warning') stats.warning++;
    if (emp.analysis.status === 'critical') stats.critical++;
  });
  
  // Calculate averages
  Object.values(departmentStats).forEach(stats => {
    stats.avgBurnout = stats.totalBurnout / stats.count;
    stats.avgHours = stats.totalHours / stats.count;
    stats.avgProjects = stats.totalProjects / stats.count;
    stats.healthStatus = categorizeBurnoutStatus(stats.avgBurnout);
  });
  
  return {
    total: enriched.length,
    healthy: healthy.length,
    warning: warning.length,
    critical: critical.length,
    overworked: overworked.length,
    underutilized: underutilized.length,
    meetingHeavy: meetingHeavy.length,
    highProjectLoad: highProjectLoad.length,
    employees: enriched,
    criticalEmployees: critical.sort((a, b) => b.analysis.severityScore - a.analysis.severityScore),
    overworkedEmployees: overworked.sort((a, b) => 
      (b.Weekly_Hours || b.hoursWorked || 0) - (a.Weekly_Hours || a.hoursWorked || 0)
    ),
    underutilizedEmployees: underutilized,
    meetingHeavyEmployees: meetingHeavy.sort((a, b) => 
      (b.Meeting_Hours || 0) - (a.Meeting_Hours || 0)
    ),
    highProjectLoadEmployees: highProjectLoad,
    topPerformers: healthy
      .sort((a, b) => b.analysis.rewardPoints - a.analysis.rewardPoints)
      .slice(0, 10),
    departmentStats: Object.values(departmentStats)
      .sort((a, b) => b.avgBurnout - a.avgBurnout)
  };
}

// Identify workload redistribution opportunities WITHIN SAME DEPARTMENT
export function findRedistributionOpportunities(workforceAnalysis) {
  const { employees } = workforceAnalysis;
  
  const opportunities = [];
  
  // Group employees by department
  const byDepartment = {};
  employees.forEach(emp => {
    const dept = emp.Department || emp.department;
    if (!byDepartment[dept]) {
      byDepartment[dept] = {
        overworked: [],
        underutilized: []
      };
    }
    
    const hours = emp.Weekly_Hours || emp.hoursWorked || 40;
    const burnout = emp.Burnout_Score || emp.stress / 10 || 0;
    
    if (hours > 50 || burnout >= 7) {
      byDepartment[dept].overworked.push(emp);
    } else if (hours < 35 && burnout < 4) {
      byDepartment[dept].underutilized.push(emp);
    }
  });
  
  // Match within same department
  Object.entries(byDepartment).forEach(([dept, { overworked, underutilized }]) => {
    // Sort by severity
    overworked.sort((a, b) => (b.analysis?.severityScore || 0) - (a.analysis?.severityScore || 0));
    underutilized.sort((a, b) => (a.Weekly_Hours || a.hoursWorked || 0) - (b.Weekly_Hours || b.hoursWorked || 0));
    
    overworked.slice(0, 5).forEach((from, idx) => {
      if (idx < underutilized.length) {
        const to = underutilized[idx];
        
        const fromHours = from.Weekly_Hours || from.hoursWorked || 0;
        const fromProjects = from.Project_Count || from.tasksIndividual || 0;
        const fromBurnout = from.Burnout_Score || from.stress / 10 || 0;
        const fromMeetings = from.Meeting_Hours || 0;
        const fromRole = from.Role || from.role || '';
        
        const toHours = to.Weekly_Hours || to.hoursWorked || 0;
        const toProjects = to.Project_Count || to.tasksIndividual || 0;
        const toBurnout = to.Burnout_Score || to.stress / 10 || 0;
        const toRole = to.Role || to.role || '';
        
        // Determine what to transfer based on roles and workload
        let transferDetails = '';
        if (fromProjects >= 5 && toProjects <= 3) {
          transferDetails = `Delegate a smaller, self-contained project or specific tasks from one of ${from.Employee_ID || from.id}'s projects.`;
        } else if (fromRole.includes('Director') || fromRole.includes('Lead')) {
          transferDetails = `Reassign data analysis, reporting, or research tasks from 2-3 of ${from.Employee_ID || from.id}'s projects.`;
        } else {
          transferDetails = `Transfer one of ${from.Employee_ID || from.id}'s smaller projects or take over specific client accounts for a month.`;
        }
        
        opportunities.push({
          from: {
            id: from.Employee_ID || from.id,
            name: from.name,
            department: dept,
            role: fromRole,
            weeklyHours: fromHours,
            projectCount: fromProjects,
            meetingHours: fromMeetings,
            burnout: fromBurnout
          },
          to: {
            id: to.Employee_ID || to.id,
            name: to.name,
            department: dept,
            role: toRole,
            weeklyHours: toHours,
            projectCount: toProjects,
            burnout: toBurnout
          },
          transferDetails,
          expectedImpact: `Reduces critical burden on ${from.Employee_ID || from.id}, provides growth opportunity for ${to.Employee_ID || to.id}, and balances departmental workload.`,
          priority: fromBurnout >= 8 ? 'critical' : fromBurnout >= 6 ? 'high' : 'medium'
        });
      }
    });
  });
  
  return opportunities.sort((a, b) => {
    const priorityOrder = { critical: 3, high: 2, medium: 1 };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
}

// Generate vacation recommendations
export function generateVacationRecommendations(workforceAnalysis) {
  const { criticalEmployees, employees } = workforceAnalysis;
  
  const recommendations = [];
  
  // Critical employees need immediate vacation
  criticalEmployees.slice(0, 8).forEach(emp => {
    const burnout = emp.Burnout_Score || emp.stress / 10 || 0;
    const vacationTaken = emp.Vacation_Days_Taken || emp.holidaysTaken || 0;
    
    recommendations.push({
      employeeId: emp.Employee_ID || emp.id,
      name: emp.name,
      department: emp.Department || emp.department,
      urgency: burnout >= 8 ? 'immediate' : 'high',
      recommendedDuration: burnout >= 8 ? '2 weeks' : '1 week',
      rationale: `Burnout score ${burnout.toFixed(1)} with only ${vacationTaken} vacation days taken`,
      currentBurnout: burnout,
      vacationTaken
    });
  });
  
  // Also check employees with high hours but no vacation
  employees
    .filter(e => 
      (e.Vacation_Days_Taken || e.holidaysTaken || 0) < 3 &&
      (e.Weekly_Hours || e.hoursWorked || 0) > 45 &&
      (e.Burnout_Score || e.stress / 10 || 0) >= 4
    )
    .slice(0, 5)
    .forEach(emp => {
      if (!recommendations.find(r => r.employeeId === (emp.Employee_ID || emp.id))) {
        const burnout = emp.Burnout_Score || emp.stress / 10 || 0;
        recommendations.push({
          employeeId: emp.Employee_ID || emp.id,
          name: emp.name,
          department: emp.Department || emp.department,
          urgency: 'moderate',
          recommendedDuration: '1 week',
          rationale: `Limited vacation usage with sustained high workload`,
          currentBurnout: burnout,
          vacationTaken: emp.Vacation_Days_Taken || emp.holidaysTaken || 0
        });
      }
    });
  
  return recommendations.sort((a, b) => {
    const urgencyOrder = { immediate: 3, high: 2, moderate: 1 };
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
  });
}

// Generate executive summary
export function generateExecutiveSummary(workforceAnalysis) {
  const healthScore = Math.max(0, 100 - (workforceAnalysis.critical / workforceAnalysis.total * 100));
  
  const priorities = [];
  if (workforceAnalysis.critical > 0) {
    priorities.push(`Address ${workforceAnalysis.critical} critical burnout cases immediately`);
  }
  if (workforceAnalysis.overworked > 0) {
    priorities.push(`Redistribute workload from ${workforceAnalysis.overworked} overworked employees`);
  }
  if (workforceAnalysis.meetingHeavy > 0) {
    priorities.push(`Reduce meeting burden for ${workforceAnalysis.meetingHeavy} employees`);
  }
  
  const positiveTrends = [];
  if (workforceAnalysis.healthy > workforceAnalysis.warning + workforceAnalysis.critical) {
    positiveTrends.push(`${workforceAnalysis.healthy} employees (${(workforceAnalysis.healthy / workforceAnalysis.total * 100).toFixed(0)}%) maintaining healthy balance`);
  }
  if (workforceAnalysis.topPerformers.length > 0) {
    positiveTrends.push(`${workforceAnalysis.topPerformers.length} exemplary performers demonstrating sustainable practices`);
  }
  
  const concerningTrends = [];
  if (workforceAnalysis.critical / workforceAnalysis.total > 0.1) {
    concerningTrends.push(`${(workforceAnalysis.critical / workforceAnalysis.total * 100).toFixed(0)}% of workforce in critical burnout territory`);
  }
  if (workforceAnalysis.highProjectLoad > workforceAnalysis.total * 0.2) {
    concerningTrends.push(`${workforceAnalysis.highProjectLoad} employees carrying excessive project loads`);
  }
  
  return {
    overallHealthScore: Math.round(healthScore),
    top3Priorities: priorities.slice(0, 3),
    positiveTrends,
    concerningTrends,
    actionRequiredBy: workforceAnalysis.critical > 0 
      ? 'Next 48 hours for critical cases, next 2 weeks for systemic changes'
      : 'Next 2 weeks for preventive measures',
    timestamp: new Date().toISOString()
  };
}

// Generate comprehensive AI Orchestrator Report
export function generateAIOrchestrationReport(employees) {
  const workforceAnalysis = analyzeWorkforce(employees);
  const executiveSummary = generateExecutiveSummary(workforceAnalysis);
  const redistributionPlan = findRedistributionOpportunities(workforceAnalysis);
  const vacationPlan = generateVacationRecommendations(workforceAnalysis);
  
  // Generate critical cases with deep analysis
  const criticalCases = workforceAnalysis.criticalEmployees.slice(0, 10).map(emp => {
    const analysis = emp.analysis;
    const burnout = emp.Burnout_Score || emp.stress / 10 || 0;
    const hours = emp.Weekly_Hours || emp.hoursWorked || 40;
    const meetings = emp.Meeting_Hours || 0;
    const projects = emp.Project_Count || emp.tasksIndividual || 0;
    
    // Identify root cause
    let rootCause = '';
    if (hours > 55 && meetings > 20 && projects >= 6) {
      rootCause = 'Systemic overload due to leadership responsibilities and unmanageable demand.';
    } else if (hours > 55 && projects >= 8) {
      rootCause = 'Unmanageable workload, scope creep, and inadequate resource allocation at a senior level.';
    } else if (meetings > 25) {
      rootCause = 'Excessive meeting culture preventing focused work and creating constant context switching.';
    } else {
      rootCause = 'Multiple compounding stressors including workload, limited recovery time, and support gaps.';
    }
    
    // Immediate action plan
    const immediateActions = [];
    if (burnout >= 9) {
      if (projects >= 6) {
        immediateActions.push(`Emergency off-boarding of ${Math.min(3, projects - 3)} projects. Mandate ${Math.ceil(burnout / 5)}-day paid leave immediately. Schedule a 1-on-1 with senior leadership to redefine role scope.`);
      } else {
        immediateActions.push(`Mandate immediate ${Math.ceil(burnout / 5)}-day paid leave. Manager to offload ${Math.min(2, projects)} projects and cancel all non-essential meetings for the next week.`);
      }
    } else if (burnout >= 7) {
      immediateActions.push(`Mandate immediate 2-day paid leave. Manager to offload ${Math.min(2, projects)} projects and cancel all non-essential meetings for the next week.`);
    }
    
    // Long-term strategy
    let longTerm = '';
    if (emp.Role && emp.Role.includes('Director')) {
      longTerm = `Conduct a comprehensive review of ${emp.Role} workload in ${emp.Department || emp.department}, implement mandatory meeting-free blocks, and assign a temporary project lead.`;
    } else if (projects >= 8) {
      longTerm = `Implement a ${emp.Department || emp.department} department-wide workload assessment for ${emp.Role || 'senior roles'}, establish a robust project prioritization framework, and evaluate team capacity.`;
    } else {
      longTerm = `Review workload distribution in ${emp.Department || emp.department}, establish clear project ownership boundaries, and provide additional team support.`;
    }
    
    return {
      employeeId: emp.Employee_ID || emp.id,
      name: emp.name,
      department: emp.Department || emp.department,
      role: emp.Role || emp.role || 'Staff',
      status: analysis.status,
      symptoms: `${burnout >= 9 ? 'Extreme' : 'Severe'} burnout (${burnout.toFixed(1)}), ${hours > 55 ? 'excessive' : 'high'} weekly hours (${hours.toFixed(1)}h), ${meetings > 20 ? 'high' : 'elevated'} meeting load (${meetings.toFixed(1)}h)${projects >= 6 ? `, high project count (${projects})` : ''}.`,
      rootCause,
      immediateAction: immediateActions[0] || analysis.recommendations[0],
      longTerm
    };
  });
  
  // Generate meeting optimization strategies
  const meetingOptimization = workforceAnalysis.meetingHeavyEmployees.slice(0, 10).map(emp => {
    const meetings = emp.Meeting_Hours || 0;
    const targetHours = Math.max(10, meetings * 0.4);
    const role = emp.Role || emp.role || 'Staff';
    
    let strategy = '';
    if (meetings > 25 && role.includes('Director')) {
      strategy = `Implement mandatory 'no meeting days' for directors, empower junior staff to represent in routine meetings, and enforce strict agenda and time limits.`;
    } else if (meetings > 20) {
      strategy = `Actively delegate meeting attendance to relevant team members, introduce 2-hour 'focus blocks' daily where no meetings can be scheduled, and utilize asynchronous communication tools.`;
    } else {
      strategy = `Prioritize strategic meetings only, decline tactical or informational meetings where updates can be shared via email/collaboration platforms, and leverage meeting summaries for absentees.`;
    }
    
    return {
      employeeId: emp.Employee_ID || emp.id,
      name: emp.name,
      role,
      currentMeetings: meetings.toFixed(1),
      targetMeetings: targetHours.toFixed(0),
      strategy
    };
  });
  
  return {
    metadata: {
      title: 'AI Orchestrator Report',
      generatedAt: new Date().toISOString(),
      totalEmployees: workforceAnalysis.total,
      analysisVersion: '2.0'
    },
    executiveSummary: {
      gardenHealth: `${executiveSummary.overallHealthScore}%`,
      topPriorities: executiveSummary.top3Priorities,
      actionRequired: executiveSummary.actionRequiredBy,
      keyInsights: [
        `Immediate, targeted intervention and mandatory breaks for critical burnout cases with multi-factor overload (hours, meetings, projects).`,
        `Systemic reform of our meeting culture, particularly addressing excessive meeting hours for leadership roles.`,
        `Proactive workload management and redistribution strategies to prevent future burnout and leverage underutilized capacity.`
      ]
    },
    criticalCases: {
      title: 'Critical Cases - Immediate Intervention Required',
      count: criticalCases.length,
      cases: criticalCases
    },
    workloadRedistribution: {
      title: 'Workload Redistribution Plan',
      subtitle: 'Same-department transfers to balance workload',
      count: redistributionPlan.length,
      opportunities: redistributionPlan.map(opp => ({
        from: {
          id: opp.from.id,
          name: opp.from.name,
          role: opp.from.role,
          department: opp.from.department,
          description: `${opp.from.role} with ${opp.from.weeklyHours.toFixed(1)} weekly hours, ${opp.from.projectCount} projects, and ${opp.from.burnout.toFixed(1)} burnout.`
        },
        to: {
          id: opp.to.id,
          name: opp.to.name,
          role: opp.to.role,
          department: opp.to.department,
          description: `${opp.to.role} (same role) with ${opp.to.weeklyHours.toFixed(1)} weekly hours, ${opp.to.burnout.toFixed(1)} burnout, and capacity for ${opp.to.projectCount < 3 ? '1-2 additional projects' : 'learning new project aspects'}.`
        },
        transfer: opp.transferDetails,
        impact: opp.expectedImpact
      }))
    },
    vacationRecommendations: {
      title: 'Vacation Recommendations',
      count: vacationPlan.length,
      recommendations: vacationPlan.map(rec => ({
        employeeId: rec.employeeId,
        name: rec.name,
        department: rec.department,
        urgency: rec.urgency,
        duration: rec.recommendedDuration,
        rationale: rec.rationale,
        currentBurnout: rec.currentBurnout.toFixed(1)
      }))
    },
    meetingOptimization: {
      title: 'Meeting Optimization',
      count: meetingOptimization.length,
      strategies: meetingOptimization
    }
  };
}

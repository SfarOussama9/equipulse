// Heuristic emotion engine (v0.1) – will be replaced by AI/ML later.

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const norm = (v, min, max) => clamp((v - min) / (max - min), 0, 1);

export function computeEmotion(emp) {
  // Normalize core metrics
  const nHours       = norm(emp.hoursWorked, 30, 70);          // long hours raise strain
  const nStress      = norm(emp.stress, 0, 90);
  const nIndTasks    = norm(emp.tasksIndividual, 5, 30);
  const nTeamTasks   = norm(emp.tasksTeam, 3, 25);
  const nRemote      = norm(emp.remoteHours, 0, 40);            // moderate remote hours benefit
  const nHolidays    = norm(emp.holidaysTaken, 0, 4);           // more holidays reduce strain

  // Collaboration benefit: average top compatibility
  const compValues = Object.values(emp.compatibility || {});
  const avgCompat  = compValues.length ? compValues.reduce((a,b)=>a+b,0)/compValues.length : 0.5;
  const nCompat    = clamp(avgCompat, 0, 1);

  // Weighted strain vs resilience model
  // strain increases with hours, stress, heavy individual tasks and very low team tasks
  // resilience increases with holidays, balanced remote, compatibility, team tasks
  const strain =
      (0.30 * nHours) +
      (0.35 * nStress) +
      (0.15 * nIndTasks) +
      (0.07 * (1 - nTeamTasks)) +
      (0.05 * (1 - nCompat)) +
      (0.08 * (nRemote > 0.7 ? (nRemote - 0.7) * 2 : 0)); // excessive remote imbalance

  const resilience =
      (0.25 * nHolidays) +
      (0.20 * nCompat) +
      (0.20 * nTeamTasks) +
      (0.15 * (1 - nStress)) +
      (0.10 * (nRemote < 0.6 ? (0.6 - nRemote) * 1.2 : 0.08)) + // moderate remote positive
      (0.10 * (1 - nHours));

  const balanceScore = clamp(resilience - strain, -1, 1);

  // Emotion thresholds (can be tuned)
  // Order: angry, sad, anxious, normal, happy, thriving
  if (balanceScore < -0.55) return 'angry';
  if (balanceScore < -0.25) return 'sad';
  if (balanceScore <  0.00) return 'anxious';
  if (balanceScore <  0.28) return 'normal';
  if (balanceScore <  0.55) return 'happy';
  return 'thriving';
}

export function explainEmotion(emp, emotion) {
  const reasons = [];
  const interventions = [];

  // Collect factors
  if (emp.hoursWorked > 60) {
    reasons.push({ label:'Hours', value: emp.hoursWorked, note:'High workload – consider redistribution.' });
    interventions.push('Rotate tasks or enforce recovery day.');
  } else {
    reasons.push({ label:'Hours', value: emp.hoursWorked, note:'Within moderate range.' });
  }

  if (emp.stress > 70) {
    reasons.push({ label:'Stress', value: emp.stress + '%', note:'Critical stress indicator.' });
    interventions.push('Initiate stress debrief & wellness support.');
  } else if (emp.stress > 50) {
    reasons.push({ label:'Stress', value: emp.stress + '%', note:'Elevated stress – monitor closely.' });
    interventions.push('Suggest short breaks & mindfulness micro-sessions.');
  } else {
    reasons.push({ label:'Stress', value: emp.stress + '%', note:'Healthy range.' });
  }

  reasons.push({
    label: 'Ind Tasks',
    value: emp.tasksIndividual,
    note: emp.tasksIndividual > 25 ? 'Heavy individual load – risk of isolation.' : 'Balanced individual workload.'
  });
  if (emp.tasksIndividual > 25) interventions.push('Shift some individual tasks into pair-programming.');

  reasons.push({
    label: 'Team Tasks',
    value: emp.tasksTeam,
    note: emp.tasksTeam < 5 ? 'Low collaboration – social support declining.' : 'Good collaborative engagement.'
  });
  if (emp.tasksTeam < 5) interventions.push('Encourage join on a team initiative or mentoring.')

  reasons.push({
    label:'Remote Hours',
    value: emp.remoteHours,
    note: emp.remoteHours > 30 ? 'Very high remote – may reduce cohesion.' : 'Remote/onsite balance acceptable.'
  });
  if (emp.remoteHours > 30) interventions.push('Schedule intentional team sync onsite or virtual social call.');

  reasons.push({
    label:'Holidays',
    value: emp.holidaysTaken,
    note: emp.holidaysTaken === 0 ? 'No recent time off – watch for fatigue.' : 'Recent recovery buffer present.'
  });
  if (emp.holidaysTaken === 0) interventions.push('Proactively recommend a recharge day.')

  const compValues = Object.entries(emp.compatibility || {})
    .sort((a,b)=>b[1]-a[1])
    .slice(0,2)
    .map(([k,v])=>`${k} (${(v*100).toFixed(0)}%)`);
  reasons.push({
    label:'Compatibility',
    value: compValues.join(', ') || 'N/A',
    note: compValues.length ? 'Leverage strong peer rapport.' : 'Need more pairing data.'
  });

  // Generic intervention fallback
  if (interventions.length === 0) {
    interventions.push('Maintain current balance & provide growth opportunities.');
  }

  return {
    summary: `Current emotional state inferred as "${emotion}". Factors like workload, stress level, collaboration frequency, rest (holidays), and social compatibility drive this heuristic. These signals will later feed an AI model to anticipate burnout and recommend tailored actions.`,
    factors: reasons,
    interventions: Array.from(new Set(interventions)).slice(0,5)
  };
}

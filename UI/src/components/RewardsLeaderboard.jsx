import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { mapEmployeeData } from '../utils/dataMapper';
import { analyzeWorkforce } from '../utils/burnoutAnalysis';

const BADGE_INFO = {
  'Balance Champion': { emoji: '⚖️', color: 'emerald', description: 'Exceptional work-life balance' },
  'Wellness Advocate': { emoji: '🌟', color: 'cyan', description: 'Promotes healthy practices' },
  'Flexibility Master': { emoji: '🏠', color: 'blue', description: 'Effective remote work usage' },
  'Recovery Expert': { emoji: '🏖️', color: 'purple', description: 'Takes appropriate time off' },
  'Sustainable Star': { emoji: '♻️', color: 'green', description: 'Maintains sustainable pace' },
  'Team Player': { emoji: '🤝', color: 'indigo', description: 'Excellent collaboration' }
};

function assignBadge(employee) {
  const burnout = employee.Burnout_Score || employee.stress / 10 || 0;
  const weeklyHours = employee.Weekly_Hours || employee.hoursWorked || 40;
  const wfhDays = employee.WFH_Days_Per_Week || employee.remoteHours / 8 || 0;
  const vacationDays = employee.Vacation_Days_Taken || employee.holidaysTaken || 0;
  
  if (burnout < 2 && weeklyHours < 45) return 'Balance Champion';
  if (wfhDays >= 3) return 'Flexibility Master';
  if (vacationDays >= 3) return 'Recovery Expert';
  if (weeklyHours < 45 && burnout < 3) return 'Sustainable Star';
  return 'Wellness Advocate';
}

export default function RewardsLeaderboard() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiMessages, setAiMessages] = useState({});
  const [aiScores, setAiScores] = useState({});
  const [aiReasons, setAiReasons] = useState({});
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiLeaderboardIds, setAiLeaderboardIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getAllEmployees();
        const mapped = mapEmployeeData(data);
        setEmployees(mapped);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateLeaderboard = async () => {
    setIsGenerating(true);
    try {
      const result = await api.generateAILeaderboard();
      // result.leaderboard is array of { employee_id, ai_score, message }
      
      const newScores = {};
      const newMessages = {};
      const newReasons = {};
      const ids = [];

      result.leaderboard.forEach(item => {
        newScores[item.employee_id] = item.ai_score;
        newMessages[item.employee_id] = item.message;
        newReasons[item.employee_id] = item.reasoning;
        ids.push(item.employee_id);
      });

      setAiScores(prev => ({ ...prev, ...newScores }));
      setAiMessages(prev => ({ ...prev, ...newMessages }));
      setAiReasons(prev => ({ ...prev, ...newReasons }));
      setAiLeaderboardIds(ids);
      setHasGenerated(true);
    } catch (error) {
      console.error("Failed to generate leaderboard", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMessage = async (emp) => {
    setAiMessages(prev => ({ ...prev, [emp.id]: "✨ Generating personalized kudos..." }));
    try {
      const result = await api.generateRecognitionMessage(emp);
      setAiMessages(prev => ({ ...prev, [emp.id]: result.message }));
      if (result.ai_score) {
        setAiScores(prev => ({ ...prev, [emp.id]: result.ai_score }));
      }
    } catch (error) {
      console.error("Failed to generate message", error);
      setAiMessages(prev => ({ ...prev, [emp.id]: "Failed to generate message." }));
    }
  };

  const workforceAnalysis = useMemo(() => analyzeWorkforce(employees), [employees]);
  
  const leaderboard = useMemo(() => {
    if (!workforceAnalysis || !workforceAnalysis.topPerformers) return [];
    if (!hasGenerated) return []; // Hide until generated
    
    // Filter to only include AI selected employees
    const aiSelectedEmployees = employees.filter(emp => aiLeaderboardIds.includes(emp.id));

    // Map and Sort
    const sorted = aiSelectedEmployees.map(emp => {
      if (aiScores[emp.id]) {
        return {
          ...emp,
          analysis: {
            ...emp.analysis,
            rewardPoints: aiScores[emp.id]
          },
          isAiScore: true
        };
      }
      return emp;
    }).sort((a, b) => 
      b.analysis.rewardPoints - a.analysis.rewardPoints
    );

    return sorted.map(emp => {
      const badge = assignBadge(emp);
      const badgeInfo = BADGE_INFO[badge];
      return {
        ...emp,
        badge,
        badgeInfo
      };
    });
  }, [workforceAnalysis, aiScores, hasGenerated, aiLeaderboardIds, employees]);

  const stats = useMemo(() => ({
    totalPoints: leaderboard.reduce((sum, emp) => sum + emp.analysis.rewardPoints, 0),
    avgPoints: Math.round(leaderboard.reduce((sum, emp) => sum + emp.analysis.rewardPoints, 0) / leaderboard.length),
    topScore: leaderboard[0]?.analysis.rewardPoints || 0
  }), [leaderboard]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-cyan-400/20">
          <span className="text-xs tracking-wide text-cyan-300">🏆 Recognition System</span>
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400">
          Wellness Champions Leaderboard
        </h1>
        <p className="mt-3 text-cyan-100/80 max-w-2xl text-sm sm:text-base">
          Celebrating employees who maintain excellent work-life balance and sustainable practices
        </p>
      </header>

      {/* Stats Overview */}
      {hasGenerated && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-400/30 rounded-2xl p-5">
            <div className="text-3xl font-bold text-yellow-300">{stats.topScore}</div>
            <div className="text-sm text-yellow-200/80 mt-1">Highest Score</div>
            <div className="text-xs text-yellow-300/60 mt-2">Outstanding performance</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 rounded-2xl p-5">
            <div className="text-3xl font-bold text-amber-300">{stats.avgPoints}</div>
            <div className="text-sm text-amber-200/80 mt-1">Average Score</div>
            <div className="text-xs text-amber-300/60 mt-2">Top 10 performers</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-400/30 rounded-2xl p-5">
            <div className="text-3xl font-bold text-orange-300">{leaderboard.length}</div>
            <div className="text-sm text-orange-200/80 mt-1">Champions</div>
            <div className="text-xs text-orange-300/60 mt-2">Recognized employees</div>
          </div>
        </div>
      )}

      {/* Badge Legend */}
      {hasGenerated && (
        <div className="bg-white/5 border border-cyan-400/20 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-cyan-200 mb-4">🎖️ Achievement Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(BADGE_INFO).map(([name, info]) => (
              <div key={name} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <span className="text-2xl">{info.emoji}</span>
                <div>
                  <div className="font-semibold text-sm text-cyan-200">{name}</div>
                  <div className="text-xs text-cyan-300/70">{info.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button / Leaderboard */}
      {!hasGenerated ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-cyan-400/20 rounded-2xl">
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-2xl font-bold text-cyan-100 mb-4">Ready to Reveal the Champions?</h2>
          <p className="text-cyan-200/60 mb-8 max-w-md text-center">
            Our AI will analyze workforce metrics to identify the top 10 employees who best exemplify holistic wellness and sustainable performance.
          </p>
          <button
            onClick={handleGenerateLeaderboard}
            disabled={isGenerating}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Workforce...
              </>
            ) : (
              <>
                ✨ Generate AI Leaderboard
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((emp, idx) => {
            const badgeInfo = emp.badgeInfo;
            const colorClasses = {
              emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-400/30',
              cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-400/30',
              blue: 'from-blue-500/20 to-blue-600/10 border-blue-400/30',
              purple: 'from-purple-500/20 to-purple-600/10 border-purple-400/30',
              green: 'from-green-500/20 to-green-600/10 border-green-400/30',
              indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-400/30'
            };

            const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            const rankClass = idx === 0 
              ? 'text-yellow-300' 
              : idx === 1 
              ? 'text-gray-300' 
              : idx === 2 
              ? 'text-orange-300' 
              : 'text-cyan-300';

            return (
              <div 
                key={emp.id}
                className={`bg-gradient-to-r ${colorClasses[badgeInfo.color]} border rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition`}
                onClick={() => navigate(`/employee/${emp.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${rankClass}`}>
                      {rankEmoji}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-cyan-100">
                        {emp.name}
                      </h3>
                      <p className="text-sm text-cyan-200/70">
                        {emp.department} · {emp.role}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-yellow-300 flex items-center justify-end gap-2">
                      {emp.isAiScore && <span title="AI Generated Score">✨</span>}
                      {emp.analysis.rewardPoints}
                    </div>
                    <div className="text-xs text-yellow-400/70">
                      {emp.isAiScore ? 'AI Wellness Score' : 'Base Points'}
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{badgeInfo.emoji}</span>
                  <div>
                    <div className="font-semibold text-cyan-200">{emp.badge}</div>
                    <div className="text-xs text-cyan-300/70">{badgeInfo.description}</div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-emerald-300">
                      {(emp.stress / 10).toFixed(1)}
                    </div>
                    <div className="text-xs text-emerald-200/70">Burnout Score</div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-cyan-300">
                      {emp.hoursWorked.toFixed(0)}h
                    </div>
                    <div className="text-xs text-cyan-200/70">Weekly Hours</div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-300">
                      {Math.floor(emp.remoteHours / 8)}
                    </div>
                    <div className="text-xs text-blue-200/70">WFH Days</div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-purple-300">
                      {emp.holidaysTaken}
                    </div>
                    <div className="text-xs text-purple-200/70">Vacation Days</div>
                  </div>
                </div>

                {/* Why They're Great */}
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs font-semibold text-cyan-300">Recognition:</div>
                  </div>
                  <p className="text-sm text-cyan-100/80 italic">
                    {aiMessages[emp.id] || "Click 'AI Kudos & Score' to generate personalized recognition..."}
                  </p>
                </div>

                {/* Points Breakdown */}
                <div className="mt-4 pt-4 border-t border-cyan-400/20">
                  <div className="text-xs text-cyan-300/70">
                    <span className="font-semibold">Score Analysis:</span>
                    {emp.isAiScore ? (
                      <div className="mt-1">
                        <span className="italic text-yellow-300/90">✨ {aiReasons[emp.id] || "AI Holistic Wellness Evaluation"}</span>
                      </div>
                    ) : (
                      <>
                        {' '}Base (100) 
                        {(emp.stress / 10) < 3 && ' + Low Burnout (50)'}
                        {(emp.stress / 10) >= 3 && (emp.stress / 10) < 5 && ' + Moderate Burnout (25)'}
                        {emp.hoursWorked < 45 && ' + Good Hours (30)'}
                        {(emp.remoteHours / 8) > 0 && ` + WFH Bonus (${(emp.remoteHours / 8) * 5})`}
                        {(emp.Tenure_Years || 1) > 0 && ` + Tenure (${Math.floor((emp.Tenure_Years || 1) * 5)})`}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Encouragement Message */}
      <div className="mt-8 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 rounded-2xl p-6 text-center">
        <h3 className="text-xl font-bold text-emerald-200 mb-2">
          🌟 Keep Up The Great Work!
        </h3>
        <p className="text-emerald-100/80 text-sm">
          These employees demonstrate that high performance and wellness go hand in hand. 
          Their sustainable practices create lasting value for themselves and the team.
        </p>
      </div>
    </div>
  );
}

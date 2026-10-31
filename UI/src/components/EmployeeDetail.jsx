import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { mapEmployeeData } from '../utils/dataMapper';
import { analyzeEmployee } from '../utils/burnoutAnalysis';
import { computeEmotion } from '../utils/emotionEngine';

export default function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const data = await api.getEmployeeExplanation(id);
        // mapEmployeeData expects an array, so we wrap it
        const mapped = mapEmployeeData([data])[0];
        
        // Add analysis
        const emotion = computeEmotion(mapped);
        const analysis = analyzeEmployee(mapped);
        
        setEmployee({ ...mapped, emotion, burnoutAnalysis: analysis });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadEmployee();
  }, [id]);

  if (loading) return <div className="text-cyan-200 p-8">Loading employee profile...</div>;
  if (error) return <div className="text-red-400 p-8">Error: {error}</div>;
  if (!employee) return <div className="text-cyan-200 p-8">Employee not found</div>;

  const { burnoutAnalysis } = employee;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Link to="/" className="text-cyan-400 hover:text-cyan-300 mb-6 inline-block">← Back to Directory</Link>
      
      {/* Header Card */}
      <div className="bg-white/5 rounded-2xl p-8 border border-cyan-400/20 mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="text-center">
           <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400/40 flex items-center justify-center text-4xl mb-4 mx-auto">
             {employee.gender === 'f' ? '👩‍💼' : '👨‍💼'}
           </div>
           <div className="px-4 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-semibold capitalize">
             {employee.emotion}
           </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-bold text-white mb-2">{employee.name}</h1>
          <div className="text-xl text-cyan-200 mb-4">{employee.role} • {employee.department}</div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-gray-400">Tenure</div>
              <div className="text-lg font-mono text-white">{employee.Tenure_Years} yrs</div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-gray-400">Location</div>
              <div className="text-lg font-mono text-white">{employee.WFH_Days_Per_Week === 5 ? 'Remote' : 'Hybrid'}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-gray-400">ID</div>
              <div className="text-lg font-mono text-white">{employee.id}</div>
            </div>
             <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-gray-400">Points</div>
              <div className="text-lg font-mono text-yellow-400">{burnoutAnalysis.rewardPoints}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Burnout Status */}
      <div className={`rounded-2xl p-6 border-2 mb-8 ${
        burnoutAnalysis.status === 'healthy' ? 'bg-emerald-900/20 border-emerald-500/30' :
        burnoutAnalysis.status === 'warning' ? 'bg-amber-900/20 border-amber-500/30' :
        'bg-red-900/20 border-red-500/30'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Burnout Analysis</h2>
          <div className="text-3xl font-bold">{employee.Predicted_Burnout_Score} <span className="text-sm font-normal opacity-60">/ 10</span></div>
        </div>
        
        <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden mb-6">
          <div 
            className={`h-full ${
              burnoutAnalysis.status === 'healthy' ? 'bg-emerald-500' :
              burnoutAnalysis.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${employee.Predicted_Burnout_Score * 10}%` }}
          ></div>
        </div>

        {/* Insights */}
        <div className="space-y-2">
           {burnoutAnalysis.issues.length > 0 ? (
             burnoutAnalysis.issues.map((issue, i) => (
               <div key={i} className="flex items-start gap-2 text-red-200 bg-red-500/10 p-3 rounded-lg">
                 <span>⚠️</span>
                 <span>{issue}</span>
               </div>
             ))
           ) : (
             <div className="text-emerald-200 bg-emerald-500/10 p-3 rounded-lg">
               ✅ No critical burnout issues detected.
             </div>
           )}
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workload */}
        <div className="bg-white/5 rounded-2xl p-6 border border-cyan-400/20">
          <h3 className="text-xl font-bold text-cyan-300 mb-4">📊 Workload</h3>
          <div className="space-y-4">
            <MetricRow label="Weekly Hours" value={`${employee.Weekly_Hours}h`} sub="Target: 40h" />
            <MetricRow label="Meeting Hours" value={`${employee.Meeting_Hours}h`} sub="Target: <15h" />
            <MetricRow label="Active Projects" value={employee.Project_Count} sub="Target: 3-5" />
            <MetricRow label="Vacation Taken" value={`${employee.Vacation_Days_Taken} days`} sub="Target: >15 days" />
          </div>
        </div>

        {/* Satisfaction & Growth */}
        <div className="bg-white/5 rounded-2xl p-6 border border-purple-400/20">
          <h3 className="text-xl font-bold text-purple-300 mb-4">🌱 Growth & Support</h3>
          <div className="space-y-4">
            <MetricRow label="Peer Support" value={`${employee.Peer_Support_Score}/10`} />
            <MetricRow label="Growth Rating" value={`${employee.Professional_Growth_Rating}/5`} />
            <MetricRow label="Salary Satisfaction" value={`${employee.Salary_Satisfaction}/10`} />
            <MetricRow label="Commute Time" value={`${employee.Commute_Time_Mins} mins`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, sub }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
      <span className="text-gray-300">{label}</span>
      <div className="text-right">
        <div className="font-mono text-white font-bold">{value}</div>
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
      </div>
    </div>
  );
}

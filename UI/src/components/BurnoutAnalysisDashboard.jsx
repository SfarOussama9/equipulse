import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { mapEmployeeData } from '../utils/dataMapper';

export default function BurnoutAnalysisDashboard() {
  const navigate = useNavigate();
  const [highRiskEmployees, setHighRiskEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getHighRiskExplanations();
      const mapped = mapEmployeeData(data);
      setHighRiskEmployees(mapped);
    } catch (error) {
      console.error("Failed to load high risk data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await api.runPredictions();
      await loadData();
    } catch (error) {
      console.error("Failed to refresh data", error);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-cyan-200 p-8">Loading Burnout Analysis...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <header className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-900/20 via-orange-900/20 to-amber-900/20 border border-red-500/10 p-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
              <span className="animate-pulse w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-xs font-medium tracking-wide text-red-300">AI Risk Detection System</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-200">
              Burnout Risk Analysis
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl leading-relaxed">
              Explainable AI (XAI) insights for employees with predicted burnout scores &gt; 7.5. 
              Identify root causes and take proactive action.
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            className="group flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {highRiskEmployees.map((emp) => (
          <div key={emp.id} className="group relative bg-gray-900/40 backdrop-blur-md rounded-3xl p-1 border border-white/5 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-900/20">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            
            <div className="relative p-6 h-full flex flex-col">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center text-2xl border border-red-500/20 group-hover:scale-110 transition-transform">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-red-200 transition-colors">{emp.name}</h3>
                    <div className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                      High Risk
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-orange-400">
                    {emp.Predicted_Burnout_Score}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Risk Score</div>
                </div>
              </div>
              
              {/* Drivers Section */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Primary Drivers</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                </div>
                
                <div className="space-y-2">
                  {emp.Top_Drivers.map((driver, idx) => (
                    <div key={idx} className="relative overflow-hidden bg-black/40 rounded-xl p-3 border border-white/5 group-hover:border-white/10 transition-colors">
                      {/* Progress Bar Background */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-red-500/10 transition-all duration-1000" 
                        style={{ width: `${Math.min(driver.impact * 20, 100)}%` }}
                      />
                      
                      <div className="relative flex justify-between items-center z-10">
                        <span className="text-sm text-gray-300 font-medium">{driver.feature}</span>
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                          +{driver.impact}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-xs text-gray-500">ID: {emp.id}</span>
                <button 
                  onClick={() => navigate(`/employee/${emp.id}`)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  View Profile <span className="text-lg leading-none">›</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {highRiskEmployees.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">All Clear!</h3>
          <p className="text-gray-400">No high-risk employees detected at this time.</p>
        </div>
      )}
    </div>
  );
}

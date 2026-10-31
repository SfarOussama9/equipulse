import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { mapEmployeeData } from '../utils/dataMapper';

export default function InequityRadar() {
  const [hiddenHeroes, setHiddenHeroes] = useState([]);
  const [coasters, setCoasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managerReport, setManagerReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedDept] = useState('Engineering');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [heroes, coastersData] = await Promise.all([
        api.getHiddenHeroes(),
        api.getCoasters()
      ]);
      setHiddenHeroes(mapEmployeeData(heroes));
      setCoasters(mapEmployeeData(coastersData));
    } catch (error) {
      console.error("Error loading inequity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const report = await api.generateManagerReport(selectedDept, 5);
      setManagerReport(report);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return <div className="text-cyan-200 p-8">Loading Inequity Radar...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <header className="mb-12 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-purple-500/20 blur-[100px] -z-10"></div>
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-4">
          Inequity Radar
        </h1>
        <p className="text-xl text-cyan-100/70 max-w-2xl mx-auto leading-relaxed">
          AI-powered detection of workforce imbalances. Identify <span className="text-purple-300 font-semibold">Hidden Heroes</span> and <span className="text-blue-300 font-semibold">Coasters</span> to optimize team health.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Hidden Heroes Section */}
        <div className="group relative bg-gray-900/40 backdrop-blur-xl rounded-3xl p-1 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-3xl" />
          
          <div className="relative p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl border border-purple-500/30">
                  🦸
                </div>
                <div>
                  <h2 className="text-xl font-bold text-purple-100">Hidden Heroes</h2>
                  <p className="text-xs text-purple-300/70">Overworked Junior Talent</p>
                </div>
              </div>
              <span className="bg-purple-500/20 text-purple-200 px-4 py-1.5 rounded-full text-sm font-bold border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                {hiddenHeroes.length} Detected
              </span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {hiddenHeroes.map((hero) => (
                <div key={hero.id} className="bg-black/20 hover:bg-purple-500/10 p-5 rounded-2xl border border-purple-500/10 hover:border-purple-500/30 transition-all group/card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg text-purple-50 group-hover/card:text-white transition-colors">{hero.name}</div>
                      <div className="text-xs font-medium text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded inline-block mt-1">
                        {hero.role} • {hero.department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-400">{(hero.stress / 10).toFixed(1)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-red-300/50 font-bold">Burnout</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 p-2.5 rounded-xl text-center border border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Hours</div>
                      <div className="font-mono text-purple-200 font-bold">{hero.hoursWorked}</div>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-xl text-center border border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Meetings</div>
                      <div className="font-mono text-purple-200 font-bold">{hero.Meeting_Hours}h</div>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-xl text-center border border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Projects</div>
                      <div className="font-mono text-purple-200 font-bold">{hero.Project_Count}</div>
                    </div>
                  </div>
                </div>
              ))}
              {hiddenHeroes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <span className="text-4xl mb-2 opacity-50">✨</span>
                  <p>No hidden heroes detected.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coasters Section */}
        <div className="group relative bg-gray-900/40 backdrop-blur-xl rounded-3xl p-1 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-3xl" />
          
          <div className="relative p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl border border-blue-500/30">
                  🐢
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-100">Coasters</h2>
                  <p className="text-xs text-blue-300/70">Underutilized Senior Roles</p>
                </div>
              </div>
              <span className="bg-blue-500/20 text-blue-200 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                {coasters.length} Detected
              </span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {coasters.map((coaster) => (
                <div key={coaster.id} className="bg-black/20 hover:bg-blue-500/10 p-5 rounded-2xl border border-blue-500/10 hover:border-blue-500/30 transition-all group/card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg text-blue-50 group-hover/card:text-white transition-colors">{coaster.name}</div>
                      <div className="text-xs font-medium text-blue-300/80 bg-blue-500/10 px-2 py-0.5 rounded inline-block mt-1">
                        {coaster.role} • {coaster.department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">{(coaster.stress / 10).toFixed(1)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-emerald-300/50 font-bold">Burnout</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 p-2.5 rounded-xl text-center border border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Hours</div>
                      <div className="font-mono text-blue-200 font-bold">{coaster.hoursWorked}</div>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-xl text-center border border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Meetings</div>
                      <div className="font-mono text-blue-200 font-bold">{coaster.Meeting_Hours}h</div>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-xl text-center border border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Projects</div>
                      <div className="font-mono text-blue-200 font-bold">{coaster.Project_Count}</div>
                    </div>
                  </div>
                </div>
              ))}
              {coasters.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <span className="text-4xl mb-2 opacity-50">✨</span>
                  <p>No coasters detected.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manager Copilot Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">
                🤖
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Manager Co-Pilot</h2>
                <p className="text-cyan-200/60 mt-1">Generate AI-powered action plans to resolve inequities.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className={`px-6 py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 flex items-center gap-2 ${
                  generatingReport
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25'
                }`}
              >
                {generatingReport ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Generate Action Plan
                  </>
                )}
              </button>
            </div>
          </div>

          {managerReport && (
            <div className="space-y-6 animate-fade-in">
              {managerReport.reports.map((item, idx) => (
                <div key={idx} className="bg-white/5 rounded-2xl p-8 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold border border-cyan-500/30">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white">Intervention Plan</h3>
                      <p className="text-sm text-cyan-200/50">Target: {item.employee_id}</p>
                    </div>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed bg-black/20 p-6 rounded-xl border border-white/5">
                      {item.report}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!managerReport && !generatingReport && (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-gray-500">Click generate to see AI recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

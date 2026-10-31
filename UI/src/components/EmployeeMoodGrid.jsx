import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { computeEmotion } from '../utils/emotionEngine';
import { analyzeEmployee } from '../utils/burnoutAnalysis';
import { api } from '../services/api';
import { mapEmployeeData } from '../utils/dataMapper';

// Emotion-specific avatar assets (ensure these files exist)
import alexAngry from '../assets/alexangry.png';
import alexSad from '../assets/alexsad.png';
import alexAnxious from '../assets/alextired.png';
import alexNormal from '../assets/alexnormal.png';
import alexHappy from '../assets/alexhappy.png';
import alexThriving from '../assets/alexthriving.png';

import aliceAngry from '../assets/aliceangry.png';
import aliceSad from '../assets/aliceanxious.png';
import aliceAnxious from '../assets/alicetired.png';
import aliceNormal from '../assets/alicenormal.png';
import aliceHappy from '../assets/alicehappy.png';
import aliceThriving from '../assets/alicethriving.png';

// Emotion visual styles
const EMOTION_STYLES = {
  angry: { 
    gradient: 'from-red-500/20 to-orange-500/10',
    border: 'border-red-400/40',
    text: 'text-red-300',
    badge: 'bg-red-500/20 text-red-300 border-red-400/40'
  },
  sad: { 
    gradient: 'from-blue-500/20 to-indigo-500/10',
    border: 'border-blue-400/40',
    text: 'text-blue-300',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-400/40'
  },
  anxious: { 
    gradient: 'from-amber-500/20 to-yellow-500/10',
    border: 'border-amber-400/40',
    text: 'text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
  },
  normal: { 
    gradient: 'from-gray-500/20 to-slate-500/10',
    border: 'border-gray-400/40',
    text: 'text-gray-300',
    badge: 'bg-gray-500/20 text-gray-300 border-gray-400/40'
  },
  happy: { 
    gradient: 'from-cyan-500/20 to-sky-500/10',
    border: 'border-cyan-400/40',
    text: 'text-cyan-300',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
  },
  thriving: { 
    gradient: 'from-emerald-500/20 to-green-500/10',
    border: 'border-emerald-400/40',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
  }
};

// Avatar map
const AVATARS = {
  male: {
    angry: alexAngry,
    sad: alexSad,
    anxious: alexAnxious,
    normal: alexNormal,
    happy: alexHappy,
    thriving: alexThriving,
    base: alexNormal
  },
  female: {
    angry: aliceAngry,
    sad: aliceSad,
    anxious: aliceAnxious,
    normal: aliceNormal,
    happy: aliceHappy,
    thriving: aliceThriving,
    base: aliceNormal
  }
};

// Select correct avatar
function selectAvatar(empWithEmotion) {
  const pack = empWithEmotion.gender === 'f' ? AVATARS.female : AVATARS.male;
  if (!pack) return AVATARS.male.base;
  return pack[empWithEmotion.emotion] || pack.base;
}

export default function EmployeeMoodGrid() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [emotionFilter, setEmotionFilter] = useState('');
  const [burnoutFilter, setBurnoutFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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

  const enriched = useMemo(() => {
    if (!employees || employees.length === 0) {
      return [];
    }
    return employees.map(e => {
      const emotion = computeEmotion(e);
      const burnoutAnalysis = analyzeEmployee(e);
      return { ...e, emotion, burnoutAnalysis };
    });
  }, [employees]);

  const departments = useMemo(() => 
    [...new Set(employees.map(e => e.department))].sort(),
    [employees]
  );

  const filteredAndSorted = useMemo(() => {
    let filtered = enriched.filter(emp => {
      const matchesSearch = !searchTerm || 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !departmentFilter || emp.department === departmentFilter;
      const matchesEmotion = !emotionFilter || emp.emotion === emotionFilter;
      const matchesBurnout = !burnoutFilter || emp.burnoutAnalysis.status === burnoutFilter;
      
      return matchesSearch && matchesDepartment && matchesEmotion && matchesBurnout;
    });

    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'burnout': return b.burnoutAnalysis.metrics.burnout - a.burnoutAnalysis.metrics.burnout;
        case 'points': return b.burnoutAnalysis.rewardPoints - a.burnoutAnalysis.rewardPoints;
        case 'department': return a.department.localeCompare(b.department);
        default: return 0;
      }
    });

    return filtered;
  }, [enriched, searchTerm, departmentFilter, emotionFilter, burnoutFilter, sortBy]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSorted.slice(startIndex, endIndex);
  }, [filteredAndSorted, currentPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

  const stats = useMemo(() => ({
    total: enriched.length,
    filtered: filteredAndSorted.length,
    healthy: enriched.filter(e => e.burnoutAnalysis.status === 'healthy').length,
    warning: enriched.filter(e => e.burnoutAnalysis.status === 'warning').length,
    critical: enriched.filter(e => e.burnoutAnalysis.status === 'critical').length
  }), [enriched, filteredAndSorted]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, emotionFilter, burnoutFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* HEADER */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-cyan-400/20">
          <span className="text-xs tracking-wide text-cyan-300">Employee Directory · {stats.total} Total</span>
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-emerald-400">
          Employee Directory
        </h1>
        <p className="mt-3 text-cyan-100/80 max-w-2xl text-sm sm:text-base">
          Comprehensive view of all employees with real-time emotional states, burnout analysis, and wellness metrics.
        </p>
      </header>

      {/* STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-400/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-cyan-200">{stats.filtered}</div>
          <div className="text-sm text-cyan-300/80">Showing</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-400/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-200">{stats.healthy}</div>
          <div className="text-sm text-emerald-300/80">Healthy</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-200">{stats.warning}</div>
          <div className="text-sm text-amber-300/80">Warning</div>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-400/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-200">{stats.critical}</div>
          <div className="text-sm text-red-300/80">Critical</div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-cyan-400/20 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="🔍 Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-cyan-400/20 rounded-xl text-cyan-100 placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
          />
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-400/40 rounded-xl text-cyan-50 font-medium focus:outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-400/30 hover:border-indigo-400/60 transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))' }}
          >
            <option value="" className="bg-gray-900 text-cyan-100">🏢 All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept} className="bg-gray-900 text-cyan-100">📁 {dept}</option>
            ))}
          </select>

          <select
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            className="px-4 py-3 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-2 border-pink-400/40 rounded-xl text-cyan-50 font-medium focus:outline-none focus:border-pink-400/70 focus:ring-2 focus:ring-pink-400/30 hover:border-pink-400/60 transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(244, 63, 94, 0.15))' }}
          >
            <option value="" className="bg-gray-900 text-cyan-100">😊 All Emotions</option>
            <option value="thriving" className="bg-gray-900 text-cyan-100">🌟 Thriving</option>
            <option value="happy" className="bg-gray-900 text-cyan-100">😊 Happy</option>
            <option value="normal" className="bg-gray-900 text-cyan-100">😐 Normal</option>
            <option value="anxious" className="bg-gray-900 text-cyan-100">😰 Anxious</option>
            <option value="sad" className="bg-gray-900 text-cyan-100">😢 Sad</option>
            <option value="angry" className="bg-gray-900 text-cyan-100">😡 Angry</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={burnoutFilter}
            onChange={(e) => setBurnoutFilter(e.target.value)}
            className="px-4 py-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-400/40 rounded-xl text-cyan-50 font-medium focus:outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/30 hover:border-emerald-400/60 transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(20, 184, 166, 0.15))' }}
          >
            <option value="" className="bg-gray-900 text-cyan-100">🔥 All Burnout Levels</option>
            <option value="healthy" className="bg-gray-900 text-emerald-300">✅ Healthy (0-3.99)</option>
            <option value="warning" className="bg-gray-900 text-amber-300">⚠️ Warning (4-6.99)</option>
            <option value="critical" className="bg-gray-900 text-red-300">🚨 Critical (7-10)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-400/40 rounded-xl text-cyan-50 font-medium focus:outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/30 hover:border-amber-400/60 transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(249, 115, 22, 0.15))' }}
          >
            <option value="name" className="bg-gray-900 text-cyan-100">🔤 Sort by Name</option>
            <option value="burnout" className="bg-gray-900 text-cyan-100">🔥 Sort by Burnout (High→Low)</option>
            <option value="points" className="bg-gray-900 text-cyan-100">🏆 Sort by Reward Points</option>
            <option value="department" className="bg-gray-900 text-cyan-100">🏢 Sort by Department</option>
          </select>
        </div>

        {(searchTerm || departmentFilter || emotionFilter || burnoutFilter) && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-cyan-300/80">
              Showing {stats.filtered} of {stats.total} employees
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('');
                setEmotionFilter('');
                setBurnoutFilter('');
              }}
              className="px-4 py-2 bg-red-500/20 border border-red-400/40 text-red-200 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* EMPLOYEE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {paginatedEmployees.map(emp => {
          const emotionStyle = EMOTION_STYLES[emp.emotion];
          const genderKey = emp.gender === 'f' ? 'female' : 'male';
          const emotionSet = AVATARS[genderKey];
          const avatarSrc = emotionSet[emp.emotion] || emotionSet.normal;

          return (
            <Link
              key={emp.id}
              to={`/employee/${emp.id}`}
              className={`group bg-gradient-to-br ${emotionStyle.gradient} backdrop-blur-sm rounded-2xl p-6 border-2 ${emotionStyle.border} hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-2xl`}
            >
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                  <img 
                    src={avatarSrc} 
                    alt={emp.name} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Emotion Badge */}
              <div className="flex justify-center mb-4">
                <div className={`px-4 py-1.5 rounded-full ${emotionStyle.badge} border backdrop-blur-sm`}>
                  <span className="text-xs font-semibold capitalize">{emp.emotion}</span>
                </div>
              </div>

              {/* Info */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-1">{emp.name}</h3>
                <p className="text-sm text-cyan-200 mb-0.5">{emp.role}</p>
                <p className="text-xs text-cyan-300/70 capitalize">{emp.department}</p>
              </div>

              {/* Burnout Status */}
              <div className={`flex items-center justify-between mb-4 p-4 rounded-xl border-2 ${
                emp.burnoutAnalysis.status === 'healthy' 
                  ? 'bg-gradient-to-br from-emerald-500/30 to-green-500/20 border-emerald-400/60 shadow-emerald-500/20' :
                emp.burnoutAnalysis.status === 'warning' 
                  ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 border-amber-400/60 shadow-amber-500/20' 
                  : 'bg-gradient-to-br from-red-500/30 to-rose-500/20 border-red-400/60 shadow-red-500/20'
              } shadow-lg`}>
                <div className="text-left">
                  <div className={`text-sm font-bold mb-1 uppercase tracking-wide ${
                    emp.burnoutAnalysis.status === 'healthy' ? 'text-emerald-100' :
                    emp.burnoutAnalysis.status === 'warning' ? 'text-amber-100' : 'text-red-100'
                  }`}>
                    {emp.burnoutAnalysis.status === 'healthy' && '✅ Healthy'}
                    {emp.burnoutAnalysis.status === 'warning' && '⚠️ Warning'}
                    {emp.burnoutAnalysis.status === 'critical' && '🚨 Critical'}
                  </div>
                  <div className={`text-xs font-medium ${
                    emp.burnoutAnalysis.status === 'healthy' ? 'text-emerald-200/80' :
                    emp.burnoutAnalysis.status === 'warning' ? 'text-amber-200/80' : 'text-red-200/80'
                  }`}>Burnout Status</div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    emp.burnoutAnalysis.status === 'healthy' ? 'text-emerald-50' :
                    emp.burnoutAnalysis.status === 'warning' ? 'text-amber-50' : 'text-red-50'
                  }`}>
                    {emp.burnoutAnalysis.metrics.burnout.toFixed(2)}
                  </div>
                  <div className={`text-xs font-medium ${
                    emp.burnoutAnalysis.status === 'healthy' ? 'text-emerald-200/80' :
                    emp.burnoutAnalysis.status === 'warning' ? 'text-amber-200/80' : 'text-red-200/80'
                  }`}>Score (0-10)</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-cyan-200">{typeof emp.hoursWorked === 'number' ? emp.hoursWorked.toFixed(2) : emp.hoursWorked}h</div>
                  <div className="text-xs text-cyan-300/70">Hours</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-cyan-200">{typeof emp.stress === 'number' ? emp.stress.toFixed(2) : emp.stress}%</div>
                  <div className="text-xs text-cyan-300/70">Stress</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-cyan-200">{emp.holidaysTaken}</div>
                  <div className="text-xs text-cyan-300/70">Days Off</div>
                </div>
              </div>

              {/* Wellness Points */}
              <div className="text-center p-3 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-400/20 rounded-lg">
                <div className="text-lg font-bold text-yellow-300">{emp.burnoutAnalysis.rewardPoints}</div>
                <div className="text-xs text-yellow-400/70">Wellness Points</div>
              </div>

              {/* View Details Hint */}
              <div className="mt-4 text-center text-xs text-cyan-300/50 group-hover:text-cyan-300 transition-colors">
                Click for full details →
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAndSorted.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-cyan-200 mb-2">No employees found</h3>
          <p className="text-cyan-300/70 mb-6">Try adjusting your filters or search term</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setDepartmentFilter('');
              setEmotionFilter('');
              setBurnoutFilter('');
            }}
            className="px-6 py-3 bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 rounded-xl hover:bg-cyan-500/30 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* PAGINATION */}
      {filteredAndSorted.length > 0 && totalPages > 1 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-cyan-400/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-cyan-300/80">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length} employees
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white/5 border border-cyan-400/20 text-cyan-200 rounded-lg hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white/5 border border-cyan-400/20 text-cyan-200 rounded-lg hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                ← Prev
              </button>
              
              <div className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 rounded-lg font-semibold text-sm">
                Page {currentPage} of {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-white/5 border border-cyan-400/20 text-cyan-200 rounded-lg hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Next →
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-white/5 border border-cyan-400/20 text-cyan-200 rounded-lg hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

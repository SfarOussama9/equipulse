import './index.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import EmployeeMoodGrid from './components/EmployeeMoodGrid';
import EmployeeDetail from './components/EmployeeDetail';
import InequityRadar from './components/InequityRadar';
import BurnoutAnalysisDashboard from './components/BurnoutAnalysisDashboard';
import RewardsLeaderboard from './components/RewardsLeaderboard';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '😊 Mood Grid', icon: '😊' },
    { path: '/burnout', label: '🔥 Burnout Analysis', icon: '🔥' },
    { path: '/inequity', label: '⚖️ Inequity Radar', icon: '⚖️' },
    { path: '/rewards', label: '🏆 Rewards', icon: '🏆' }
  ];

  return (
    <nav className="flex gap-2 mb-6 text-xs overflow-x-auto pb-2">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`px-4 py-2 rounded-full border whitespace-nowrap transition ${
            location.pathname === item.path
              ? 'bg-cyan-500/30 text-cyan-100 border-cyan-400/50 shadow-lg'
              : 'bg-white/5 text-cyan-200 border-cyan-400/20 hover:bg-cyan-600/20'
          }`}
        >
          <span className="mr-1">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-900 p-4">
        <Navigation />
        <Routes>
          <Route path="/" element={<EmployeeMoodGrid />} />
          <Route path="/employee/:id" element={<EmployeeDetail />} />
          <Route path="/burnout" element={<BurnoutAnalysisDashboard />} />
          <Route path="/inequity" element={<InequityRadar />} />
          <Route path="/rewards" element={<RewardsLeaderboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
import React, { useState } from "react";
import VirtualTree from "../components/Tree3D";

export default function TreeScreen() {
  // Enhanced demo data with more metrics
  const demoEmployees = [
    { 
      name: "Alex", 
      hoursWorked: 90, 
      stress: 30, 
      bias: 0,
      role: "Senior Dev"
    },
    { 
      name: "Sam", 
      hoursWorked: 50, 
      stress: 60, 
      bias: 1,
      role: "Junior Dev"
    },
    { 
      name: "Mia", 
      hoursWorked: 90, 
      stress: 80, 
      bias: 2,
      role: "Team Lead"
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [employees, setEmployees] = useState(demoEmployees);

  const nextEmployee = () => {
    setCurrentIndex((prev) => (prev + 1) % employees.length);
  };

  const prevEmployee = () => {
    setCurrentIndex((prev) => (prev - 1 + employees.length) % employees.length);
  };

  // Function to modify employee data and see tree grow
  const modifyEmployeeData = (field, value) => {
    setEmployees(prev => prev.map((emp, index) => 
      index === currentIndex ? { ...emp, [field]: value } : emp
    ));
  };

  const employee = employees[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900/20 to-gray-900 text-white p-4 sm:p-8">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
          TeamTerrarium
        </h1>
        <p className="text-green-300 text-sm">Don't just manage your team. Cultivate them.</p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Main Tree Display - Fixed height container */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-green-400/20 shadow-2xl mb-6 h-[500px] flex items-center justify-center">
          <VirtualTree employee={employee} />
        </div>

        {/* Controls */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-green-400/20 mb-6">
          {/* Employee Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={prevEmployee}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 border border-gray-500/30"
            >
              ← Previous
            </button>
            
            <div className="text-center">
              <span className="text-green-300 font-semibold">
                {currentIndex + 1} / {employees.length}
              </span>
            </div>
            
            <button
              onClick={nextEmployee}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 border border-gray-500/30"
            >
              Next →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Hours Worked Control */}
            <div>
              <label className="block text-green-300 text-sm font-medium mb-2">
                Hours Worked: {employee.hoursWorked}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={employee.hoursWorked}
                onChange={(e) => modifyEmployeeData('hoursWorked', parseInt(e.target.value))}
                className="w-full h-2 bg-green-900 rounded-lg appearance-none cursor-pointer slider-emerald"
              />
            </div>

            {/* Stress Level Control */}
            <div>
              <label className="block text-yellow-300 text-sm font-medium mb-2">
                Stress Level: {employee.stress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={employee.stress}
                onChange={(e) => modifyEmployeeData('stress', parseInt(e.target.value))}
                className="w-full h-2 bg-yellow-900 rounded-lg appearance-none cursor-pointer slider-amber"
              />
            </div>

            {/* Bias Flags Control */}
            <div>
              <label className="block text-red-300 text-sm font-medium mb-2">
                Bias Flags: {employee.bias}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                value={employee.bias}
                onChange={(e) => modifyEmployeeData('bias', parseInt(e.target.value))}
                className="w-full h-2 bg-red-900 rounded-lg appearance-none cursor-pointer slider-red"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <button
              onClick={() => modifyEmployeeData('stress', Math.max(0, employee.stress - 20))}
              className="px-4 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all duration-300 border border-emerald-400/30"
            >
              Reduce Stress
            </button>
            
            <button
              onClick={() => modifyEmployeeData('hoursWorked', Math.min(100, employee.hoursWorked + 10))}
              className="px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-300 border border-blue-400/30"
            >
              Add Hours
            </button>

            <button
              onClick={() => modifyEmployeeData('bias', Math.max(0, employee.bias - 1))}
              className="px-4 py-2 sm:py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all duration-300 border border-purple-400/30"
            >
              Reduce Bias
            </button>
          </div>
        </div>

        {/* Employee Info */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 bg-gray-800/50 rounded-xl border border-green-400/20">
            <span className="text-green-300 font-semibold">{employee.name}</span>
            <span className="text-gray-400 hidden sm:block">•</span>
            <span className="text-emerald-400">{employee.role}</span>
            <span className="text-gray-400 hidden sm:block">•</span>
            <span className={`text-sm ${employee.stress > 70 ? 'text-red-400' : 'text-green-400'}`}>
              {employee.stress > 70 ? '🚨 Needs Attention' : '🌱 Healthy'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
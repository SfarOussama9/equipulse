const API_BASE_URL = 'http://127.0.0.1:8000';

export const api = {
  async getHighRiskExplanations() {
    const response = await fetch(`${API_BASE_URL}/explain/high-risk`);
    if (!response.ok) throw new Error('Failed to fetch high risk explanations');
    return response.json();
  },

  async getEmployeeExplanation(employeeId) {
    const response = await fetch(`${API_BASE_URL}/explain/employee/${employeeId}`);
    if (!response.ok) throw new Error('Failed to fetch employee explanation');
    return response.json();
  },

  async analyzeInequity() {
    const response = await fetch(`${API_BASE_URL}/inequity/analysis`);
    if (!response.ok) throw new Error('Failed to analyze inequity');
    return response.json();
  },

  async getHiddenHeroes() {
    const response = await fetch(`${API_BASE_URL}/inequity/hidden-heroes`);
    if (!response.ok) throw new Error('Failed to fetch hidden heroes');
    return response.json();
  },

  async getCoasters() {
    const response = await fetch(`${API_BASE_URL}/inequity/coasters`);
    if (!response.ok) throw new Error('Failed to fetch coasters');
    return response.json();
  },

  async generateManagerReport(department, nRecommendations = 3) {
    const response = await fetch(`${API_BASE_URL}/manager/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ department, n_recommendations: nRecommendations }),
    });
    if (!response.ok) throw new Error('Failed to generate manager report');
    return response.json();
  },

  async generateRecognitionMessage(employee) {
    const response = await fetch(`${API_BASE_URL}/manager/recognize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: employee.id,
        name: employee.name,
        role: employee.role,
        points: employee.analysis.rewardPoints,
        burnout_score: employee.stress / 10,
        weekly_hours: employee.hoursWorked
      }),
    });
    if (!response.ok) throw new Error('Failed to generate recognition message');
    return response.json();
  },

  async generateAILeaderboard() {
    const response = await fetch(`${API_BASE_URL}/manager/leaderboard`);
    if (!response.ok) throw new Error('Failed to generate AI leaderboard');
    return response.json();
  },

  async runPredictions(count = 2000) {
    const response = await fetch(`${API_BASE_URL}/predict/run?count=${count}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to run predictions');
    return response.json();
  },

  async getAllEmployees() {
    const response = await fetch(`${API_BASE_URL}/employees/all`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  async getEmployee(id) {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`);
    if (!response.ok) throw new Error('Failed to fetch employee');
    return response.json();
  }
};

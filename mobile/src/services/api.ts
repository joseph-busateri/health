import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

declare const __DEV__: boolean;

const DEFAULT_BASE_URL = 'http://localhost:3000';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? String(process.env.EXPO_PUBLIC_API_URL)
  : DEFAULT_BASE_URL;

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-App-ID': process.env.EXPO_PUBLIC_APP_ID || '12345678-1234-1234-1234-123456789abc',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.method && config.url) {
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log(`API Request: ${config.method.toUpperCase()} ${fullUrl}`);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('API Request Error:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    const message = error.response?.data || error.message;
    console.error('API Response Error:', message);
    return Promise.reject(error);
  }
);

// API Service Methods
export const healthApi = {
  // Bloodwork endpoints
  bloodwork: {
    getHistory: (userId: string) => api.get(`/api/bloodwork/${userId}`),
    getResult: (userId: string, resultId: string) => api.get(`/api/bloodwork/${userId}/${resultId}`),
    addResult: (userId: string, data: any) => api.post(`/api/bloodwork/${userId}`, data),
    addBiomarker: (userId: string, resultId: string, data: any) => 
      api.post(`/api/bloodwork/${userId}/${resultId}/biomarkers`, data),
    getAnalysis: (userId: string, resultId: string) => 
      api.get(`/api/bloodwork/${userId}/${resultId}/analysis`),
    getTrends: (userId: string, biomarkerName: string, months = 12) => 
      api.get(`/api/bloodwork/${userId}/trends/${biomarkerName}?months=${months}`),
    getHealthScore: (userId: string) => api.get(`/api/bloodwork/${userId}/health-score`),
  },

  // Workout endpoints
  workouts: {
    getHistory: (userId: string, limit = 50, offset = 0) => 
      api.get(`/api/workouts/${userId}?limit=${limit}&offset=${offset}`),
    getDetails: (userId: string, workoutId: string) => 
      api.get(`/api/workouts/${userId}/${workoutId}`),
    logWorkout: (userId: string, data: any) => api.post(`/api/workouts/${userId}`, data),
    addExercise: (userId: string, workoutId: string, data: any) => 
      api.post(`/api/workouts/${userId}/${workoutId}/exercises`, data),
    addSet: (userId: string, workoutId: string, exerciseId: string, data: any) => 
      api.post(`/api/workouts/${userId}/${workoutId}/exercises/${exerciseId}/sets`, data),
    getStats: (userId: string, days = 30) => 
      api.get(`/api/workouts/${userId}/stats?days=${days}`),
    getProgress: (userId: string, exerciseName: string, months = 6) => 
      api.get(`/api/workouts/${userId}/exercises/${exerciseName}/progress?months=${months}`),
  },

  // Supplement endpoints
  supplements: {
    getRegimen: (userId: string) => api.get(`/api/supplements/${userId}/regimen`),
    addSupplement: (userId: string, data: any) => api.post(`/api/supplements/${userId}/regimen`, data),
    logIntake: (userId: string, data: any) => api.post(`/api/supplements/${userId}/intake`, data),
    getAdherence: (userId: string, days = 30) => 
      api.get(`/api/supplements/${userId}/adherence?days=${days}`),
    getRecommendations: (userId: string) => api.get(`/api/supplements/${userId}/recommendations`),
    updateSupplement: (userId: string, supplementId: string, data: any) => 
      api.put(`/api/supplements/${userId}/regimen/${supplementId}`, data),
    deleteSupplement: (userId: string, supplementId: string) => 
      api.delete(`/api/supplements/${userId}/regimen/${supplementId}`),
    getBaseline: (userId: string) => api.get(`/supplement-baseline/${userId}`),
  },

  // Recovery endpoints
  recovery: {
    getScore: (userId: string, date?: string) => 
      api.get(`/api/recovery/${userId}/score${date ? `?date=${date}` : ''}`),
    getReadiness: (userId: string) => api.get(`/api/recovery/${userId}/readiness`),
    getDeload: (userId: string) => api.get(`/api/recovery/${userId}/deload`),
    getStrategies: (userId: string) => api.get(`/api/recovery/${userId}/strategies`),
    logHRV: (userId: string, data: any) => api.post(`/api/recovery/${userId}/hrv`, data),
    getHRVTrend: (userId: string, days = 30) => 
      api.get(`/api/recovery/${userId}/hrv/trend?days=${days}`),
  },

  // Goal endpoints
  goals: {
    getTemplates: (category?: string) => 
      api.get(`/api/goals/templates${category ? `?category=${category}` : ''}`),
    createFromTemplate: (userId: string, data: any) => 
      api.post(`/api/goals/${userId}/from-template`, data),
    createCustom: (userId: string, data: any) => api.post(`/api/goals/${userId}/custom`, data),
    getActive: (userId: string) => api.get(`/api/goals/${userId}/active`),
    getDetails: (userId: string, goalId: string) => api.get(`/api/goals/${userId}/${goalId}`),
    updateMetric: (userId: string, goalId: string, metricId: string, data: any) => 
      api.put(`/api/goals/${userId}/${goalId}/metrics/${metricId}`, data),
    recordProgress: (userId: string, goalId: string, data: any) => 
      api.post(`/api/goals/${userId}/${goalId}/progress`, data),
    checkMilestones: (userId: string, goalId: string) => 
      api.post(`/api/goals/${userId}/${goalId}/check-milestones`),
    complete: (userId: string, goalId: string) => 
      api.post(`/api/goals/${userId}/${goalId}/complete`),
    getRecommendations: (userId: string) => api.get(`/api/goals/${userId}/recommendations`),
  },

  // Device integration endpoints
  devices: {
    oura: {
      connect: (userId: string, data: any) => api.post(`/api/devices/oura/${userId}/connect`, data),
      disconnect: (userId: string) => api.post(`/api/devices/oura/${userId}/disconnect`),
      sync: (userId: string) => api.post(`/api/devices/oura/${userId}/sync`),
      getStats: (userId: string, days = 30) => 
        api.get(`/api/devices/oura/${userId}/sync/stats?days=${days}`),
      getReadiness: (userId: string) => api.get(`/api/devices/oura/${userId}/readiness/latest`),
      getSleepTrend: (userId: string, days = 7) => 
        api.get(`/api/devices/oura/${userId}/sleep/trend?days=${days}`),
    },
    appleWatch: {
      connect: (userId: string, data: any) => 
        api.post(`/api/devices/apple-watch/${userId}/connect`, data),
      disconnect: (userId: string) => api.post(`/api/devices/apple-watch/${userId}/disconnect`),
      sync: (userId: string) => api.post(`/api/devices/apple-watch/${userId}/sync`),
      saveHealthKitData: (userId: string, data: any) => 
        api.post(`/api/devices/apple-watch/${userId}/healthkit-data`, data),
      getLatestMetrics: (userId: string) => 
        api.get(`/api/devices/apple-watch/${userId}/metrics/latest`),
      getActivityRings: (userId: string, date?: string) => 
        api.get(`/api/devices/apple-watch/${userId}/activity-rings${date ? `?date=${date}` : ''}`),
      getWorkoutSummary: (userId: string, startDate: string, endDate: string) => 
        api.get(`/api/devices/apple-watch/${userId}/workouts/summary?startDate=${startDate}&endDate=${endDate}`),
      getHRVTrend: (userId: string, days = 30) => 
        api.get(`/api/devices/apple-watch/${userId}/hrv/trend?days=${days}`),
    },
    sleepNumber: {
      connect: (userId: string, data: any) => 
        api.post(`/api/devices/sleep-number/${userId}/connect`, data),
      disconnect: (userId: string) => api.post(`/api/devices/sleep-number/${userId}/disconnect`),
      sync: (userId: string) => api.post(`/api/devices/sleep-number/${userId}/sync`),
      getStats: (userId: string, days = 30) => 
        api.get(`/api/devices/sleep-number/${userId}/sync/stats?days=${days}`),
      getLatestSleep: (userId: string) => 
        api.get(`/api/devices/sleep-number/${userId}/sleep/latest`),
      getSleepTrend: (userId: string, days = 7) => 
        api.get(`/api/devices/sleep-number/${userId}/sleep/trend?days=${days}`),
    },
  },

  // Analytics endpoints
  analytics: {
    getCorrelations: (userId: string, days = 90) => 
      api.get(`/api/analytics/${userId}/correlations?days=${days}`),
    getPredictions: (userId: string, metric: string, days = 30) => 
      api.get(`/api/analytics/${userId}/predictions?metric=${metric}&days=${days}`),
    generateInsights: (userId: string) => api.post(`/api/analytics/${userId}/insights`),
    getGoalProgress: (userId: string) => api.get(`/api/analytics/${userId}/goal-progress`),
    getHealthScore: (userId: string) => api.get(`/api/analytics/${userId}/health-score`),
    getPerformance: (userId: string, timeframe = '30d') => 
      api.get(`/api/analytics/${userId}/performance?timeframe=${timeframe}`),
    getAnomalies: (userId: string, days = 30) => 
      api.get(`/api/analytics/${userId}/anomalies?days=${days}`),
  },

  // Recommendation engine endpoints
  recommendations: {
    getActive: (userId: string) => api.get(`/api/recommendations/active/${userId}`),
    getPrioritized: (userId: string) => api.get(`/api/recommendations/prioritized/${userId}`),
    accept: (recommendationId: string, userNotes?: string) =>
      api.post(`/api/recommendations/${recommendationId}/accept`, userNotes ? { userNotes } : {}),
    reject: (recommendationId: string, rejectionReason?: string) =>
      api.post(`/api/recommendations/${recommendationId}/reject`, rejectionReason ? { rejectionReason } : {}),
  },

  // AI Agent endpoints
  aiAgent: {
    getInsights: (userId: string) => api.post(`/api/ai-agent/${userId}/insights`),
    getRecommendations: (userId: string, category?: string) => 
      api.get(`/api/ai-agent/${userId}/recommendations${category ? `?category=${category}` : ''}`),
    askQuestion: (userId: string, question: string) => 
      api.post(`/api/ai-agent/${userId}/ask`, { question }),
    analyzeData: (userId: string, dataType: string, timeframe: string) => 
      api.post(`/api/ai-agent/${userId}/analyze`, { dataType, timeframe }),
    generateWorkoutPlan: (userId: string, goals: any, preferences: any) => 
      api.post(`/api/ai-agent/${userId}/workout-plan`, { goals, preferences }),
    generateNutrition: (userId: string, goals: any) => 
      api.post(`/api/ai-agent/${userId}/nutrition`, { goals }),
    getDailySummary: (userId: string, date?: string) => 
      api.get(`/api/ai-agent/${userId}/daily-summary${date ? `?date=${date}` : ''}`),
  },

  // Actuarial Risk endpoints
  actuarial: {
    calculate: (userId: string, data: any) => 
      api.post(`/api/actuarial-risk/${userId}/calculate`, data),
    calculateAuto: (userId: string) => 
      api.post(`/api/actuarial-risk/${userId}/calculate-auto`),
    getRecord: (userId: string, date?: string) => 
      api.get(`/api/actuarial-risk/${userId}/record${date ? `?date=${date}` : ''}`),
    getHistory: (userId: string, days = 30) => 
      api.get(`/api/actuarial-risk/${userId}/history?days=${days}`),
  },

  // Sexual Health V2 endpoints (with trend analysis)
  sexualHealthV2: {
    getToday: (userId: string) => 
      api.get(`/api/sexual-health-v2/${userId}/today`),
    getHistory: (userId: string) => 
      api.get(`/api/sexual-health-v2/${userId}/history`),
  },

  // Cardiovascular Engine endpoints
  cardiovascular: {
    getToday: (userId: string, options?: { regenerate?: boolean }) => 
      api.get(`/cardiovascular/${userId}/today${options?.regenerate ? '?regenerate=true' : ''}`),
    getHistory: (userId: string) => 
      api.get(`/cardiovascular/${userId}/history`),
  },
};

export default api;

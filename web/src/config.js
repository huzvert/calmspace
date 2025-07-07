// API Configuration
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_CONFIG = {
  // Use localhost for local development, Azure Functions for production
  BASE_URL: isDevelopment 
    ? 'http://localhost:7071/api'
    : 'https://calmspace-api-esf9eqfcf5cfeag7.canadacentral-01.azurewebsites.net/api',
  
  // SignalR endpoint
  SIGNALR_NEGOTIATE: isDevelopment
    ? 'http://localhost:7071/api/SignalRNegotiate'
    : 'https://calmspace-api-esf9eqfcf5cfeag7.canadacentral-01.azurewebsites.net/api/SignalRNegotiate'
};

// API endpoints
export const API_ENDPOINTS = {
  CREATE_MOOD: `${API_CONFIG.BASE_URL}/CreateMoodEntry`,
  GET_STATS: `${API_CONFIG.BASE_URL}/GetMoodStats`,
  GET_MOOD_HISTORY: `${API_CONFIG.BASE_URL}/GetMoodHistory`,
  SIGNALR_NEGOTIATE: API_CONFIG.SIGNALR_NEGOTIATE,
  REGISTER: `${API_CONFIG.BASE_URL}/RegisterUser`,
  LOGIN: `${API_CONFIG.BASE_URL}/LoginUser`,
  PROFILE: `${API_CONFIG.BASE_URL}/UserProfile`,
  GET_USER_SETTINGS: `${API_CONFIG.BASE_URL}/GetUserSettings`,
  SAVE_USER_SETTINGS: `${API_CONFIG.BASE_URL}/SaveUserSettings`,
  DELETE_ALL_MOOD_ENTRIES: `${API_CONFIG.BASE_URL}/DeleteAllMoodEntries`,
  // Goal management endpoints
  CREATE_GOAL: `${API_CONFIG.BASE_URL}/CreateGoal`,
  GET_GOALS: `${API_CONFIG.BASE_URL}/GetGoals`,
  UPDATE_GOAL: `${API_CONFIG.BASE_URL}/UpdateGoal`,
  DELETE_GOAL: `${API_CONFIG.BASE_URL}/DeleteGoal`
};

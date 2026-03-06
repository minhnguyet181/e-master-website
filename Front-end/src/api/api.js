import axios from "axios";
const BASE_URL = process.env.BACKEND_URL || "http://localhost:1818/e-master";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    console.error("API Error:", error);
    throw error;
  }
);

const api = {
  auth: {
    login: (data) => axiosClient.post("/login", data),
    register: (data) => axiosClient.post("/register", data),
    logout: async () => {
      await axiosClient.post("/logout");
      localStorage.removeItem("token");
    },
  },

  user: {
    profile: () => axiosClient.get("/user/profile"),
    update: (data) => axiosClient.put("/user/update-profile", data),
    updateAIRecommendation: (recommendation) =>
      axiosClient.put("/user/ai-recommendation", { recommendation }),
  },

  ai: {
    generatePlan: (userData) => axiosClient.post("/user/generate-plan", userData),
    chat: (message) => axiosClient.post("/ai/chat", { message }),
    gradeWriting: (essay) => axiosClient.post("/grade-writing", { essay }),
    gradeSpeaking: (transcript) =>
      axiosClient.post("/grade-speaking", { transcript }),
  },
  test: {
  listTests: () => axiosClient.get("/test"),
  getTestsBySkill: skill => axiosClient.get(`/test/skill/${skill}`),
  getTestDetail: id => axiosClient.get(`/test/${id}`),
  getTest: id => axiosClient.get(`/test/${id}/test`),
  getCorrectAnswers: id => axiosClient.get(`/test/${id}/answers`),
  gradeTest: data => axiosClient.post(`/test/grade`, data),
},

  progress: {
    getProgress: () => axiosClient.get("/progress"),
    getWeeklyTasks: () => axiosClient.get("/progress/weekly"),
    updateProgress: (progress) => axiosClient.post("/progress/update", progress),
  },
};

export default api;

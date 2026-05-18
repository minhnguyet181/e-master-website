import axios from "axios";
// Dev: .env.development + package.json proxy | Docker/prod: /e-master (nginx proxy)
const BASE_URL = process.env.REACT_APP_BACKEND_URL || "/e-master";

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
  getGradeJobStatus: (jobId) => axiosClient.get(`/test/grade/jobs/${jobId}`),
  /** Same as gradeTest — dùng cho resourceService / màn hình gọi submit theo tên cũ */
  submitTest: (testId, answers) =>
    axiosClient.post(`/test/grade`, { testId, answers }),
},

  progress: {
    getProgress: () => axiosClient.get("/progress"),
    getWeeklyTasks: () => axiosClient.get("/progress/weekly"),
    updateProgress: (progress) => axiosClient.post("/progress/update", progress),
  },

  dailyPlan: {
    getToday: () => axiosClient.get("/daily-plan/today"),
    completeTask: (task_id, plan_date) => axiosClient.post("/daily-plan/complete", { task_id, plan_date }),
    getStreak: () => axiosClient.get("/daily-plan/streak"),
  },

  copilot: {
    getInsights: () => axiosClient.get("/copilot/insights"),
  },

  learningPath: {
    generate: () => axiosClient.post("/learning-path/generate"),
    get: () => axiosClient.get("/learning-path"),
    completeMilestone: (learningPathId, milestone_index) =>
      axiosClient.post(`/learning-path/${learningPathId}/milestones/complete`, { milestone_index }),
    recommendations: () => axiosClient.get("/learning-path/recommendations"),
  },

  /** Learning library (admin-imported resources in `resources` table) */
  resources: {
    /** Personalized list (auth): respects user band when set */
    list: (params) => axiosClient.get("/resources", { params }),
    /** Full catalog (no band filter): `band` query omitted → all active items */
    listAll: (params) => axiosClient.get("/resources/by-band", { params }),
    getById: (id) => axiosClient.get(`/resources/${id}`),
  },
};

export default api;

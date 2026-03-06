import api from '../api/api';

export async function getWeeklyTasks() {
  try {
    const response = await api.progress.getWeeklyTasks();
    return { success: true, tasks: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch weekly tasks'
    };
  }
}


export async function updateProgress(progressData) {
  try {
    const response = await api.progress.updateProgress(progressData);
    return { success: true, progress: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update progress'
    };
  }
}

export default {
  getWeeklyTasks,
  updateProgress
};

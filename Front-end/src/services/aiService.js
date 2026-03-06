import api from '../api/api';

/**
 * Generate personalized study plan based on user data
 */
export async function generateStudyPlan(userData) {
  try {
    const response = await api.ai.generatePlan(userData);
    return { success: true, plan: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to generate study plan'
    };
  }
}

/**
 * Grade writing essay
 */
export async function gradeWritingEssay(essay) {
  try {
    const response = await api.ai.gradeWriting(essay);
    return { success: true, grade: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to grade writing'
    };
  }
}

/**
 * Grade speaking transcript
 */
export async function gradeSpeakingTranscript(transcript) {
  try {
    const response = await api.ai.gradeSpeaking(transcript);
    return { success: true, grade: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to grade speaking'
    };
  }
}

export default {
  generateStudyPlan,
  gradeWritingEssay,
  gradeSpeakingTranscript
};

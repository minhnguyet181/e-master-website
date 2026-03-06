import api from '../api/api';

/**
 * Get user profile information
 */
export async function getUserProfile() {
  try {
    const response = await api.user.profile();
    return { success: true, user: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch profile'
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(profileData) {
  try {
    const response = await api.user.update(profileData);
    return { success: true, user: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update profile'
    };
  }
}

/**
 * Update AI learning recommendation
 */
export async function updateAIRecommendation(recommendation) {
  try {
    const response = await api.user.updateAIRecommendation(recommendation);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update recommendation'
    };
  }
}

/**
 * Get all available tests
 */
export async function getAvailableTests() {
  try {
    const response = await api.test.listTests();
    return { success: true, tests: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch tests'
    };
  }
}

/**
 * Submit test answers
 */
export async function submitTest(testId, answers) {
  try {
    const response = await api.test.submitTest(testId, answers);
    return { success: true, result: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to submit test'
    };
  }
}

/**
 * Get user's test submissions
 */
export async function getUserTestSubmissions() {
  try {
    const response = await api.test.getUserSubmissions();
    return { success: true, submissions: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch submissions'
    };
  }
}

export default {
  getUserProfile,
  updateUserProfile,
  updateAIRecommendation,
  getAvailableTests,
  submitTest,
  getUserTestSubmissions
};

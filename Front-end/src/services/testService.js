// src/services/test.service.js
import api from '../api'; // file api đã cấu hình sẵn axiosClient + header + token

class TestService {
  async listTests() {
    try {
      const res = await api.test.listTests();
      return res.data;
    } catch (err) {
      console.error("❌ Error fetching all tests:", err);
      throw err;
    }
  }

  // Lấy test theo kỹ năng
  async getTestsBySkill(skill) {
    try {
      const res = await api.test.getTestsBySkill(skill);
      return res.data;
    } catch (err) {
      console.error(`❌ Error fetching tests for skill: ${skill}`, err);
      throw err;
    }
  }

  // Lấy chi tiết 1 test
  async getTestDetail(id) {
    try {
      const res = await api.test.getTestDetail(id);
      return res.data;
    } catch (err) {
      console.error(`❌ Error fetching test detail ID: ${id}`, err);
      throw err;
    }
  }

  // Lấy đáp án đúng của test
  async getCorrectAnswers(id) {
    try {
      const res = await api.test.getCorrectAnswers(id);
      return res.data;
    } catch (err) {
      console.error(`❌ Error getting correct answers for test ID: ${id}`, err);
      throw err;
    }
  }

  // Gửi bài làm để chấm điểm
  async gradeTest(payload) {
    try {
      const res = await api.test.gradeTest(payload);
      return res.data;
    } catch (err) {
      console.error("❌ Error grading test:", err);
      throw err;
    }
  }
}

export default new TestService();

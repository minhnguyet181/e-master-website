// src/services/test.service.js
const Test = require('../models/test.model');

class TestService {

  static async getAllTests() {
    return await Test.findAll();
  }

  static async getTestsByType(skill) {
    return await Test.findAll({
    where: { test_type: skill },
    attributes: ['description'], // chỉ lấy description
  });

  }

  static async getTest(id) {
    const test = await Test.findByPk(id);
    if (!test) throw new Error("Test not found");
    return test;
  }
  static async getCorrectAnswers(id) {
    const test = await Test.findByPk(id);
    if (!test) throw new Error("Test not found");
    return test.correct_answers;
  } 
  static async getTestWithQuestions(id) {
    const test = await Test.findByPk(id);
    if (!test) throw new Error("Test not found");
    return test;
  } 
}


module.exports = TestService;

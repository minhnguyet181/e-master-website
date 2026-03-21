// src/services/test.service.js
const Test = require('../models/test.model');
const TestSection = require('../models/testSection.model');
const TestQuestion = require('../models/testQuestion.model');

class TestService {
  static async getAllTests() {
    return await Test.findAll({
      where: { is_active: true },
      order: [['id', 'ASC']],
    });
  }

  static async getTestsByType(skill) {
    return await Test.findAll({
      where: { test_type: skill, is_active: true },
      order: [['id', 'ASC']],
    });
  }

  static async getTest(id) {
    const test = await Test.findByPk(id);
    if (!test) throw new Error('Test not found');
    return test;
  }

  static async getCorrectAnswers(id) {
    const questions = await TestQuestion.findAll({
      where: { test_id: id },
      attributes: ['public_id', 'question_no', 'correct_answer', 'question_type', 'section_id'],
      order: [['section_id', 'ASC'], ['question_no', 'ASC']],
    });
    return questions
      .filter((q) => q.correct_answer !== null && q.correct_answer !== undefined)
      .map((q) => ({
        public_id: q.public_id,
        question_no: q.question_no,
        question_type: q.question_type,
        section_id: q.section_id,
        correct_answer: q.correct_answer,
      }));
  }

  static async getTestWithQuestions(id) {
    const test = await Test.findByPk(id, {
      include: [
        {
          model: TestSection,
          as: 'sections',
          required: false,
          include: [{ model: TestQuestion, as: 'questions', required: false }],
        },
        // Also include questions without a section (e.g. single prompt tests)
        { model: TestQuestion, as: 'questions', required: false },
      ],
      order: [
        [{ model: TestSection, as: 'sections' }, 'section_no', 'ASC'],
        [{ model: TestSection, as: 'sections' }, { model: TestQuestion, as: 'questions' }, 'question_no', 'ASC'],
        [{ model: TestQuestion, as: 'questions' }, 'question_no', 'ASC'],
      ],
    });
    if (!test) throw new Error('Test not found');
    return test;
  }
}

module.exports = TestService;

const TestService = require('../services/test.service');
const { handleResponse, handleError } = require('./base.controller');

exports.getAll = async (req, res) => {
  try {
    const tests = await TestService.getAllTests();
    handleResponse(res, tests);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getBySkill = async (req, res) => {
  try {
    const tests = await TestService.getTestsByType(req.params.skill);
    handleResponse(res, tests);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getById = async (req, res) => {
  try {
    const test = await TestService.getTest(req.params.id);
    handleResponse(res, test);
  } catch (err) {
    handleError(res, err);
  }
};
exports.getCorrectAnswers = async (req, res) => {
  try {
    const answers = await TestService.getCorrectAnswers(req.params.id);      
    handleResponse(res, answers);
  } catch (err) {
    handleError(res, err);
  }
};
exports.getTestWithQuestions = async (req, res) => {
  try {
    const testWithQuestions = await TestService.getTestWithQuestions(req.params.id);  
    handleResponse(res, testWithQuestions);
  } catch (err) {
    handleError(res, err);
  }
};

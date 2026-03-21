// src/models/testV2.associations.js
// Centralized associations for the new test schema (v2)

const Test = require('./test.model');
const TestSection = require('./testSection.model');
const TestQuestion = require('./testQuestion.model');
const TestAttempt = require('./testAttempt.model');

function applyTestV2Associations() {
  // Tests -> Sections
  Test.hasMany(TestSection, { foreignKey: 'test_id', as: 'sections' });
  TestSection.belongsTo(Test, { foreignKey: 'test_id', as: 'test' });

  // Tests -> Questions
  Test.hasMany(TestQuestion, { foreignKey: 'test_id', as: 'questions' });
  TestQuestion.belongsTo(Test, { foreignKey: 'test_id', as: 'test' });

  // Sections -> Questions
  TestSection.hasMany(TestQuestion, { foreignKey: 'section_id', as: 'questions' });
  TestQuestion.belongsTo(TestSection, { foreignKey: 'section_id', as: 'section' });

  // Attempts -> Test
  Test.hasMany(TestAttempt, { foreignKey: 'test_id', as: 'attempts' });
  TestAttempt.belongsTo(Test, { foreignKey: 'test_id', as: 'test' });
}

module.exports = { applyTestV2Associations };


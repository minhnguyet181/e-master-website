// src/models/testV2.associations.js
// Centralized associations for all models

const User = require('./user.model');
const Test = require('./test.model');
const TestSection = require('./testSection.model');
const TestQuestion = require('./testQuestion.model');
const TestAttempt = require('./testAttempt.model');
const PlacementTest = require('./placementTest.model');
const LearningPath = require('./learningPath.model');
const LearningPathWeek = require('./learningPathWeek.model');
const WeeklyProgress = require('./weeklyProgress.model');
const Resource = require('./resource.model');
const Notification = require('./notification.model');
const AIRecommendation = require('./aiRecommendation.model');
const Conversation = require('./conversation.model');
const Message = require('./message.model');
const PracticeMaterial = require('./practiceMaterial.model');
const PracticePassage = require('./practicePassage.model');
const PracticeQuestion = require('./practiceQuestion.model');
const PracticeAnswer = require('./practiceAnswer.model');
const UserPracticeAttempt = require('./userPracticeAttempt.model');

function applyTestV2Associations() {
  // ── Test hierarchy ──────────────────────────────────────────────
  Test.hasMany(TestSection,  { foreignKey: 'test_id', as: 'sections' });
  TestSection.belongsTo(Test, { foreignKey: 'test_id', as: 'test' });

  Test.hasMany(TestQuestion,  { foreignKey: 'test_id', as: 'questions' });
  TestQuestion.belongsTo(Test, { foreignKey: 'test_id', as: 'test' });

  TestSection.hasMany(TestQuestion,  { foreignKey: 'section_id', as: 'questions' });
  TestQuestion.belongsTo(TestSection, { foreignKey: 'section_id', as: 'section' });

  Test.hasMany(TestAttempt,  { foreignKey: 'test_id', as: 'attempts' });
  TestAttempt.belongsTo(Test, { foreignKey: 'test_id', as: 'test' });

  // ── User relations ──────────────────────────────────────────────
  User.hasMany(TestAttempt,    { foreignKey: 'user_id', as: 'testAttempts' });
  User.hasMany(PlacementTest,  { foreignKey: 'user_id', as: 'placementTests' });
  User.hasMany(LearningPath,   { foreignKey: 'user_id', as: 'learningPaths' });
  User.hasMany(WeeklyProgress, { foreignKey: 'user_id', as: 'weeklyProgress' });
  User.hasMany(Notification,   { foreignKey: 'user_id', as: 'notifications' });
  User.hasMany(AIRecommendation, { foreignKey: 'user_id', as: 'aiRecommendations' });
  User.hasMany(Conversation,   { foreignKey: 'user_id', as: 'conversations' });
  User.hasMany(UserPracticeAttempt, { foreignKey: 'user_id', as: 'practiceAttempts' });

  TestAttempt.belongsTo(User,   { foreignKey: 'user_id', as: 'user' });
  PlacementTest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  LearningPath.belongsTo(User,  { foreignKey: 'user_id', as: 'user' });
  WeeklyProgress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Notification.belongsTo(User,  { foreignKey: 'user_id', as: 'user' });
  Conversation.belongsTo(User,  { foreignKey: 'user_id', as: 'user' });

  // ── Learning path hierarchy ─────────────────────────────────────
  LearningPath.hasMany(LearningPathWeek, { foreignKey: 'learning_path_id', as: 'weeks' });
  LearningPathWeek.belongsTo(LearningPath, { foreignKey: 'learning_path_id', as: 'learningPath' });

  LearningPath.hasMany(WeeklyProgress, { foreignKey: 'learning_path_id', as: 'weeklyProgress' });
  WeeklyProgress.belongsTo(LearningPath, { foreignKey: 'learning_path_id', as: 'learningPath' });

  // ── Conversation → Messages ─────────────────────────────────────
  Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
  Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

  // ── Practice hierarchy ──────────────────────────────────────────
  PracticeMaterial.hasMany(PracticePassage,  { foreignKey: 'material_id', as: 'passages' });
  PracticePassage.belongsTo(PracticeMaterial, { foreignKey: 'material_id', as: 'material' });

  PracticeMaterial.hasMany(PracticeQuestion, { foreignKey: 'material_id', as: 'questions' });
  PracticeQuestion.belongsTo(PracticeMaterial, { foreignKey: 'material_id', as: 'material' });

  PracticePassage.hasMany(PracticeQuestion, { foreignKey: 'passage_id', as: 'questions' });
  PracticeQuestion.belongsTo(PracticePassage, { foreignKey: 'passage_id', as: 'passage' });

  PracticeMaterial.hasOne(PracticeAnswer, { foreignKey: 'material_id', as: 'answerKey' });
  PracticeAnswer.belongsTo(PracticeMaterial, { foreignKey: 'material_id', as: 'material' });

  PracticeMaterial.hasMany(UserPracticeAttempt, { foreignKey: 'material_id', as: 'attempts' });
  UserPracticeAttempt.belongsTo(PracticeMaterial, { foreignKey: 'material_id', as: 'material' });
  UserPracticeAttempt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
}

module.exports = { applyTestV2Associations };

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) tests (metadata)
    await queryInterface.createTable('tests', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      code: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      test_type: {
        type: Sequelize.ENUM('listening', 'reading', 'writing', 'speaking'),
        allowNull: false,
      },
      description: { type: Sequelize.TEXT, allowNull: true },
      duration_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 60 },
      level: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'IELTS' },
      source: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'db' }, // db | static
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      tags: { type: Sequelize.JSONB, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('tests', ['test_type']);
    await queryInterface.addIndex('tests', ['source']);
    await queryInterface.addIndex('tests', ['is_active']);

    // 2) test_sections
    await queryInterface.createTable('test_sections', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      test_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      section_no: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: true },
      content: { type: Sequelize.JSONB, allowNull: true },
      media: { type: Sequelize.JSONB, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addConstraint('test_sections', {
      fields: ['test_id', 'section_no'],
      type: 'unique',
      name: 'uniq_test_sections_test_id_section_no',
    });
    await queryInterface.addIndex('test_sections', ['test_id']);

    // 3) test_questions
    await queryInterface.createTable('test_questions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      test_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      section_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'test_sections', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      public_id: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      question_no: { type: Sequelize.INTEGER, allowNull: false },
      question_type: { type: Sequelize.STRING(50), allowNull: false },
      prompt: { type: Sequelize.TEXT, allowNull: true },
      options: { type: Sequelize.JSONB, allowNull: true },
      correct_answer: { type: Sequelize.TEXT, allowNull: true },
      points: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addConstraint('test_questions', {
      fields: ['test_id', 'section_id', 'question_no'],
      type: 'unique',
      name: 'uniq_test_questions_test_section_question_no',
    });
    await queryInterface.addIndex('test_questions', ['test_id']);
    await queryInterface.addIndex('test_questions', ['section_id']);
    await queryInterface.addIndex('test_questions', ['question_type']);

    // 4) test_attempts
    await queryInterface.createTable('test_attempts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      test_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      test_type: { type: Sequelize.STRING(20), allowNull: false },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'submitted' },
      answers: { type: Sequelize.JSONB, allowNull: false },
      answer_hash: { type: Sequelize.STRING(64), allowNull: false },
      result_json: { type: Sequelize.JSONB, allowNull: true },
      score_numeric: { type: Sequelize.DOUBLE, allowNull: true },
      correct_count: { type: Sequelize.INTEGER, allowNull: true },
      total_count: { type: Sequelize.INTEGER, allowNull: true },
      cache_hit: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      graded_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('test_attempts', ['user_id']);
    await queryInterface.addIndex('test_attempts', ['test_id']);
    await queryInterface.addIndex('test_attempts', ['status']);
    await queryInterface.addIndex('test_attempts', ['answer_hash']);

    // 5) grading_cache
    await queryInterface.createTable('grading_cache', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      cache_key: { type: Sequelize.STRING(200), allowNull: false, unique: true },
      test_type: { type: Sequelize.STRING(20), allowNull: false },
      answer_hash: { type: Sequelize.STRING(64), allowNull: false },
      rubric_ver: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'v1' },
      ai_provider: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'gemini' },
      result_json: { type: Sequelize.JSONB, allowNull: false },
      hit_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('grading_cache', ['answer_hash']);
    await queryInterface.addIndex('grading_cache', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('grading_cache');
    await queryInterface.dropTable('test_attempts');
    await queryInterface.dropTable('test_questions');
    await queryInterface.dropTable('test_sections');

    // drop ENUM type created by Sequelize for tests.test_type
    await queryInterface.dropTable('tests');
    // best-effort cleanup for enum type name (may vary by dialect/version)
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tests_test_type";');
    } catch (e) {
      // ignore
    }
  },
};


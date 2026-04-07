'use strict';
/**
 * Complete MySQL schema migration for E-Master
 * Covers: users, auth, placement, learning path, progress,
 *         resources, tests (4 skills), practice, notifications, AI chat
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, SMALLINT, TINYINT, STRING, TEXT, DATE, DOUBLE, DECIMAL, JSON: SQLJSON, FLOAT } = Sequelize;
    const NOW = Sequelize.fn('NOW');

    // ── 1. users ──────────────────────────────────────────────────
    await queryInterface.createTable('users', {
      id:                   { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      username:             { type: STRING(100), allowNull: false },
      email:                { type: STRING(255), allowNull: false, unique: true },
      password:             { type: STRING(255), allowNull: true },
      google_id:            { type: STRING(255), allowNull: true },
      role:                 { type: STRING(20), allowNull: false, defaultValue: 'student' },
      goal:                 { type: STRING(255), allowNull: true },
      band_target:          { type: STRING(50), allowNull: true },
      current_band:         { type: STRING(50), allowNull: true },
      study_hours_per_day:  { type: TINYINT.UNSIGNED, allowNull: true },
      reason:               { type: STRING(255), allowNull: true },
      ai_recommendation:    { type: TEXT, allowNull: true },
      onboarding_completed: { type: TINYINT, allowNull: false, defaultValue: 0 },
      created_at:           { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:           { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('users', ['role']);

    // ── 2. token_blocklist ────────────────────────────────────────
    await queryInterface.createTable('token_blocklist', {
      id:         { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      token:      { type: TEXT, allowNull: false },
      created_at: { type: DATE, defaultValue: NOW },
    });

    // ── 3. placement_tests ────────────────────────────────────────
    await queryInterface.createTable('placement_tests', {
      id:                    { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:               { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title:                 { type: STRING(255), allowNull: true },
      description:           { type: TEXT, allowNull: true },
      answers:               { type: SQLJSON, allowNull: true },
      scores:                { type: SQLJSON, allowNull: true },
      assessed_band:         { type: STRING(50), allowNull: true },
      assessed_level:        { type: STRING(50), allowNull: true },
      ai_analysis:           { type: TEXT, allowNull: true },
      weak_skills:           { type: SQLJSON, allowNull: true },
      strong_skills:         { type: SQLJSON, allowNull: true },
      recommended_program:   { type: STRING(255), allowNull: true },
      study_recommendations: { type: SQLJSON, allowNull: true },
      is_completed:          { type: TINYINT, allowNull: false, defaultValue: 0 },
      completed_at:          { type: DATE, allowNull: true },
      created_at:            { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:            { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('placement_tests', ['user_id']);
    await queryInterface.addIndex('placement_tests', ['is_completed']);

    // ── 4. learning_paths ─────────────────────────────────────────
    await queryInterface.createTable('learning_paths', {
      id:                { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:           { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title:             { type: STRING(255), allowNull: false },
      current_band:      { type: STRING(50), allowNull: true },
      target_band:       { type: STRING(50), allowNull: true },
      estimated_weeks:   { type: SMALLINT.UNSIGNED, allowNull: true },
      ai_generated_plan: { type: SQLJSON, allowNull: true },
      status:            { type: STRING(20), allowNull: false, defaultValue: 'active' },
      generated_at:      { type: DATE, allowNull: true },
      created_at:        { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:        { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('learning_paths', ['user_id']);
    await queryInterface.addIndex('learning_paths', ['status']);

    // ── 5. learning_path_weeks ────────────────────────────────────
    await queryInterface.createTable('learning_path_weeks', {
      id:                  { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      learning_path_id:    { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'learning_paths', key: 'id' }, onDelete: 'CASCADE' },
      week_number:         { type: SMALLINT.UNSIGNED, allowNull: false },
      focus_skills:        { type: SQLJSON, allowNull: true },
      goals:               { type: SQLJSON, allowNull: true },
      resource_ids:        { type: SQLJSON, allowNull: true },
      test_ids:            { type: SQLJSON, allowNull: true },
      min_completion_rate: { type: DECIMAL(4,2), allowNull: false, defaultValue: 0.70 },
      created_at:          { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:          { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addConstraint('learning_path_weeks', { fields: ['learning_path_id', 'week_number'], type: 'unique', name: 'uq_lpw_path_week' });
    await queryInterface.addIndex('learning_path_weeks', ['learning_path_id']);

    // ── 6. weekly_progress ────────────────────────────────────────
    await queryInterface.createTable('weekly_progress', {
      id:               { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:          { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      learning_path_id: { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'learning_paths', key: 'id' }, onDelete: 'SET NULL' },
      week_number:      { type: SMALLINT.UNSIGNED, allowNull: false },
      week_start_date:  { type: DATE, allowNull: false },
      tasks_total:      { type: SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      tasks_completed:  { type: SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      tests_done:       { type: SQLJSON, allowNull: true },
      resources_viewed: { type: SQLJSON, allowNull: true },
      completion_rate:  { type: DECIMAL(4,2), allowNull: false, defaultValue: 0 },
      reminder_sent:    { type: TINYINT, allowNull: false, defaultValue: 0 },
      reminder_sent_at: { type: DATE, allowNull: true },
      created_at:       { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:       { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addConstraint('weekly_progress', { fields: ['user_id', 'week_number'], type: 'unique', name: 'uq_wp_user_week' });
    await queryInterface.addIndex('weekly_progress', ['user_id']);
    await queryInterface.addIndex('weekly_progress', ['learning_path_id']);
    await queryInterface.addIndex('weekly_progress', ['week_start_date']);

    // ── 7. goals ──────────────────────────────────────────────────
    await queryInterface.createTable('goals', {
      id:          { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:     { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title:       { type: STRING(255), allowNull: false },
      description: { type: TEXT, allowNull: true },
      target_date: { type: DATE, allowNull: true },
      progress:    { type: TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      status:      { type: STRING(50), allowNull: false, defaultValue: 'pending' },
      created_at:  { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:  { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('goals', ['user_id']);
    await queryInterface.addIndex('goals', ['status']);

    // ── 8. resources ──────────────────────────────────────────────
    await queryInterface.createTable('resources', {
      id:              { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      title:           { type: STRING(500), allowNull: false },
      content:         { type: TEXT('long'), allowNull: false },
      summary:         { type: TEXT, allowNull: true },
      resource_type:   { type: STRING(50), allowNull: false },
      skill:           { type: STRING(30), allowNull: false },
      level:           { type: STRING(50), allowNull: true },
      difficulty:      { type: TINYINT.UNSIGNED, allowNull: true, defaultValue: 3 },
      tags:            { type: SQLJSON, allowNull: true },
      keywords:        { type: SQLJSON, allowNull: true },
      url:             { type: STRING(1000), allowNull: true },
      source:          { type: STRING(255), allowNull: true },
      image_url:       { type: STRING(500), allowNull: true },
      video_url:       { type: STRING(500), allowNull: true },
      video_duration:  { type: INTEGER.UNSIGNED, allowNull: true },
      view_count:      { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      helpful_count:   { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      unhelpful_count: { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      average_rating:  { type: DECIMAL(3,2), allowNull: true },
      is_active:       { type: TINYINT, allowNull: false, defaultValue: 1 },
      is_featured:     { type: TINYINT, allowNull: false, defaultValue: 0 },
      metadata:        { type: SQLJSON, allowNull: true },
      created_at:      { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:      { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('resources', ['skill']);
    await queryInterface.addIndex('resources', ['resource_type']);
    await queryInterface.addIndex('resources', ['is_active']);
    await queryInterface.addIndex('resources', ['is_featured']);

    // ── 9. tests ──────────────────────────────────────────────────
    await queryInterface.createTable('tests', {
      id:               { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      code:             { type: STRING(80), allowNull: false, unique: true },
      name:             { type: STRING(255), allowNull: false },
      test_type:        { type: STRING(20), allowNull: false },
      task_type:        { type: STRING(20), allowNull: true },
      description:      { type: TEXT, allowNull: true },
      duration_minutes: { type: SMALLINT.UNSIGNED, allowNull: false, defaultValue: 60 },
      level:            { type: STRING(50), allowNull: false, defaultValue: 'IELTS' },
      audio_url:        { type: STRING(500), allowNull: true },
      pdf_url:          { type: STRING(500), allowNull: true },
      pdf_parsed:       { type: TINYINT, allowNull: false, defaultValue: 0 },
      source:           { type: STRING(20), allowNull: false, defaultValue: 'db' },
      is_active:        { type: TINYINT, allowNull: false, defaultValue: 1 },
      tags:             { type: SQLJSON, allowNull: true },
      metadata:         { type: SQLJSON, allowNull: true },
      created_at:       { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:       { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('tests', ['test_type']);
    await queryInterface.addIndex('tests', ['is_active']);
    await queryInterface.addIndex('tests', ['source']);

    // ── 10. test_sections ─────────────────────────────────────────
    await queryInterface.createTable('test_sections', {
      id:           { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      test_id:      { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'tests', key: 'id' }, onDelete: 'CASCADE' },
      section_no:   { type: TINYINT.UNSIGNED, allowNull: false },
      title:        { type: STRING(255), allowNull: true },
      passage_text: { type: TEXT('long'), allowNull: true },
      audio_url:    { type: STRING(500), allowNull: true },
      image_url:    { type: STRING(500), allowNull: true },
      prompt:       { type: TEXT, allowNull: true },
      content:      { type: SQLJSON, allowNull: true },
      media:        { type: SQLJSON, allowNull: true },
      metadata:     { type: SQLJSON, allowNull: true },
      created_at:   { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:   { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addConstraint('test_sections', { fields: ['test_id', 'section_no'], type: 'unique', name: 'uq_ts_test_section' });
    await queryInterface.addIndex('test_sections', ['test_id']);

    // ── 11. test_questions ────────────────────────────────────────
    await queryInterface.createTable('test_questions', {
      id:             { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      test_id:        { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'tests', key: 'id' }, onDelete: 'CASCADE' },
      section_id:     { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'test_sections', key: 'id' }, onDelete: 'SET NULL' },
      public_id:      { type: STRING(150), allowNull: false, unique: true },
      question_no:    { type: SMALLINT.UNSIGNED, allowNull: false },
      question_type:  { type: STRING(50), allowNull: false },
      prompt:         { type: TEXT, allowNull: true },
      options:        { type: SQLJSON, allowNull: true },
      correct_answer: { type: TEXT, allowNull: true },
      points:         { type: TINYINT.UNSIGNED, allowNull: false, defaultValue: 1 },
      metadata:       { type: SQLJSON, allowNull: true },
      created_at:     { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:     { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addConstraint('test_questions', { fields: ['test_id', 'section_id', 'question_no'], type: 'unique', name: 'uq_tq_test_section_no' });
    await queryInterface.addIndex('test_questions', ['test_id']);
    await queryInterface.addIndex('test_questions', ['section_id']);
    await queryInterface.addIndex('test_questions', ['question_type']);

    // ── 12. test_attempts ─────────────────────────────────────────
    await queryInterface.createTable('test_attempts', {
      id:            { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:       { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      test_id:       { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'tests', key: 'id' }, onDelete: 'CASCADE' },
      test_type:     { type: STRING(20), allowNull: false },
      status:        { type: STRING(20), allowNull: false, defaultValue: 'submitted' },
      answers:       { type: SQLJSON, allowNull: false },
      answer_hash:   { type: STRING(64), allowNull: false },
      result_json:   { type: SQLJSON, allowNull: true },
      score_numeric: { type: DOUBLE, allowNull: true },
      correct_count: { type: SMALLINT.UNSIGNED, allowNull: true },
      total_count:   { type: SMALLINT.UNSIGNED, allowNull: true },
      cache_hit:     { type: TINYINT, allowNull: false, defaultValue: 0 },
      error_message: { type: TEXT, allowNull: true },
      submitted_at:  { type: DATE, allowNull: false, defaultValue: NOW },
      graded_at:     { type: DATE, allowNull: true },
      created_at:    { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:    { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('test_attempts', ['user_id']);
    await queryInterface.addIndex('test_attempts', ['test_id']);
    await queryInterface.addIndex('test_attempts', ['status']);
    await queryInterface.addIndex('test_attempts', ['answer_hash']);

    // ── 13. grading_cache ─────────────────────────────────────────
    await queryInterface.createTable('grading_cache', {
      id:          { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      cache_key:   { type: STRING(200), allowNull: false, unique: true },
      test_type:   { type: STRING(20), allowNull: false },
      answer_hash: { type: STRING(64), allowNull: false },
      rubric_ver:  { type: STRING(30), allowNull: false, defaultValue: 'v1' },
      ai_provider: { type: STRING(30), allowNull: false, defaultValue: 'gemini' },
      result_json: { type: SQLJSON, allowNull: false },
      hit_count:   { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      expires_at:  { type: DATE, allowNull: true },
      created_at:  { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:  { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('grading_cache', ['answer_hash']);
    await queryInterface.addIndex('grading_cache', ['expires_at']);

    // ── 14. practice_materials ────────────────────────────────────
    await queryInterface.createTable('practice_materials', {
      id:               { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      title:            { type: STRING(500), allowNull: false },
      skill:            { type: STRING(20), allowNull: false },
      material_type:    { type: STRING(50), allowNull: false },
      difficulty_level: { type: STRING(20), allowNull: true },
      exam_type:        { type: STRING(50), allowNull: false, defaultValue: 'IELTS' },
      test_number:      { type: SMALLINT.UNSIGNED, allowNull: true },
      topic:            { type: STRING(100), allowNull: true },
      estimated_band:   { type: DECIMAL(2,1), allowNull: true },
      word_count:       { type: SMALLINT.UNSIGNED, allowNull: true },
      duration_minutes: { type: SMALLINT.UNSIGNED, allowNull: true },
      source_file:      { type: STRING(255), allowNull: true },
      tags:             { type: SQLJSON, allowNull: true },
      keywords:         { type: SQLJSON, allowNull: true },
      metadata:         { type: SQLJSON, allowNull: true },
      is_active:        { type: TINYINT, allowNull: false, defaultValue: 1 },
      is_featured:      { type: TINYINT, allowNull: false, defaultValue: 0 },
      view_count:       { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      attempt_count:    { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      average_score:    { type: DECIMAL(3,1), allowNull: true },
      created_at:       { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:       { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('practice_materials', ['skill']);
    await queryInterface.addIndex('practice_materials', ['difficulty_level']);
    await queryInterface.addIndex('practice_materials', ['is_active']);

    // ── 15. practice_passages ─────────────────────────────────────
    await queryInterface.createTable('practice_passages', {
      id:             { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      material_id:    { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'practice_materials', key: 'id' }, onDelete: 'CASCADE' },
      passage_number: { type: TINYINT.UNSIGNED, allowNull: false },
      passage_title:  { type: STRING(500), allowNull: true },
      content:        { type: TEXT('long'), allowNull: false },
      audio_url:      { type: STRING(500), allowNull: true },
      image_url:      { type: STRING(500), allowNull: true },
      summary:        { type: TEXT, allowNull: true },
      word_count:     { type: SMALLINT.UNSIGNED, allowNull: true },
      created_at:     { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addConstraint('practice_passages', { fields: ['material_id', 'passage_number'], type: 'unique', name: 'uq_pp_material_passage' });
    await queryInterface.addIndex('practice_passages', ['material_id']);

    // ── 16. practice_questions ────────────────────────────────────
    await queryInterface.createTable('practice_questions', {
      id:              { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      material_id:     { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'practice_materials', key: 'id' }, onDelete: 'CASCADE' },
      passage_id:      { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'practice_passages', key: 'id' }, onDelete: 'SET NULL' },
      question_number: { type: SMALLINT.UNSIGNED, allowNull: false },
      question_text:   { type: TEXT, allowNull: false },
      question_type:   { type: STRING(50), allowNull: true },
      options:         { type: SQLJSON, allowNull: true },
      correct_answer:  { type: TEXT, allowNull: true },
      explanation:     { type: TEXT, allowNull: true },
      points:          { type: TINYINT.UNSIGNED, allowNull: false, defaultValue: 1 },
      difficulty:      { type: STRING(20), allowNull: true },
      created_at:      { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addConstraint('practice_questions', { fields: ['material_id', 'question_number'], type: 'unique', name: 'uq_pq_material_qno' });
    await queryInterface.addIndex('practice_questions', ['material_id']);
    await queryInterface.addIndex('practice_questions', ['passage_id']);

    // ── 17. practice_answers ──────────────────────────────────────
    await queryInterface.createTable('practice_answers', {
      id:                   { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      material_id:          { type: INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'practice_materials', key: 'id' }, onDelete: 'CASCADE' },
      answer_key:           { type: SQLJSON, allowNull: false },
      detailed_explanation: { type: TEXT, allowNull: true },
      scoring_guide:        { type: SQLJSON, allowNull: true },
      created_at:           { type: DATE, allowNull: false, defaultValue: NOW },
    });

    // ── 18. user_practice_attempts ────────────────────────────────
    await queryInterface.createTable('user_practice_attempts', {
      id:                  { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:             { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      material_id:         { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'practice_materials', key: 'id' }, onDelete: 'CASCADE' },
      answers:             { type: SQLJSON, allowNull: false },
      score:               { type: DECIMAL(3,1), allowNull: true },
      time_spent_minutes:  { type: SMALLINT.UNSIGNED, allowNull: true },
      correct_count:       { type: SMALLINT.UNSIGNED, allowNull: true },
      incorrect_count:     { type: SMALLINT.UNSIGNED, allowNull: true },
      skipped_count:       { type: SMALLINT.UNSIGNED, allowNull: true },
      accuracy_rate:       { type: DECIMAL(5,2), allowNull: true },
      ai_feedback:         { type: TEXT, allowNull: true },
      weak_areas:          { type: SQLJSON, allowNull: true },
      strong_areas:        { type: SQLJSON, allowNull: true },
      recommendations:     { type: SQLJSON, allowNull: true },
      started_at:          { type: DATE, allowNull: true },
      submitted_at:        { type: DATE, allowNull: true, defaultValue: NOW },
      created_at:          { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('user_practice_attempts', ['user_id']);
    await queryInterface.addIndex('user_practice_attempts', ['material_id']);
    await queryInterface.addIndex('user_practice_attempts', ['submitted_at']);

    // ── 19. notifications ─────────────────────────────────────────
    await queryInterface.createTable('notifications', {
      id:         { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:    { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title:      { type: STRING(255), allowNull: true },
      message:    { type: TEXT, allowNull: true },
      type:       { type: STRING(50), allowNull: false, defaultValue: 'info' },
      is_read:    { type: TINYINT, allowNull: false, defaultValue: 0 },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['is_read']);
    await queryInterface.addIndex('notifications', ['created_at']);

    // ── 20. ai_recommendations ────────────────────────────────────
    await queryInterface.createTable('ai_recommendations', {
      id:                  { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:             { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      recommendation_type: { type: STRING(100), allowNull: true },
      content:             { type: TEXT, allowNull: true },
      score:               { type: DOUBLE, allowNull: true },
      created_at:          { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:          { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('ai_recommendations', ['user_id']);

    // ── 21. conversations ─────────────────────────────────────────
    await queryInterface.createTable('conversations', {
      id:         { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:    { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      topic:      { type: STRING(255), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('conversations', ['user_id']);

    // ── 22. messages ──────────────────────────────────────────────
    await queryInterface.createTable('messages', {
      id:              { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      conversation_id: { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'conversations', key: 'id' }, onDelete: 'CASCADE' },
      role:            { type: STRING(20), allowNull: false, defaultValue: 'user' },
      content:         { type: TEXT, allowNull: false },
      created_at:      { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:      { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('messages', ['conversation_id']);

    // ── 23. programs ──────────────────────────────────────────────
    await queryInterface.createTable('programs', {
      id:          { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name:        { type: STRING(255), allowNull: false },
      description: { type: TEXT, allowNull: true },
      created_at:  { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at:  { type: DATE, allowNull: false, defaultValue: NOW },
    });

    // ── 24. user_enrollments ──────────────────────────────────────
    await queryInterface.createTable('user_enrollments', {
      id:          { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id:     { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      program_id:  { type: INTEGER.UNSIGNED, allowNull: true, references: { model: 'programs', key: 'id' }, onDelete: 'SET NULL' },
      enrolled_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });
    await queryInterface.addIndex('user_enrollments', ['user_id']);
  },

  async down(queryInterface) {
    const tables = [
      'user_enrollments', 'programs', 'messages', 'conversations',
      'ai_recommendations', 'notifications', 'user_practice_attempts',
      'practice_answers', 'practice_questions', 'practice_passages',
      'practice_materials', 'grading_cache', 'test_attempts',
      'test_questions', 'test_sections', 'tests', 'resources', 'goals',
      'weekly_progress', 'learning_path_weeks', 'learning_paths',
      'placement_tests', 'token_blocklist', 'users',
    ];
    for (const t of tables) {
      await queryInterface.dropTable(t).catch(() => {});
    }
  },
};

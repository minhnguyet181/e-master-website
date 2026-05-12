'use strict';

module.exports = {
  async up(queryInterface) {
    const [resourceIndexes] = await queryInterface.sequelize.query(
      "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resources'"
    );
    const existingResourceIndexNames = new Set(resourceIndexes.map((r) => r.INDEX_NAME));

    if (!existingResourceIndexNames.has('idx_resources_active_skill_type_sort')) {
      await queryInterface.addIndex(
        'resources',
        ['is_active', 'skill', 'resource_type', 'is_featured', 'view_count'],
        { name: 'idx_resources_active_skill_type_sort' }
      );
    }

    if (!existingResourceIndexNames.has('idx_resources_active_exam_topic_created')) {
      await queryInterface.addIndex(
        'resources',
        ['is_active', 'exam_type', 'topic', 'created_at'],
        { name: 'idx_resources_active_exam_topic_created' }
      );
    }

    const [attemptIndexes] = await queryInterface.sequelize.query(
      "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'test_attempts'"
    );
    const existingAttemptIndexNames = new Set(attemptIndexes.map((r) => r.INDEX_NAME));

    if (!existingAttemptIndexNames.has('idx_test_attempts_user_test_submitted')) {
      await queryInterface.addIndex(
        'test_attempts',
        ['user_id', 'test_id', 'submitted_at'],
        { name: 'idx_test_attempts_user_test_submitted' }
      );
    }

    const [cacheIndexes] = await queryInterface.sequelize.query(
      "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grading_cache'"
    );
    const existingCacheIndexNames = new Set(cacheIndexes.map((r) => r.INDEX_NAME));

    if (!existingCacheIndexNames.has('idx_grading_cache_type_hash_expiry')) {
      await queryInterface.addIndex(
        'grading_cache',
        ['test_type', 'answer_hash', 'expires_at'],
        { name: 'idx_grading_cache_type_hash_expiry' }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('grading_cache', 'idx_grading_cache_type_hash_expiry').catch(() => {});
    await queryInterface.removeIndex('test_attempts', 'idx_test_attempts_user_test_submitted').catch(() => {});
    await queryInterface.removeIndex('resources', 'idx_resources_active_exam_topic_created').catch(() => {});
    await queryInterface.removeIndex('resources', 'idx_resources_active_skill_type_sort').catch(() => {});
  },
};

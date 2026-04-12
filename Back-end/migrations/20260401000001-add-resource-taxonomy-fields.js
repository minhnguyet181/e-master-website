'use strict';
/**
 * Migration: Add taxonomy fields (exam_type, topic) and FULLTEXT index to resources table
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('resources');

    // Add exam_type column if not exists
    if (!tableDesc.exam_type) {
      await queryInterface.addColumn('resources', 'exam_type', {
        type: Sequelize.STRING(20),
        allowNull: true,
        after: 'resource_type',
      });
    }

    // Add topic column if not exists
    if (!tableDesc.topic) {
      await queryInterface.addColumn('resources', 'topic', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'exam_type',
      });
    }

    // Add regular indexes (ignore if already exist)
    const [indexes] = await queryInterface.sequelize.query(
      "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resources'"
    );
    const indexNames = indexes.map(r => r.INDEX_NAME);

    if (!indexNames.includes('idx_res_exam_type')) {
      await queryInterface.addIndex('resources', ['exam_type'], { name: 'idx_res_exam_type' });
    }
    if (!indexNames.includes('idx_res_topic')) {
      await queryInterface.addIndex('resources', ['topic'], { name: 'idx_res_topic' });
    }

    // Add FULLTEXT index if not exists
    // Note: keywords is a JSON column — MySQL cannot FULLTEXT-index JSON columns directly.
    // Index only TEXT/VARCHAR columns: title, content, summary.
    if (!indexNames.includes('ft_resources_search')) {
      await queryInterface.sequelize.query(
        'ALTER TABLE resources ADD FULLTEXT INDEX ft_resources_search (title, content, summary)'
      );
    }
  },

  async down(queryInterface) {
    // Remove FULLTEXT index
    await queryInterface.sequelize.query(
      'ALTER TABLE resources DROP INDEX ft_resources_search'
    );

    // Remove regular indexes
    await queryInterface.removeIndex('resources', 'idx_res_topic');
    await queryInterface.removeIndex('resources', 'idx_res_exam_type');

    // Remove columns
    await queryInterface.removeColumn('resources', 'topic');
    await queryInterface.removeColumn('resources', 'exam_type');
  },
};

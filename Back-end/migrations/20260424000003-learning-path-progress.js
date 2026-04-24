'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, JSON: SQLJSON, DECIMAL, DATE } = Sequelize;
    const NOW = Sequelize.fn('NOW');

    await queryInterface.createTable('learning_path_progress', {
      id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      learning_path_id: { type: INTEGER.UNSIGNED, allowNull: false, references: { model: 'learning_paths', key: 'id' }, onDelete: 'CASCADE' },
      current_milestone_index: { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      completed_milestone_indexes: { type: SQLJSON, allowNull: true },
      completion_rate: { type: DECIMAL(4, 2), allowNull: false, defaultValue: 0 },
      last_activity_at: { type: DATE, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addConstraint('learning_path_progress', {
      fields: ['user_id', 'learning_path_id'],
      type: 'unique',
      name: 'uq_lpp_user_path',
    });
    await queryInterface.addIndex('learning_path_progress', ['user_id']);
    await queryInterface.addIndex('learning_path_progress', ['learning_path_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('learning_path_progress');
  },
};


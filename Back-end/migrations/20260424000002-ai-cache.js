'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, STRING, TEXT, DATE } = Sequelize;
    const NOW = Sequelize.fn('NOW');

    await queryInterface.createTable('ai_cache', {
      id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      cache_key: { type: STRING(255), allowNull: false, unique: true },
      cache_type: { type: STRING(50), allowNull: false },
      model: { type: STRING(100), allowNull: true },
      prompt_hash: { type: STRING(128), allowNull: false },
      result_text: { type: TEXT('long'), allowNull: false },
      hit_count: { type: INTEGER, allowNull: false, defaultValue: 0 },
      expires_at: { type: DATE, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addIndex('ai_cache', ['cache_type']);
    await queryInterface.addIndex('ai_cache', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ai_cache');
  },
};


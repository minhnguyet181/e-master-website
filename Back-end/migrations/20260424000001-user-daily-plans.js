'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, DATE, DATEONLY, JSON, BOOLEAN } = Sequelize;
    const NOW = Sequelize.fn('NOW');

    await queryInterface.createTable('user_daily_plans', {
      id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: INTEGER.UNSIGNED, allowNull: false },
      plan_date: { type: DATEONLY, allowNull: false },
      tasks: { type: JSON, allowNull: false },
      completed_task_ids: { type: JSON, allowNull: true },
      is_completed: { type: BOOLEAN, allowNull: false, defaultValue: false },
      completed_at: { type: DATE, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addIndex('user_daily_plans', ['user_id', 'plan_date'], {
      unique: true,
      name: 'uq_user_daily_plans_user_date',
    });
    await queryInterface.addIndex('user_daily_plans', ['user_id']);
    await queryInterface.addIndex('user_daily_plans', ['plan_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_daily_plans');
  },
};


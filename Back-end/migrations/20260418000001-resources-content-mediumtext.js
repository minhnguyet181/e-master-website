'use strict';
/**
 * MySQL TEXT maxes at 65535 bytes; large tips / JSON-stringified bilingual content exceed that.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('resources', 'content', {
      type: Sequelize.TEXT('medium'),
      allowNull: false,
      comment: 'Nội dung đầy đủ của tài liệu (dùng để chatbot tham khảo)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('resources', 'content', {
      type: Sequelize.TEXT,
      allowNull: false,
      comment: 'Nội dung đầy đủ của tài liệu (dùng để chatbot tham khảo)',
    });
  },
};

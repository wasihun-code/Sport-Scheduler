/* eslint-disable no-unused-vars */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.changeColumn('Sessions', 'canceled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    queryInterface.changeColumn('Sessions', 'reason', {
      type: Sequelize.TEXT,
      defaultValue: null,
    });
  },

  // eslint-disable-next-line no-empty-function
  async down(queryInterface, Sequelize) {
  },
};

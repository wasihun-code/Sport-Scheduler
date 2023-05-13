/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Sessions', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    });
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, _Sequelize) => {
    await queryInterface.removeColumn('Sessions', 'userId');
  },
};

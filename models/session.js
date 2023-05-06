/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async add_session({
      dueDate, venue, num_players,
    }) {
      return this.create({
        dueDate, venue, num_players,
      });
    }
  }
  Session.init({
    dueDate: DataTypes.DATE,
    venue: DataTypes.STRING,
    num_players: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};

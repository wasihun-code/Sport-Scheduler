/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      // define association here
      this.hasMany(models.PlayersName, {
        foreignKey: 'sessionId',
      });
    }

    static add_session({
      dueDate, venue, num_players,
    }) {
      return this.create({
        dueDate, venue, num_players,
      });
    }

    static async remove_session(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static update_existing_session({
      dueDate, venue, num_players, id,
    }) {
      return this.update({
        dueDate, venue, num_players,
      }, {
        where: {
          id,
        },
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

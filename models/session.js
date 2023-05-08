/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      // define association here
      this.belongsTo(models.Sport, {
        foreignKey: {
          name: 'sportId',
          allowNull: false,
          onDelete: 'CASCADE',
        },
      });

      this.hasMany(models.PlayersName, {
        foreignKey: 'sessionId',
        onDelete: 'CASCADE',
      });
    }

    static add_session({
      dueDate, venue, num_players, sportId,
    }) {
      return this.create({
        dueDate, venue, num_players, sportId,
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
      dueDate, venue, num_players, sportId, id,
    }) {
      console.log('Update was successeful;');
      return this.update({
        dueDate, venue, num_players, sportId,
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
    sportId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};

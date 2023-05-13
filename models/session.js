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
      dueDate, venue, num_players, sportId, userId,
    }) {
      return this.create({
        dueDate, venue, num_players, sportId, userId,
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
      dueDate, venue, num_players, sportId, userId, id,
    }) {
      return this.update({
        dueDate, venue, num_players, sportId, userId,
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
      references: {
        model: 'Sport',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};

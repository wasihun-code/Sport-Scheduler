/* eslint-disable no-unused-vars */
const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PlayersName extends Model {
    static associate(models) {
      this.belongsTo(models.Session, {
        foreignKey: {
          name: 'sessionId',
          allowNull: false,
          onDelete: 'CASCADE',
        },
      });
    }

    static async add_players(players, sessionId) {
      const playersList = players.trim().split(','); // ['Player 1', 'Player 2', 'Player 3', ....]
      await playersList.forEach((name) => {
        this.create({
          name,
          sessionId,
        });
      });
    }

    static async update_players(players, sessionId) {
      const playersList = players.trim().split(','); // ['Player 1', 'Player 2', 'Player 3', ....]
      await playersList.forEach((name) => {
        this.update({
          name,
        }, {
          where: {
            sessionId,
          },
        });
      });
    }

    static async remove_player(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
  }
  PlayersName.init({
    name: DataTypes.STRING,
    sessionId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'PlayersName',
  });
  return PlayersName;
};

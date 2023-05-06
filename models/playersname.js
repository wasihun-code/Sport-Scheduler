/* eslint-disable no-unused-vars */
const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PlayersName extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

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

'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PlayersName extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PlayersName.init({
    name: DataTypes.STRING,
    sessionId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'PlayersName',
  });
  return PlayersName;
};
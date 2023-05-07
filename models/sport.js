const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    static associate(models) {
      this.hasMany(models.Session, {
        foreignKey: 'sportId',
      });
    }

    static create_sport(title) {
      return this.create({
        title,
      });
    }
  }

  Sport.init({
    title: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Sport',
  });
  return Sport;
};

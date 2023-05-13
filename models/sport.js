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

    static create_sport(title, adminId) {
      return this.create({
        title,
        adminId,
      });
    }
  }

  Sport.init({
    title: DataTypes.STRING,
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sport',
        key: 'id',
      },
    },
  }, {
    sequelize,
    modelName: 'Sport',
  });
  return Sport;
};

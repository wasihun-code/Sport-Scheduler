/* eslint-disable no-console */
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

    static get_all_sports_user(adminId) {
      return this.findAll({
        where: {
          adminId,
        },
      });
    }

    static create_sport(title, adminId) {
      return this.create({
        title,
        adminId,
      });
    }

    static update_sport(title, adminId, id) {
      return this.update({
        title,
        adminId,
      }, {
        where: {
          id,
        },
      });
    }

    static remove_sport(id) {
      return this.destroy({
        where: {
          id,
        },
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

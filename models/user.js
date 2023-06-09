/* eslint-disable no-console */
/* eslint-disable camelcase */
const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
      this.hasMany(models.Session, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
    }

    static add_user(first_name, last_name, email, password, is_admin) {
      return this.create({
        first_name,
        last_name,
        email,
        password,
        is_admin,
      });
    }
  }

  User.init({
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    is_admin: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};

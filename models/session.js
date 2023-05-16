/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

const {
  Model, Op,
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

      this.belongsTo(models.User, {
        foreignKey: {
          name: 'userId',
          allowNull: false,
          onDelete: 'CASCADE',
        },
      });

      this.hasMany(models.PlayersName, {
        foreignKey: 'sessionId',
        onDelete: 'CASCADE',
      });
    }

    static get_past_sessions(sportId) {
      return this.findAll({
        where: {
          sportId,
          dueDate: {
            [Op.lt]: new Date(),
          },
        },
      });
    }

    static get_current_sessions_of_other_users(sportId, userId) {
      return this.findAll({
        where: {
          sportId,
          dueDate: {
            [Op.gt]: new Date(),
          },
          userId: {
            [Op.not]: userId,
          },
          canceled: false,
        },
      });
    }

    static get_current_sessions_of_user(sportId, userId) {
      return this.findAll({
        where: {
          sportId,
          dueDate: {
            [Op.gt]: new Date(),
          },
          userId,
          canceled: false,
        },
      });
    }

    static async joined_session(sportId, sessionIds) {
      const sessions = await Promise.all(sessionIds.map((sessionId) => this.findAll({
        where: {
          sportId,
          id: sessionId,
          dueDate: {
            [Op.gt]: new Date(),
          },
          canceled: false,
        },
      })));
      return sessions.flat();
    }

    static get_all_sessions(sportId) {
      return this.findAll({
        where: {
          sportId,
        },
      });
    }

    static canceled_sessions(sportId) {
      return this.findAll({
        where: {
          sportId,
          canceled: true,
          dueDate: {
            [Op.gt]: new Date(),
          },
        },
      });
    }

    static toggle_cancel(id, canceled, reason) {
      return this.update(
        {
          canceled,
          reason,
        },
        {
          where: {
            id,
          },
        },
      )
        .then((updatedRows) => {
          console.log('Updated rows:', updatedRows);
        })
        .catch((error) => {
          console.log('Update error:', error);
        });
    }

    static add_session(dueDate, venue, num_players, sportId, userId) {
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

    // eslint-disable-next-line max-len
    static update_existing_session(dueDate, venue, num_players, sportId, userId, id) {
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
    canceled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reason: {
      type: DataTypes.TEXT,
      defaultValue: null,
    },
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};

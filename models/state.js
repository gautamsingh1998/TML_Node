"use strict";
const { Model } = require("sequelize");

const path = require("path");

const City = require(path.join(__dirname, "city"));
module.exports = (sequelize, DataTypes) => {
  class state extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      state.belongsTo(models.Country, { foreignKey: "countryId" });
    }
  }
  state.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isoCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      countryCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "state",
    }
  );
  return state;
};

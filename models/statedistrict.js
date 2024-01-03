// models/stateDistrict.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class StateDistrict extends Model {
    static associate(models) {
      // Define associations if needed
    }
  }
  StateDistrict.init(
    {
      state: DataTypes.STRING,
      districts: {
        type: DataTypes.STRING(5000),
        allowNull: false,
      },
      statecode: {
        type: DataTypes.STRING(),
      },
    },
    {
      sequelize,
      modelName: "StateDistrict",
    }
  );
  return StateDistrict;
};

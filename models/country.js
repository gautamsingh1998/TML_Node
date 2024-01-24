"use strict";
const { Model } = require("sequelize");
const { DataTypes } = require("sequelize");
const path = require("path");
const City = require(path.join(__dirname, "city"));

module.exports = (sequelize, DataTypes) => {
  class country extends Model {
    static associate(models) {
      // Use 'country' instead of 'Country'
      //country.hasMany(models.State);
      //country.belongsToMany(models.City, { through: models.State });
    }
  }
  country.init(
    {
      isoCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phonecode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      flag: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      currency: {
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
      modelName: "country",
    }
  );
  return country;
};

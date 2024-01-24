"use strict";
const { Model } = require("sequelize");
const path = require("path");
const State = require(path.join(__dirname, "state"));
const Country = require("./country");
const City = require("./city");

module.exports = (sequelize, DataTypes) => {
  class city extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Add this section at the end of the file
      // city.belongsTo(State);
      //Country.hasMany(State);
      // Country.hasMany(City, { through: State });
      //city.belongsTo(models.State, { foreignKey: "stateId" });
    }
  }

  city.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "city",
    }
  );
  return city;
};

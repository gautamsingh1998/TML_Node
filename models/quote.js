"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Quote extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Quote.init(
    {
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      author: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Quote",
    }
  );
  return Quote;
};

"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

// Create a Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Import models
const UserModel = require("./user");
const TaskModel = require("./task");
const StateDistrictModel = require("./statedistrict");

// Initialize models with sequelize instance
const User = UserModel(sequelize, Sequelize);
const Task = TaskModel(sequelize, Sequelize);
const StateDistrict = StateDistrictModel(sequelize, Sequelize);

// Set models in the db object
db.User = User;
db.Task = Task;
db.Task = StateDistrict;
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Read all files in the current directory and load models
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Associate models if they have an 'associate' method
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;

# TML_Node

A code repo for learning JavaScript.

# Setup Project

mkdir TML_Node
cd TML_Node
npm init -y

npm install express sequelize sequelize-cli mysql2 dotenv

npx sequelize-cli init

# Create a Model and Migration

npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string

# Run Migrations

npx sequelize-cli db:migrate

# Rollback Migration

npx sequelize-cli db:migrate:undo

npx sequelize-cli db:migrate:undo:all // all migration file

# Bcrypt and jsonwebtoken

npm install bcrypt
npm install jsonwebtoken bcrypt

# generateSecret.js

const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
console.log(secret);
node generateSecret.js

# Token expires Time

expiresIn: "365d", // or set it to a very long duration, e.g., "365d" for 365 days

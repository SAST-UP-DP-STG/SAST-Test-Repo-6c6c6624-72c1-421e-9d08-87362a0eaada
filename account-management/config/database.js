const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const storage = path.join(__dirname, '..', 'data', 'app.db');
fs.mkdirSync(path.dirname(storage), { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false
});

module.exports = sequelize;
